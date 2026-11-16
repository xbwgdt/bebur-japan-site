import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import applications from "../content/ja/applications.json";
import articles from "../content/ja/insights.json";

describe("approved manufacturer article illustrations", () => {
  it("also keeps the approved illustrations in the local outage fallback",()=>{
    const manifest = JSON.parse(fs.readFileSync("content/source/article-image-completion-20261116.json","utf8"));
    for(const page of manifest.pages){
      const record=(page.type==="page"?applications:articles).find(r=>r.slug===page.slug)!;
      for(const key of page.additions){
        const asset=manifest.assets.find((a:{key:string})=>a.key===key);
        expect(record.images).toContainEqual({src:asset.path,alt:asset.alt});
      }
      if(page.leadAsset)expect(record.images[0].src).toBe(manifest.assets.find((a:{key:string})=>a.key===page.leadAsset).path);
    }
  });
  it("keeps the exact approved scope, original sources, Japanese captions and localized technical values", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/source/article-image-completion-20261116.json"), "utf8"));
    expect(manifest.pages.map((p: { slug: string }) => p.slug).sort()).toEqual([
      "bt8200-cold-plate-liquid-cooling", "bt8200-liquid-cooling", "gt-3280-ou-landfill", "liquid-cooled-plate-cleanliness", "manifold-cleanliness", "ozone-detector-brands-2026", "ozone-monitoring-equipment", "plate-heat-exchanger-cleanliness", "scm530-jiangsu-power-plant", "water-ozone-analyzer-beverage",
    ].sort());
    expect(manifest.pages.flatMap((p: { additions: string[] }) => p.additions)).toHaveLength(13);
    const keys = new Set(manifest.assets.map((a: { key: string }) => a.key));
    for (const page of manifest.pages) {
      expect(page.sourceUrl).toMatch(/^https:\/\/www\.bebur\.net\/en\//);
      for (const key of page.additions) expect(keys.has(key)).toBe(true);
    }
    for (const asset of manifest.assets) {
      expect(asset.sourceUrl).toMatch(/^https:\/\/www\.bebur\.net\/static\/upload\/image\//);
      expect(asset.path).toMatch(/^\/media\/article-completion\/[a-z0-9-]+\.(?:webp|jpg|png)$/);
      expect(fs.statSync(path.join(process.cwd(), "public", asset.path)).size).toBeGreaterThan(1000);
      expect(asset.alt).toMatch(/[ぁ-んァ-ン一-龯]/u);
      expect(asset.alt).not.toMatch(/[<>\u0000-\u001f]/u);
    }
    expect(manifest.translations.lightObscuration.channels).toEqual([
      [1, 2, 5], [2, 5, 4], [3, 10, 4], [4, 15, 4], [5, 20, 4], [6, 25, 4], [7, 30, 3], [8, 35, 0],
    ]);
    expect(manifest.translations.ozoneLeak.rangesPpm).toEqual([5, 50, 100]);
    expect(manifest.translations.ozoneLeak.outputs).toEqual(["4–20 mA", "RS485"]);
    expect(manifest.pages.find((p: { slug: string }) => p.slug === "gt-3280-ou-landfill").leadAsset).toBe("landfill-instrument");
    expect(manifest.pages.find((p: { slug: string }) => p.slug === "gt-3280-ou-landfill").retainedCaption).toBe("埋立地の生態修復プロジェクト施設の外観");
  });
});
