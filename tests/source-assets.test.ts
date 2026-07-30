import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PageFamily = {
  route: string;
  family: string;
  sourceUrl: string;
  localAssets: string[];
};

const pageFamilyManifestPath = path.join(
  process.cwd(),
  "content",
  "source",
  "page-family-manifest.json",
);

describe("source page-family assets", () => {
  it("captures a local visual reference for every representative route", async () => {
    const pageFamilies = JSON.parse(
      await readFile(pageFamilyManifestPath, "utf8"),
    ) as PageFamily[];

    expect(pageFamilies.map(({ family }) => family).toSorted()).toEqual([
      "about",
      "application",
      "contact",
      "home",
      "insight",
      "product-detail",
      "product-index",
    ]);
    expect(new Set(pageFamilies.map(({ family }) => family)).size).toBe(7);

    for (const pageFamily of pageFamilies) {
      expect(pageFamily.route).toMatch(/^\//);
      expect(pageFamily.sourceUrl).toMatch(/^https:\/\/www\.bebur\.net\/en\//);
      expect(pageFamily.localAssets.length, pageFamily.family).toBeGreaterThan(0);
      expect(
        pageFamily.localAssets.every((asset) => asset.startsWith("/source-media/")),
        pageFamily.family,
      ).toBe(true);
      await Promise.all(
        pageFamily.localAssets.map((asset) =>
          readFile(path.join(process.cwd(), "public", asset.slice(1))),
        ),
      );
    }
  });
});
