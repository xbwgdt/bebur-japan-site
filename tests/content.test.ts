import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isAllowedFinalImageUrl } from "../scripts/asset-policy.mjs";

type SourcePage = {
  sourceUrl: string;
  sourcePath: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  tables: Array<{ headers: string[]; rows: string[][] }>;
  images: Array<{ src: string; alt: string }>;
};

const manifestPath = path.join(
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

async function readManifest(): Promise<SourcePage[]> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as SourcePage[];
}

async function readAssetMap(): Promise<Record<string, string>> {
  return JSON.parse(
    await readFile(assetMapPath, "utf8"),
  ) as Record<string, string>;
}

describe("asset redirect policy", () => {
  it("accepts approved HTTPS final image URLs", () => {
    expect(isAllowedFinalImageUrl("https://bebur.net/image.jpg")).toBe(true);
    expect(isAllowedFinalImageUrl("https://www.bebur.net/image.png")).toBe(
      true,
    );
  });

  it("rejects off-host or non-HTTPS final image URLs", () => {
    expect(isAllowedFinalImageUrl("https://cdn.example.com/image.jpg")).toBe(
      false,
    );
    expect(isAllowedFinalImageUrl("http://www.bebur.net/image.jpg")).toBe(
      false,
    );
    expect(isAllowedFinalImageUrl("not a URL")).toBe(false);
  });
});

describe("Bebur English source inventory", () => {
  it("contains the approved 112-page migration baseline", async () => {
    const pages = await readManifest();

    expect(pages).toHaveLength(112);
    expect(new Set(pages.map(({ sourceUrl }) => sourceUrl)).size).toBe(112);
    expect(pages.map(({ sourceUrl }) => sourceUrl)).toEqual(
      pages.map(({ sourceUrl }) => sourceUrl).toSorted(),
    );
  });

  it("contains normalized, complete source records", async () => {
    const pages = await readManifest();

    for (const page of pages) {
      expect(page.sourceUrl).toBeTruthy();
      expect(page.sourcePath).toMatch(/^\/en\//);
      expect(page.title).toBeTruthy();
      expect(page.sourceUrl).not.toContain("?p=/Do/area");
      expect(page.headings).toBeInstanceOf(Array);
      expect(page.paragraphs).toBeInstanceOf(Array);
      expect(page.tables).toBeInstanceOf(Array);
      expect(page.images).toBeInstanceOf(Array);

      for (const image of page.images) {
        expect(image.src).toMatch(/^https:\/\//);
      }
    }
  });

  it("does not retain excluded Chinese sales-contact details", async () => {
    const pages = await readManifest();

    expect(JSON.stringify(pages)).not.toMatch(
      /wechat|douyin|\bICP\b|sales@bebur\.net|18001379750|19981650051/i,
    );
  });
});

describe("Bebur reusable source assets", () => {
  it("maps allowed first-party images to existing public assets", async () => {
    const assetMap = await readAssetMap();
    const entries = Object.entries(assetMap);

    expect(entries.length).toBeGreaterThan(0);
    expect(Object.keys(assetMap)).toEqual(Object.keys(assetMap).toSorted());
    for (const [sourceUrl, publicUrl] of entries) {
      expect(["bebur.net", "www.bebur.net"]).toContain(
        new URL(sourceUrl).hostname,
      );
      expect(publicUrl).toMatch(/^\/(?:products|applications)\//);
      await expect(
        readFile(path.join(process.cwd(), "public", publicUrl.slice(1))),
      ).resolves.toBeInstanceOf(Buffer);
    }

    expect(entries.some(([, value]) => value.startsWith("/products/"))).toBe(
      true,
    );
    expect(
      entries.some(([, value]) => value.startsWith("/applications/")),
    ).toBe(true);
  });

  it("stores each downloaded binary hash only once", async () => {
    const assetMap = await readAssetMap();
    const localUrls = [...new Set(Object.values(assetMap))];
    const hashes = await Promise.all(
      localUrls.map(async (publicUrl) =>
        createHash("sha256")
          .update(
            await readFile(
              path.join(process.cwd(), "public", publicUrl.slice(1)),
            ),
          )
          .digest("hex"),
      ),
    );

    expect(new Set(hashes).size).toBe(localUrls.length);
  });

  it("stores Exhibition Site images as application assets", async () => {
    const pages = await readManifest();
    const assetMap = await readAssetMap();
    const exhibitionPage = pages.find(
      ({ sourcePath }) => sourcePath === "/en/list_45",
    );
    const mappedAssets =
      exhibitionPage?.images
        .map(({ src }) => assetMap[src])
        .filter((publicUrl): publicUrl is string => Boolean(publicUrl)) ?? [];

    expect(mappedAssets.length).toBeGreaterThan(0);
    expect(mappedAssets.every((publicUrl) =>
      publicUrl.startsWith("/applications/")
    )).toBe(true);
  });

  it("keeps every product-detail primary image under products", async () => {
    const pages = await readManifest();
    const assetMap = await readAssetMap();
    const productDetails = pages.filter(({ sourcePath }) =>
      /^\/en\/list_(?:4[6-9]|50)\/\d+\.html$/.test(sourcePath)
    );

    expect(productDetails.length).toBeGreaterThan(0);
    for (const page of productDetails) {
      const primaryImage = page.images.find(({ src, alt }) => {
        const hostname = new URL(src).hostname;
        return (
          alt.trim().length > 0 &&
          (hostname === "bebur.net" || hostname === "www.bebur.net")
        );
      });

      expect(primaryImage, page.sourcePath).toBeDefined();
      expect(assetMap[primaryImage!.src], page.sourcePath).toMatch(
        /^\/products\//,
      );
    }
  });
});
