import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import articles from "../content/ja/insights.json";
import assetMap from "../content/source/asset-map.json";
import localized from "../content/source/six-image-localization-20261116.json";

const originals: Record<string, string[]> = {
  "yunnan-water-quality-exchange": ["20251106/1762407070603328.jpg", "20251106/1762407003113430.jpg"],
  // Approved re-audit: keep LabSense, omit the unrelated generic factory visual.
  "particle-charge-analyzer-papermaking": ["20251106/1762406675188202.jpg"],
  "liquid-cooling-supply-chain-summit-2025": ["20251105/1762331908274932.jpg", "20251105/1762335015196653.png"],
  "global-data-center-liquid-cooling-conference-2025": ["20251105/1762334545196031.png"],
  "guangdong-guizhou-water-supply-conference-2025": ["20251105/1762329776632484.jpg"],
  "liquid-cooling-technology-conference-2025": ["20251105/1762329046159036.jpg", "20251105/1762329019256214.jpg", "20251105/1762328966142369.png"],
  "sichuan-water-technology-exhibition-2025": ["20251120/1763601600977764.jpg"],
  "liquid-particle-counter-brands": ["20260311/1773201229211214.jpg"],
  "online-residual-chlorine-analyzer-brands": ["20260327/1774589627282883.jpg"],
  "online-residual-chlorine-analyzer-recommendations": ["20260327/1774589627282883.jpg"],
  // Approved re-audit: the correct BT6308-CL/BC350 image is sufficient.
  "residual-chlorine-detector-brands-2026-april": ["20260327/1774589627282883.jpg"],
  "residual-chlorine-detector-brands-2026-march": ["20251114/1763099445589527.jpg"],
  "toc-analyzer-brands-2026": ["20260324/1774319324598474.jpg"],
  "toc-analyzer-brands-2026-march": ["20260323/1774251187149620.jpg", "20260323/1774251223120714.jpg"],
};

describe("approved original news image restoration", () => {
  for (const [slug, files] of Object.entries(originals)) {
    it(`retains the correct original images and Japanese descriptions for ${slug}`, () => {
      const article = articles.find(article => article.slug === slug)!;
      const expected = files.map(file => {
        const original = (assetMap as Record<string, string>)[`https://www.bebur.net/static/upload/image/${file}`];
        // Only the explicitly approved Japanese counterpart supersedes its
        // original; all other manufacturer-image expectations stay exact.
        return localized.assets.find(asset => asset.slug === slug && asset.oldPaths.includes(original))?.path ?? original;
      });
      expect(article.images.map(image => image.src)).toEqual(expected);
      for (const image of article.images) {
        expect(existsSync(path.join(process.cwd(), "public", image.src))).toBe(true);
        expect(image.alt).toMatch(/[ぁ-んァ-ヶ一-龯]/u);
        expect(image.alt).not.toBe(article.title);
      }
    });
  }

  it("retains editable Sanity cover and gallery fields", () => {
    const schema = readFileSync("sanity/schemaTypes/news.ts", "utf8");
    expect(schema).toContain('name: "coverImage"');
    expect(schema).toContain('name: "gallery"');
    expect(schema).toContain('title: "封面图片"');
    expect(schema).toContain('title: "图片库"');
  });
});
