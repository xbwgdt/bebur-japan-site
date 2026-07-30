import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PageFamily = {
  route: string;
  family: string;
  sourceUrl: string;
  localAssets: string[];
};

type SourcePage = {
  sourceUrl: string;
  sourcePath: string;
  visualReferences: Array<{ src: string; kinds: string[] }>;
};

const pageFamilyManifestPath = path.join(
  process.cwd(),
  "content",
  "source",
  "page-family-manifest.json",
);
const sourceManifestPath = path.join(
  process.cwd(),
  "content",
  "source",
  "source-manifest.json",
);
const assetMapPath = path.join(
  process.cwd(),
  "content",
  "source",
  "asset-map.json",
);

function isFirstPartyVisualReference(sourceUrl: string) {
  const hostname = new URL(sourceUrl).hostname;
  return hostname === "bebur.net" || hostname === "www.bebur.net";
}

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

  it("localizes every first-party rendered visual reference", async () => {
    const [pages, assetMap] = await Promise.all([
      readFile(sourceManifestPath, "utf8").then(
        (content) => JSON.parse(content) as SourcePage[],
      ),
      readFile(assetMapPath, "utf8").then(
        (content) => JSON.parse(content) as Record<string, string>,
      ),
    ]);
    const firstPartyVisualReferences = new Set(
      pages.flatMap(({ visualReferences }) =>
        visualReferences
          .filter(({ src }) => isFirstPartyVisualReference(src))
          .map(({ src }) => src),
      ),
    );

    expect(Object.keys(assetMap).toSorted()).toEqual(
      [...firstPartyVisualReferences].toSorted(),
    );
    await Promise.all(
      Object.values(assetMap).map((asset) =>
        readFile(path.join(process.cwd(), "public", asset.slice(1))),
      ),
    );
  });

  it("keeps each representative family asset tied to its declared source page", async () => {
    const [pageFamilies, pages, assetMap] = await Promise.all([
      readFile(pageFamilyManifestPath, "utf8").then(
        (content) => JSON.parse(content) as PageFamily[],
      ),
      readFile(sourceManifestPath, "utf8").then(
        (content) => JSON.parse(content) as SourcePage[],
      ),
      readFile(assetMapPath, "utf8").then(
        (content) => JSON.parse(content) as Record<string, string>,
      ),
    ]);

    for (const family of pageFamilies) {
      const sourcePage = pages.find(
        ({ sourceUrl }) => sourceUrl === family.sourceUrl,
      );
      expect(sourcePage, family.family).toBeDefined();
      const sourceAssets = new Set(
        sourcePage!.visualReferences
          .map(({ src }) => assetMap[src])
          .filter((asset): asset is string => Boolean(asset)),
      );
      expect(new Set(family.localAssets), family.family).toEqual(sourceAssets);
    }
  });
});
