// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeCarousel } from "@/components/home-carousel";
import { localHomeCarousel, resolveHomeCarousel, isSafeCarouselUrl } from "@/lib/home-carousel";
import { loadPublicSiteSettings, publicSiteSettings, resolvePublicSiteSettings } from "@/lib/site-settings";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import { homeCarouselField } from "@/sanity/schemaTypes/home-carousel";
import HomePage from "@/app/page";

let reducedMotion = false;
let motionChange: ((event: { matches: boolean }) => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({
    matches: reducedMotion,
    addEventListener: (_event: string, listener: typeof motionChange) => { motionChange = listener; },
    removeEventListener: vi.fn(),
  })) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); motionChange = undefined; });
const advance = (milliseconds = 8_000) => act(() => { vi.advanceTimersByTime(milliseconds); });
const current = () => screen.getByRole("button", { name: /スライド\dを表示/ , current: true });

describe("homepage carousel settings", () => {
  it("provides the six approved Japanese slides in original order", () => {
    expect(localHomeCarousel).toMatchObject({ enabled: true, autoPlay: true, intervalSeconds: 8 });
    expect(localHomeCarousel.slides.map(slide => slide.title)).toEqual([
      "欧州に生まれ、世界を支える。", "液冷システムの清浄度検査ソリューション", "上水処理・水質監視ソリューション",
      "水質・ガス監視ソリューション", "水質・ガス監視の専門ソリューション", "欧州発の計測技術を、世界へ。",
    ]);
    localHomeCarousel.slides.forEach((slide, index) => {
      expect(slide.image.src).toBe(`/media/home-carousel/slide-${index + 1}.webp`);
      expect(slide.image.alt).toMatch(/[ぁ-んァ-ヶ一-龯]/u);
      expect(slide.style.fontFamily).toBe("sans");
    });
  });
  it("uses local defaults only for an absent carousel, not disabled or empty slides", () => {
    expect(resolveHomeCarousel(undefined)).toEqual(localHomeCarousel);
    expect(resolveHomeCarousel({ enabled: false }).enabled).toBe(false);
    expect(resolveHomeCarousel({ slides: [] }).slides).toEqual([]);
    expect(resolvePublicSiteSettings({ homeCarousel: { slides: [] } }).homeCarousel.slides).toEqual([]);
  });
  it("fetches and preserves CMS edits and explicit slide reordering", async () => {
    const settings = await loadPublicSiteSettings(async () => ({ homeCarousel: {
      enabled: true, autoPlay: false, intervalSeconds: 12,
      slides: [2, 0].map(index => ({ ...localHomeCarousel.slides[index],
        title: index === 2 ? "編集した日本語タイトル" : localHomeCarousel.slides[index].title,
        image: { asset: { url: `https://cdn.sanity.io/images/project/production/${index}.webp` }, alt: "編集画像" },
        style: { color: "paleBlue", fontFamily: "serif", fontSize: "sm", alignment: "right" },
      })),
    } }));
    expect(settings.homeCarousel).toMatchObject({ autoPlay: false, intervalSeconds: 12 });
    expect(settings.homeCarousel.slides.map(slide => slide._key)).toEqual([localHomeCarousel.slides[2]._key, localHomeCarousel.slides[0]._key]);
    expect(settings.homeCarousel.slides[0]).toMatchObject({ title: "編集した日本語タイトル", style: { color: "paleBlue", fontFamily: "serif", fontSize: "sm", alignment: "right" } });
    expect(settings.homeCarousel.slides[0].image.src).toContain("cdn.sanity.io");
  });
  it.each(["//evil.test/image.jpg", "javascript:alert(1)", "http://evil.test/image.jpg", "/\\evil.test/image.jpg", "https://user:pass@evil.test/a", "https://", "/x\nunsafe"])("rejects unsafe image/action URL %s", value => {
    expect(isSafeCarouselUrl(value)).toBe(false);
    const settings = resolveHomeCarousel({ slides: [{ ...localHomeCarousel.slides[0], image: { asset: { url: value }, alt: "画像" }, primaryAction: { label: "リンク", href: value } }] });
    expect(settings.slides).toHaveLength(0);
  });
  it("accepts safe local/https URLs and bounds presentation and timer settings", () => {
    expect(isSafeCarouselUrl("/products")).toBe(true);
    expect(isSafeCarouselUrl("https://example.com/image.webp")).toBe(true);
    const settings = resolveHomeCarousel({ intervalSeconds: 99, slides: [{ ...localHomeCarousel.slides[0],
      image: { asset: { url: "/media/replaced.webp" }, alt: "変更画像" },
      style: { color: "#ffffff", fontFamily: "url(evil)", fontSize: "99px", alignment: "position:fixed" },
    }] });
    expect(settings.intervalSeconds).toBe(20);
    expect(resolveHomeCarousel({ intervalSeconds: 1 }).intervalSeconds).toBe(5);
    expect(resolveHomeCarousel({ intervalSeconds: NaN }).intervalSeconds).toBe(8);
    expect(settings.slides[0].style).toEqual({ color: "deepBlue", fontFamily: "sans", fontSize: "md", alignment: "left" });
  });
  it("keeps normal multiline CMS summaries editable without accepting markup", () => {
    const slide = { ...localHomeCarousel.slides[0], image: { asset: { url: "/media/home-carousel/slide-1.webp" }, alt: "製品群" } };
    expect(resolveHomeCarousel({ slides: [{ ...slide, summary: "一行目の説明。\n二行目の説明。" }] }).slides[0]?.summary).toBe("一行目の説明。 二行目の説明。");
    expect(resolveHomeCarousel({ slides: [{ ...slide, summary: "<script>危険</script>" }] }).slides).toEqual([]);
  });
  it("projects complete carousel data and exposes Chinese Studio controls", () => {
    expect(siteSettingsQuery).toMatch(/homeCarousel\s*\{/);
    expect(siteSettingsQuery).toMatch(/slides\[\]\s*\{/);
    const schema = readFileSync("sanity/schemaTypes/home-carousel.ts", "utf8");
    const serializedSchema = JSON.stringify(homeCarouselField);
    for (const field of ["enabled", "autoPlay", "intervalSeconds", "slides", "image", "primaryAction", "color", "fontFamily", "fontSize", "alignment"]) expect(serializedSchema).toContain(`"${field}"`);
    expect(schema).toContain("首页轮播");
    expect(readFileSync("sanity/schemaTypes/siteSettings.ts", "utf8")).toContain("homeCarouselField");
  });
});

describe("accessible homepage carousel", () => {
  it("exports every image and destination with one h1 and inactive slides inert", () => {
    const html = renderToStaticMarkup(<HomeCarousel settings={localHomeCarousel} />);
    expect((html.match(/<h1[ >]/g) ?? [])).toHaveLength(1);
    for (const slide of localHomeCarousel.slides) { expect(html).toContain(slide.title); expect(html).toContain(slide.primaryAction.href); }
    const { container } = render(<HomeCarousel settings={localHomeCarousel} />);
    expect(container.querySelectorAll('[aria-roledescription="スライド"]')).toHaveLength(6);
    expect(container.querySelectorAll('[aria-roledescription="スライド"][aria-hidden="true"][inert]')).toHaveLength(5);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    const images = container.querySelectorAll("img");
    expect(images[0].getAttribute("loading")).toBe("eager");
    expect(images[0].getAttribute("fetchpriority")).toBe("high");
    expect(images[1].getAttribute("loading")).toBe("lazy");
  });
  it("supports previous/next wrap and directly labeled current dots", () => {
    render(<HomeCarousel settings={localHomeCarousel} />);
    fireEvent.click(screen.getByRole("button", { name: "前のスライド" }));
    expect(current().getAttribute("aria-label")).toBe("スライド6を表示");
    fireEvent.click(screen.getByRole("button", { name: "次のスライド" }));
    expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    fireEvent.click(screen.getByRole("button", { name: "スライド3を表示" }));
    expect(current().getAttribute("aria-label")).toBe("スライド3を表示");
  });
  it("autoplays and permits manual pause/resume independently from focus", () => {
    render(<HomeCarousel settings={localHomeCarousel} />);
    advance(); expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    const pause = screen.getByRole("button", { name: "自動再生を一時停止" });
    fireEvent.focus(pause); fireEvent.click(pause);
    advance(); expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    fireEvent.click(screen.getByRole("button", { name: "自動再生を再開" }));
    advance(); expect(current().getAttribute("aria-label")).toBe("スライド3を表示");
  });
  it("pauses while hovered or focused and resumes when interaction leaves", () => {
    render(<HomeCarousel settings={localHomeCarousel} />);
    const region = screen.getByRole("region", { name: "Beburの製品とソリューション" });
    fireEvent.mouseEnter(region); advance(); expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    fireEvent.mouseLeave(region); advance(); expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    const link = screen.getByRole("link"); fireEvent.focus(link); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    fireEvent.blur(link, { relatedTarget: document.body }); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド3を表示");
  });
  it("does not silently enable autoplay after manual navigation when CMS disables it", () => {
    render(<HomeCarousel settings={{ ...localHomeCarousel, autoPlay: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "次のスライド" })); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    fireEvent.click(screen.getByRole("button", { name: "自動再生を再開" })); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド3を表示");
  });
  it("never autoplays with reduced motion, including after an explicit resume", () => {
    reducedMotion = true;
    render(<HomeCarousel settings={localHomeCarousel} />); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    fireEvent.click(screen.getByRole("button", { name: "自動再生を再開" })); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    fireEvent.click(screen.getByRole("button", { name: "次のスライド" }));
    expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
  });
  it("reacts to motion and document visibility changes and removes timers on unmount", () => {
    const { unmount } = render(<HomeCarousel settings={localHomeCarousel} />);
    act(() => motionChange?.({ matches: true })); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    act(() => motionChange?.({ matches: false }));
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange")); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド1を表示");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange")); advance();
    expect(current().getAttribute("aria-label")).toBe("スライド2を表示");
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it("renders nothing when explicitly disabled or empty so the page can use legacy hero", () => {
    const { container } = render(<HomeCarousel settings={{ ...localHomeCarousel, enabled: false }} />);
    expect(container.innerHTML).toBe("");
  });
  it.each([false, true])("retains the original homepage hero for disabled/empty carousel (%s)", async enabled => {
    const original = publicSiteSettings.homeCarousel;
    try {
      publicSiteSettings.homeCarousel = { ...localHomeCarousel, enabled, slides: [] };
      render(await HomePage());
      expect(screen.getByTestId("source-hero")).not.toBeNull();
      expect(screen.getByRole("heading", { level: 1, name: publicSiteSettings.homeHero.title })).not.toBeNull();
    } finally { publicSiteSettings.homeCarousel = original; }
  });
  it("integrates without removing the animated solution promotion or Japan contact", async () => {
    const { container } = render(await HomePage());
    expect(screen.getByRole("region", { name: "Beburの製品とソリューション" })).not.toBeNull();
    expect(container.querySelector(".solution-promotion__diagram.lc-editorial .flow")).not.toBeNull();
    expect(publicSiteSettings.companyName).toBe("新樹産業株式会社");
    expect(container.innerHTML).toContain("tel:080-5189-8663");
    expect(container.innerHTML).toContain("mailto:info@newtree-i.com");
  });
});
