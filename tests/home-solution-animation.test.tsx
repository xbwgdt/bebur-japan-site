import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { readFileSync } from "node:fs";
import { SolutionPromotion } from "@/components/solution-promotion";
import { localPublicSiteSettings, resolvePublicSiteSettings } from "@/lib/site-settings";
import { siteSettingsQuery } from "@/lib/sanity/queries";

describe("homepage solution animation", () => {
  it("gives the small diagram numbers and labels accessible default contrast", () => {
    const luminance = (hex: string) => {
      const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    };
    const colors = localPublicSiteSettings.homeSolution.diagramColors;
    for (const color of [colors.text, colors.accent]) {
      const values = [luminance(colors.background), luminance(color)].sort((a, b) => b - a);
      expect((values[0] + .05) / (values[1] + .05)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("reuses the native loop only on the homepage and preserves the solution copy and link", () => {
    const $ = load(renderToStaticMarkup(<SolutionPromotion animated />));
    expect($("h2").text()).toBe("液冷システムの清浄度検査ソリューション");
    expect($(".solution-promotion__action").attr("href")).toBe("/solutions/liquid-cooling-cleanliness-testing");
    expect($(".solution-promotion__diagram.lc-editorial .flow")).toHaveLength(1);
    expect($(".loop-mobile-sensors li")).toHaveLength(4);
    expect($("svg").text()).toContain("コールドプレート");
    expect($("svg").attr("viewBox")).toBe("70 20 480 330");
    const staticHtml = renderToStaticMarkup(<SolutionPromotion />);
    expect(staticHtml).not.toContain('class="flow"');
    expect(staticHtml).toContain(localPublicSiteSettings.homeSolution.image.src);
  });

  it("uses independently editable homepage diagram labels, duration, colors and font", () => {
    const settings = resolvePublicSiteSettings({ homeSolution: {
      diagram: { loop: "編集した循環系", conductivity: "編集した導電率", speed: 22, enabled: false },
      diagramColors: { background: "#FFFFFF", text: "#112233", line: "#224466", accent: "#006677" },
      style: { fontFamily: "serif", fontSize: "lg", color: "light" },
    } });
    const html = renderToStaticMarkup(<SolutionPromotion animated settings={settings} />);
    expect(html).toContain("編集した循環系");
    expect(html).toContain("編集した導電率");
    expect(html).toContain('data-motion="off"');
    expect(html).toContain("--flow-duration:22s");
    expect(html).toContain("--home-diagram-text:#112233");
    expect(html).toContain("contact-card--font-serif");
  });

  it("retains uploaded image mode and the original image fallback", () => {
    const settings = resolvePublicSiteSettings({ homeSolution: { diagram: { mode: "image" }, image: {
      alt: "変更した配置図", asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/home.jpg" },
    } } });
    const $ = load(renderToStaticMarkup(<SolutionPromotion animated settings={settings} />));
    expect($("img").attr("src")).toContain("home.jpg");
    expect($("img").attr("alt")).toBe("変更した配置図");
    expect($(".flow")).toHaveLength(0);
    const original = resolvePublicSiteSettings({ homeSolution: { diagram: { mode: "image" } } });
    expect(renderToStaticMarkup(<SolutionPromotion animated settings={original} />)).toContain(localPublicSiteSettings.homeSolution.image.src);
  });

  it("validates color and animation inputs without leaking unsafe styles", () => {
    const settings = resolvePublicSiteSettings({ homeSolution: {
      diagram: { speed: 999, mode: "bad", image: { asset: { url: "javascript:alert(1)" } } },
      diagramColors: { text: "red;background:url(https://invalid.test)" },
    } });
    const html = renderToStaticMarkup(<SolutionPromotion animated settings={settings} />);
    expect(html).toContain("--flow-duration:60s");
    expect(html).not.toContain("background:url");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('class="flow"');
  });

  it("prefers the new replacement image on home without changing the applications visual", () => {
    const settings = resolvePublicSiteSettings({ homeSolution: {
      image: { alt: "元の配置図", asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/original.jpg" } },
      diagram: { mode: "image", image: { alt: "新しい模式図", asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/replacement.jpg" } } },
    } });
    const home = load(renderToStaticMarkup(<SolutionPromotion animated settings={settings} />));
    const applications = load(renderToStaticMarkup(<SolutionPromotion settings={settings} />));
    expect(home("img").attr("src")).toContain("replacement.jpg");
    expect(home("img").attr("alt")).toBe("新しい模式図");
    expect(applications("img").attr("src")).toContain("original.jpg");
  });

  it("projects and exposes the new settings in Chinese Studio without removing existing image/style", () => {
    expect(siteSettingsQuery).toContain("diagramColors");
    expect(siteSettingsQuery).toMatch(/diagram\s*\{[^}]*\.\.\./);
    const schema = readFileSync("sanity/schemaTypes/siteSettings.ts", "utf8");
    expect(schema).toContain("liquidCoolingDiagramField");
    expect(schema).toContain("diagramColors");
    expect(schema).toContain("专题图片");
    expect(schema).toContain("配色、字号与字体");
  });

  it("keeps the compact mobile CTA on one line with a readable legend", () => {
    const css = readFileSync("app/liquid-cooling.css", "utf8");
    expect(css).toContain("font-size: clamp(.8125rem, 3.6vw, 1rem)");
    expect(css).toMatch(/\.solution-promotion__action\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).toMatch(/\.solution-promotion__diagram\.lc-editorial \.loop-mobile-legend\s*\{[^}]*font-size:\s*14px/);
  });
});
