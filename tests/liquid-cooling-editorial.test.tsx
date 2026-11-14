import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { localSolutionPage } from "@/lib/liquid-cooling";
import LiquidCoolingSolutionPage from "@/app/solutions/liquid-cooling-cleanliness-testing/page";
import { getPublishedPageForRoute } from "@/lib/cms-pages";

vi.mock("@/lib/cms-pages", () => ({ getPublishedPageForRoute: vi.fn(async () => null) }));

describe("English source editorial UI in Japanese", () => {
  it("does not reserve a missing image column for text-only related readings", async () => {
    const $=load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($("#related-readings article.reference")).toHaveLength(4);
    expect($("#related-readings article.prod")).toHaveLength(0);
    expect($("#products article.prod figure").length).toBeGreaterThan(0);
  });
  it("faithfully retains the source conclusion, three distinct points and separate audience", async () => {
    const $ = load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($(".tldr h2").text()).toBe("結論から");
    expect($(".tldr-answer").text()).toContain("4つの測定項目");
    expect($(".tldr-list li")).toHaveLength(3);
    expect($(".tldr-list li").eq(0).text()).toContain("溶存イオンと酸・アルカリのバランス");
    expect($(".tldr-list li").eq(1).text()).toContain("清浄度報告書が差し戻される最も多い原因");
    expect($(".tldr-list li").eq(2).text()).toContain("フィルタが機能しているのか");
    expect($(".tldr-fit").text()).toContain("清浄度報告書と受入判定を担当する品質技術者");
    expect($(".tldr-list").text()).not.toContain("対象：");
  });
  it("provides a readable mobile legend using the same editable diagram labels", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, liquidCoolingDesign: { diagram: { conductivity: "編集した導電率", sampling: "編集した採水" } } } as never);
    const $ = load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($(".loop-mobile-legend .loop-mobile-sensors li")).toHaveLength(4);
    expect($(".loop-mobile-legend").text()).toContain("02編集した導電率");
    expect($(".loop-mobile-legend").text()).toContain("編集した採水");
    expect($(".loop-mobile-legend").text()).toContain("コールドプレート");
    const css = readFileSync("app/liquid-cooling-editorial.css", "utf8");
    expect(css).toMatch(/\.loop-mobile-legend\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.loop-mobile-legend\s*\{[^}]*font-size:\s*14px/);
  });
  it("keeps mobile contact labels on one line without shrinking the tap target", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const rule = css.match(/\.mobile-contact-bar a\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(rule).toContain("white-space: nowrap");
    expect(rule).toContain("font-size: clamp(0.75rem, 3.5vw, 0.875rem)");
    expect(rule).toContain("min-height: 3rem");
  });
  it("keeps summary styling and the hero anchor editable", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({...localSolutionPage,blocks:localSolutionPage.blocks.map(block=>block._type==="hero"?{...block,anchorId:"edited-overview"}:block.anchorId==="summary"?{...block,color:"red",fontSize:"lg",alignment:"center",spacing:"compact"}:block)});
    const $=load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($(".site-head .brand").attr("href")).toBe("#edited-overview");
    expect($(".tldr").attr("style")??"").toContain("font-size:1.1em");
    expect($(".tldr").attr("style")??"").toContain("text-align:center");
    expect($(".tldr").hasClass("tldr--red")).toBe(true);
  });
  it("derives particle bars from the editable values, not row order", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({...localSolutionPage,blocks:localSolutionPage.blocks.map(block=>block._type==="dataTable"&&block.anchorId==="particle-scales"?{...block,rows:[...(block.rows??[])].reverse()}:block)});
    const $=load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($(".scale-row .bar i").first().attr("data-particle-size")).toBe("300");
    expect($(".scale-row .bar i").first().attr("style")).toBe("width:100%");
    expect($(".scale-row .bar i").last().attr("data-particle-size")).toBe("4");
    expect($(".scale-row .bar i").last().attr("style")).toBe("width:24.3%");
  });
  it("keeps logarithmic particle scaling finite for zero or nonnumeric CMS rows", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({...localSolutionPage,blocks:localSolutionPage.blocks.map(block=>block._type==="dataTable"&&block.anchorId==="particle-scales"?{...block,rows:[{cells:["0 µm","ゼロ"]},{cells:["未設定","数値なし"]},{cells:["10 µm","編集した粒径"]}]}:block)});
    const $=load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($(".scale-row .bar i").map((_,e)=>$(e).attr("style")).get()).toEqual(["width:0%","width:0%","width:100%"]);
  });
  it("honors existing hero typography controls without duplicating its action", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, blocks:localSolutionPage.blocks.map(block=>block._type==="hero"?{...block,fontSize:"lg",alignment:"center",desktopTitleWrap:"nowrap"}:block) });
    const html=renderToStaticMarkup(await LiquidCoolingSolutionPage());
    const $=load(html);
    expect($(".lc-hero").attr("style")).toContain("--hero-scale:1.14");
    expect($(".lc-hero h1").attr("data-title-wrap")).toBe("nowrap");
    expect($(".hero-cta a")).toHaveLength(3);
  });
  it("renders a native animated loop rather than the old static hero image", async () => {
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    expect(html).toContain('class="lc-editorial"');
    expect(html).toContain('class="flow"');
    expect(html).toContain('viewBox="0 0 620 350"');
    for (const label of ["二次側閉回路", "導電率", "濁度", "コールドプレート", "バイパス採水・脱気"]) expect(html).toContain(label);
    expect(html).not.toContain("Secondary closed loop");
    expect(html).toContain('class="timeline"');
    expect(html).toContain('class="faq"');
  });
  it("preserves all editable chapters and the reviewed technical rows", async () => {
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    for (const block of localSolutionPage.blocks) if (block.title) expect(html).toContain(block.title);
    expect(html).toContain("GB/T 48023-2026");
    expect(html).toContain("日本国内で一律に適用される規格一覧ではありません");
    expect(html).toContain("BS-EC350 現行仕様");
    expect(html).toContain("info@newtree-i.com");
    expect(html).toContain("080-5189-8663");
  });
  it("applies published CMS labels and safe palette to the actual diagram", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, liquidCoolingDesign: { theme: { accent: "#123456", heroText: "#FFFFFF" }, diagram: { loop: "編集した循環系", speed: 22, enabled: true }, eyebrow: "編集した技術特集" } } as never);
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    expect(html).toContain("編集した循環系");
    expect(html).toContain("編集した技術特集");
    expect(html).toContain("--teal:#123456");
    expect(html).toContain("--flow-duration:22s");
  });
  it("allows a CMS replacement image and refuses CSS or URL injection", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, liquidCoolingDesign: { theme: { accent: "red;background:url(https://invalid.test)" }, diagram: { mode: "image", image: { asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/replacement.jpg" }, alt: "変更した模式図" } }, navigation: [{ label: "危険なリンク", anchor: "javascript:alert(1)" }] } } as never);
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    expect(html).toContain("変更した模式図");
    expect(html).toContain("replacement.jpg");
    expect(html).not.toContain("background:url");
    expect(html).not.toContain("javascript:");
  });
  it("keeps motion scoped and respects reduced-motion and the CMS off switch", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, liquidCoolingDesign: { diagram: { enabled: false } } } as never);
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    expect(html).toContain('data-motion="off"');
    const css = readFileSync("app/liquid-cooling-editorial.css", "utf8");
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toContain(".lc-editorial .flow");
    expect(css).not.toMatch(/(?:^|\n)body\s*\{/);
  });
});
