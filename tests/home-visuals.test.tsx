import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { readFileSync } from "node:fs";
import HomePage from "@/app/page";
import { ContactCta } from "@/components/contact-cta";
import { localPublicSiteSettings, resolvePublicSiteSettings } from "@/lib/site-settings";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import { homeBackdropStyle, localHomeVisuals, resolveHomeVisuals } from "@/lib/home-visuals";

describe("approved home backgrounds and illustrations", () => {
  it("keeps fallback imagery and its description together for an incomplete CMS image", () => {
    for (const image of [{asset:{url:"https://evil.test/x.jpg"},alt:"別の画像"},{asset:{url:"https://cdn.sanity.io/images/gbzt89e5/production/new-100x100.jpg"},alt:"<script>"}]) {
      expect(resolveHomeVisuals({companyImage:image}).companyImage).toEqual(localHomeVisuals.companyImage);
    }
  });
  it("falls back for unsupported CDN ports", () => {
    expect(resolveHomeVisuals({ about: { image: { asset: { url: "https://cdn.sanity.io:444/images/gbzt89e5/production/x.jpg" } } } }).about).toEqual(localHomeVisuals.about);
  });
  it("accepts narrow project-owned CMS image edits and safe overlay settings", () => {
    const url = "https://cdn.sanity.io/images/gbzt89e5/production/edited-100x100.jpg";
    const settings = resolvePublicSiteSettings({ homeVisuals: {
      about: { image: { asset: { url }, alt: "編集した企業紹介の背景" }, overlayColor: "#123456", overlayOpacity: 0.4 },
      categoryImages: { cleanliness: { asset: { url }, alt: "編集した清浄度測定装置" } },
    } });
    expect(settings.homeVisuals.about.image).toEqual({ src: url, alt: "編集した企業紹介の背景" });
    expect(homeBackdropStyle(settings.homeVisuals.about)).toMatchObject({ "--section-background-image": `url("${url}")`, "--section-overlay": "rgba(18,52,86,0.4)" });
    expect(settings.homeVisuals.categoryImages.cleanliness.src).toBe(url);
    expect(settings.homeVisuals.contact).toEqual(localHomeVisuals.contact);
  });
  it.each(["javascript:alert(1)", "//evil.test/x.jpg", "https://evil.test/x.jpg", "https://cdn.sanity.io/images/other/production/x.jpg", "https://user:pass@cdn.sanity.io/images/gbzt89e5/production/x.jpg", "https://cdn.sanity.io/images/gbzt89e5/production/a\"),url(https://evil.test/x.jpg)"])("rejects untrusted image CSS input %s", url => {
    const result = resolveHomeVisuals({ contact: { image: { asset: { url }, alt: "<script>" }, overlayColor: "red);background:url(x)", overlayOpacity: 2 } });
    expect(result.contact).toEqual(localHomeVisuals.contact);
  });
  it("rejects invalid overlay numbers and preserves fallbacks without mutating shared defaults", () => {
    for (const overlayOpacity of [NaN, Infinity, -1, "0.5"]) expect(resolveHomeVisuals({ technology: { overlayOpacity } }).technology).toEqual(localHomeVisuals.technology);
    const result = resolveHomeVisuals(null);
    result.companyImage.alt = "変更";
    expect(localHomeVisuals.companyImage.alt).not.toBe("変更");
  });
  it("provides dedicated CMS visuals without changing carousel, animation or Japan contacts", () => {
    const settings = resolvePublicSiteSettings(undefined);
    expect(settings).toHaveProperty("homeVisuals.about.image.src", "/source-media/index-01-533820d3964dbe66.jpg");
    expect(settings).toHaveProperty("homeVisuals.technology.image.src", "/source-media/index-02-bb058a1b71082301.jpg");
    expect(settings.homeCarousel.slides).toHaveLength(6);
    expect(settings.phone).toBe("080-5189-8663");
    expect(settings.inquiryEmail).toBe("info@newtree-i.com");
    expect(settings.homeSolution.diagram).toEqual(localPublicSiteSettings.homeSolution.diagram);
  });
  it("renders five illustrated category links, four strengths and three visible section backgrounds", async () => {
    const $ = load(renderToStaticMarkup(await HomePage()));
    expect($(".category-card__media img")).toHaveLength(5);
    expect($(".technology-grid .technology-fact__image")).toHaveLength(4);
    for (const selector of [".source-home-about", ".technology-section", ".source-home-applications"]) {
      expect($(selector).attr("style")).toContain("--section-background-image:url(");
    }
    expect($(".category-card").map((_, el) => $(el).attr("href")).get()).toEqual([
      "/products/cleanliness", "/products/dosing", "/products/water-quality", "/products/gas-detection", "/products/flow-level",
    ]);
    expect($(".home-carousel")).toHaveLength(1);
    expect($(".solution-promotion .flow")).toHaveLength(1);
    $(".category-card__media img, .technology-fact__image").each((_, el) => expect($(el).attr("alt")).toMatch(/[ぁ-んァ-ヶ一-龯]/u));
  });
  it("uses the same editable manufacturer inquiry background in compact and standard CTAs", () => {
    for (const compact of [true, false]) {
      const $ = load(renderToStaticMarkup(<ContactCta compact={compact} />));
      expect($(".contact-cta").attr("style")).toContain("/media/home-visuals/inquiry-background.jpg");
      expect($('a[href="tel:080-5189-8663"]')).toHaveLength(1);
      expect($('a[href^="mailto:info@newtree-i.com"]')).toHaveLength(1);
    }
  });
  it("projects uploaded section and card assets instead of unexpanded references", () => {
    expect(siteSettingsQuery).toContain("homeVisuals {");
    expect(siteSettingsQuery).toContain("categoryImages {");
    expect(siteSettingsQuery).toContain("strengthImages {");
    const schema = readFileSync("sanity/schemaTypes/home-visuals.ts", "utf8");
    expect(schema).toContain('name: "homeVisuals"');
    expect(schema).not.toContain("hotspot: true");
  });
});
