import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import articles from "../content/ja/insights.json";
import assetMap from "../content/source/asset-map.json";

const originals: Record<string, string[]> = {
  "yunnan-water-quality-exchange": ["20251106/1762407070603328.jpg", "20251106/1762407003113430.jpg"],
  "particle-charge-analyzer-papermaking": ["20251106/1762406599465283.png", "20251106/1762406675188202.jpg"],
  "liquid-cooling-supply-chain-summit-2025": ["20251105/1762331908274932.jpg", "20251105/1762335015196653.png"],
  "global-data-center-liquid-cooling-conference-2025": ["20251105/1762334545196031.png"],
  "guangdong-guizhou-water-supply-conference-2025": ["20251105/1762329776632484.jpg"],
  "liquid-cooling-technology-conference-2025": ["20251105/1762329046159036.jpg", "20251105/1762329019256214.jpg", "20251105/1762328966142369.png"],
  "sichuan-water-technology-exhibition-2025": ["20251120/1763601600977764.jpg"],
};

describe("approved original news image restoration", () => {
  for (const [slug, files] of Object.entries(originals)) {
    it(`retains the correct original images and Japanese descriptions for ${slug}`, () => {
      const article = articles.find(article => article.slug === slug)!;
      const expected = files.map(file => (assetMap as Record<string, string>)[`https://www.bebur.net/static/upload/image/${file}`]);
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
