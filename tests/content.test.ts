import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  getAboutPages,
  getAllRoutes,
  getAllSourceUrls,
  getApplications,
  getArticles,
  getProducts,
  getStaticPages,
} from "../lib/content";
import { isAllowedFinalImageUrl } from "../scripts/asset-policy.mjs";
import type {
  AboutPage,
  Application,
  Article,
  ContentBase,
  Product,
  ProductCategory,
  StaticPage,
} from "../lib/types";

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
const japaneseContentDirectory = path.join(process.cwd(), "content", "ja");
const execFileAsync = promisify(execFile);
const approvedProductCategories = new Set<ProductCategory>([
  "cleanliness",
  "dosing",
  "water-quality",
  "gas-detection",
  "flow-level",
]);
const forbiddenContactPattern =
  /18001379750|010-87653191|0838-2236056|sales@bebur\.net|wechat|douyin|陕ICP备/i;
const japanesePattern = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const technicalOnlyPattern =
  /^(?:https?:\/\/\S+|[A-Za-z0-9][A-Za-z0-9+./%°℃µμΩ×–—,:()[\]{}<>=\s-]*)$/u;

type JapaneseContent =
  | Product
  | Application
  | Article
  | AboutPage
  | StaticPage;

async function readManifest(): Promise<SourcePage[]> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as SourcePage[];
}

async function readAssetMap(): Promise<Record<string, string>> {
  return JSON.parse(
    await readFile(assetMapPath, "utf8"),
  ) as Record<string, string>;
}

function getAllContent(): JapaneseContent[] {
  return [
    ...getProducts(),
    ...getApplications(),
    ...getArticles(),
    ...getAboutPages(),
    ...getStaticPages(),
  ];
}

function expectJapaneseOrTechnicalOnly(value: string, context: string): void {
  const normalized = value.trim();

  expect(normalized, context).not.toBe("");
  expect(
    japanesePattern.test(normalized) || technicalOnlyPattern.test(normalized),
    `${context}: ${normalized}`,
  ).toBe(true);
}

function expectStableRouteTitleOrder(records: ContentBase[]): void {
  expect(records).toEqual(
    records
      .toSorted(
        (left, right) =>
          left.route.localeCompare(right.route, "ja") ||
          left.title.localeCompare(right.title, "ja"),
      ),
  );
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

describe("Japanese content catalog", () => {
  it("represents every approved source URL exactly once", async () => {
    const manifest = await readManifest();
    const expectedSourceUrls = manifest.map(({ sourceUrl }) => sourceUrl);
    const representedSourceUrls = getAllSourceUrls();

    expect(manifest).toHaveLength(112);
    expect(representedSourceUrls).toHaveLength(112);
    expect(new Set(representedSourceUrls).size).toBe(112);
    expect(representedSourceUrls.toSorted()).toEqual(
      expectedSourceUrls.toSorted(),
    );
  });

  it("uses a unique canonical route for every Japanese record", () => {
    const records = getAllContent();
    const routes = records.map(({ route }) => route);

    expect(new Set(routes).size).toBe(routes.length);
    expect(getAllRoutes()).toEqual(routes.toSorted());
  });

  it("provides Japanese titles, descriptions, and public body prose", () => {
    for (const record of getAllContent()) {
      expect(record.title, record.sourceUrl).toMatch(japanesePattern);
      expect(record.description, record.sourceUrl).toMatch(japanesePattern);

      for (const [sectionIndex, section] of record.sections.entries()) {
        expectJapaneseOrTechnicalOnly(
          section.heading,
          `${record.sourceUrl} section ${sectionIndex} heading`,
        );
        for (const [paragraphIndex, paragraph] of section.paragraphs.entries()) {
          expectJapaneseOrTechnicalOnly(
            paragraph,
            `${record.sourceUrl} section ${sectionIndex} paragraph ${paragraphIndex}`,
          );
        }
        for (const [bulletIndex, bullet] of (
          section.bullets ?? []
        ).entries()) {
          expectJapaneseOrTechnicalOnly(
            bullet,
            `${record.sourceUrl} section ${sectionIndex} bullet ${bulletIndex}`,
          );
        }
      }
    }

    for (const product of getProducts()) {
      if (product.principle !== undefined) {
        expect(product.principle, `${product.sourceUrl} principle`).toMatch(
          japanesePattern,
        );
      }
      for (const [index, feature] of product.features.entries()) {
        expectJapaneseOrTechnicalOnly(
          feature,
          `${product.sourceUrl} feature ${index}`,
        );
      }
      for (const [index, application] of product.applications.entries()) {
        expectJapaneseOrTechnicalOnly(
          application,
          `${product.sourceUrl} application ${index}`,
        );
      }
    }
  });

  it("contains no forbidden contact or China platform strings", async () => {
    const files = [
      "products.json",
      "applications.json",
      "about.json",
      "insights.json",
      "pages.json",
    ];
    const content = (
      await Promise.all(
        files.map((file) =>
          readFile(path.join(japaneseContentDirectory, file), "utf8"),
        ),
      )
    ).join("\n");

    expect(content).not.toMatch(forbiddenContactPattern);
    expect(content).not.toContain("正規販売店");
    expect(content).not.toContain("お問い合わせ窓口");
  });

  it("uses the approved Japanese distributor and contact details exactly", () => {
    const contactPage = getStaticPages().find(
      ({ route }) => route === "/contact",
    );
    const contactContent = JSON.stringify(contactPage);

    expect(contactPage).toBeDefined();
    expect(contactContent).toContain(
      "Bebur 日本総代理店｜新樹産業株式会社",
    );
    expect(contactContent).toContain(
      "〒340-0043 埼玉県草加市草加2－13－21－7",
    );
    expect(contactContent).toContain("080-5189-8663");
    expect(contactContent).toContain("info@newtree-i.com");
  });

  it("uses only local images that resolve to existing public files", async () => {
    for (const record of getAllContent()) {
      for (const image of record.images) {
        expect(image.src, record.sourceUrl).toMatch(
          /^\/(?:products|applications)\//,
        );
        expect(image.src, record.sourceUrl).not.toMatch(/^https?:\/\//);
        expect(image.alt, record.sourceUrl).toMatch(japanesePattern);
        await expect(
          readFile(path.join(process.cwd(), "public", image.src.slice(1))),
          `${record.sourceUrl}: ${image.src}`,
        ).resolves.toBeInstanceOf(Buffer);
      }
    }
  });

  it("defines complete products and preserves usable specifications", () => {
    const products = getProducts();

    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.kind).toBe("product");
      expect(product.model.trim(), product.sourceUrl).not.toBe("");
      expect(
        approvedProductCategories.has(product.category),
        product.sourceUrl,
      ).toBe(true);
      expect(
        product.features.length + product.applications.length,
        product.sourceUrl,
      ).toBeGreaterThan(0);
      expect(product.sourceUrl, product.slug).toMatch(
        /^https:\/\/www\.bebur\.net\/en\/list_(?:4[6-9]|50)\/\d+\.html$/,
      );

      for (const specification of product.specifications) {
        expect(specification.label, product.sourceUrl).toMatch(
          japanesePattern,
        );
        expect(specification.value.trim(), product.sourceUrl).not.toBe("");
      }
    }
  });

  it("preserves technical specifications embedded in source prose", () => {
    const fixtures: Array<{
      category: ProductCategory;
      slug: string;
      sourceValues: string[];
    }> = [
      {
        category: "water-quality",
        slug: "bt6308-do",
        sourceValues: [
          "0-20mg/L",
          "0-200% saturation",
          "T90:60 seconds",
          "NTC10K",
          "5 bar(72.5 PST)",
          "IP68",
          "4~20mA",
          "12-36V DC",
        ],
      },
      {
        category: "gas-detection",
        slug: "bt3500-oz",
        sourceValues: [
          "254nm",
          "72 hours",
          "0-200mg/NL",
          "0.1mg/NL",
          "±3%",
          "0.5±0.2L/min",
          "≤1bar(0.1MPa)",
          "AC 220V±10%50Hz",
          "340mm",
          "12 months",
        ],
      },
      {
        category: "flow-level",
        slug: "msf8100",
        sourceValues: [
          "DN6 - DN50",
          "-0.1MPa to 6.3MPa",
          "316L",
          "1:150",
          "18-36VDC",
          "IP65/IP67",
        ],
      },
    ];

    for (const fixture of fixtures) {
      const product = getProducts(fixture.category).find(
        ({ slug }) => slug === fixture.slug,
      );
      const localizedProduct = JSON.stringify(product);

      expect(product, fixture.slug).toBeDefined();
      for (const sourceValue of fixture.sourceValues) {
        expect(localizedProduct, `${fixture.slug}: ${sourceValue}`).toContain(
          sourceValue,
        );
      }
    }
  });

  it("publishes every source gas range as actual product data", async () => {
    const manifest = await readManifest();
    const fixtures: Array<{
      sourcePath: string;
      category: ProductCategory;
      slug: string;
      headerCells: number;
      rowWidth: number;
      technicalCellIndexes: number[];
    }> = [
      {
        sourcePath: "/en/list_49/224.html",
        category: "gas-detection",
        slug: "as-300-toxic",
        headerCells: 5,
        rowWidth: 5,
        technicalCellIndexes: [2, 3, 4],
      },
      {
        sourcePath: "/en/list_49/226.html",
        category: "gas-detection",
        slug: "as-525-toxic",
        headerCells: 4,
        rowWidth: 4,
        technicalCellIndexes: [1, 2, 3],
      },
      {
        sourcePath: "/en/list_49/228.html",
        category: "gas-detection",
        slug: "as-525-toxic-online",
        headerCells: 4,
        rowWidth: 4,
        technicalCellIndexes: [1, 2, 3],
      },
      {
        sourcePath: "/en/list_49/219.html",
        category: "gas-detection",
        slug: "at-2000",
        headerCells: 4,
        rowWidth: 4,
        technicalCellIndexes: [1, 2, 3],
      },
    ];
    const normalizeTechnicalText = (value: string): string =>
      value.normalize("NFKC").replace(/\s+/g, "");

    for (const fixture of fixtures) {
      const source = manifest.find(
        ({ sourcePath }) => sourcePath === fixture.sourcePath,
      );
      const product = getProducts(fixture.category).find(
        ({ slug }) => slug === fixture.slug,
      );
      const sourceCells = source?.tables.at(-1)?.rows.flat() ?? [];
      const localizedProduct = normalizeTechnicalText(
        JSON.stringify({ ...product, sourceUrl: undefined }),
      );

      expect(source, fixture.sourcePath).toBeDefined();
      expect(product, fixture.slug).toBeDefined();
      expect(
        (sourceCells.length - fixture.headerCells) % fixture.rowWidth,
        fixture.sourcePath,
      ).toBe(0);

      for (
        let rowStart = fixture.headerCells;
        rowStart < sourceCells.length;
        rowStart += fixture.rowWidth
      ) {
        for (const cellIndex of fixture.technicalCellIndexes) {
          const sourceValue = sourceCells[rowStart + cellIndex];
          expect(
            localizedProduct,
            `${fixture.slug}: ${sourceValue}`,
          ).toContain(normalizeTechnicalText(sourceValue));
        }
      }

      expect(localizedProduct, fixture.slug).not.toMatch(
        /(?:source|全範囲|全て保持|すべて保持)/i,
      );
    }
  });

  it("retains AS-300 technical-parameter facts from the first source table", async () => {
    const manifest = await readManifest();
    const fixtures: Array<{
      sourcePath: string;
      slug: string;
      sourcePhrase: string;
    }> = [
      {
        sourcePath: "/en/list_49/220.html",
        slug: "as-300-infrared",
        sourcePhrase: "Operating pressure",
      },
      {
        sourcePath: "/en/list_49/221.html",
        slug: "as-300-multi-gas",
        sourcePhrase: "Work pressure",
      },
      {
        sourcePath: "/en/list_49/222.html",
        slug: "as-300-voc",
        sourcePhrase: "Operating pressure",
      },
      {
        sourcePath: "/en/list_49/223.html",
        slug: "as-300-combustible",
        sourcePhrase: "Operating pressure",
      },
      {
        sourcePath: "/en/list_49/224.html",
        slug: "as-300-toxic",
        sourcePhrase: "Operating pressure",
      },
    ];

    for (const fixture of fixtures) {
      const source = manifest.find(
        ({ sourcePath }) => sourcePath === fixture.sourcePath,
      );
      const product = getProducts("gas-detection").find(
        ({ slug }) => slug === fixture.slug,
      );
      const sourceTechnicalParameters = JSON.stringify(source?.tables[0]);
      const publicProduct = JSON.stringify({ ...product, sourceUrl: undefined });

      expect(sourceTechnicalParameters, fixture.sourcePath).toContain(
        fixture.sourcePhrase,
      );
      expect(publicProduct, fixture.slug).toContain("標準大気圧 ±10%");
      expect(publicProduct, fixture.slug).toContain("検知器本体");
      expect(publicProduct, fixture.slug).toContain("音響・視覚警報灯");
      expect(publicProduct, fixture.slug).toContain("リモートコントロール");
      expect(publicProduct, fixture.slug).toContain("取扱説明書");
      expect(publicProduct, fixture.slug).toContain("取付ブラケット");
      expect(publicProduct, fixture.slug).toContain("レインカバー");
    }
  });

  it("does not expose raw English prose in localized product fields", () => {
    const localizedProducts = JSON.stringify(
      getProducts().map(({ sourceUrl: _sourceUrl, ...publicProduct }) =>
        publicProduct,
      ),
    );
    const rawEnglishPhrases = [
      /\bred laser diode\b/i,
      /\bproportional control signal\b/i,
      /\bsample flow\b/i,
      /\bflow potential\b/i,
      /\bcharge requirement\b/i,
      /\bmetering pump\b/i,
      /\bfree chlorine analyzer\b/i,
      /\bstandard atmospheric pressure\b/i,
      /\bsource (?:table|record|title|value|gas list)\b/i,
      /\b(?:approximately|customized|excluding|expandable|whichever is|highest|dimensionless)\b/i,
      /\bevery \d/i,
      /\bthree-wire\b/i,
      /原典値・要技術確認/,
      /原典表は列対応が崩れているため/,
    ];

    for (const pattern of rawEnglishPhrases) {
      expect(localizedProducts).not.toMatch(pattern);
    }
  });

  it("resolves every related and recommended product slug", () => {
    const productSlugs = new Set(getProducts().map(({ slug }) => slug));

    for (const product of getProducts()) {
      for (const slug of product.relatedSlugs) {
        expect(productSlugs.has(slug), `${product.slug} -> ${slug}`).toBe(true);
      }
    }
    for (const application of getApplications()) {
      for (const slug of application.recommendedProductSlugs) {
        expect(
          productSlugs.has(slug),
          `${application.slug} -> ${slug}`,
        ).toBe(true);
      }
    }
    for (const article of getArticles()) {
      for (const slug of article.relatedProductSlugs) {
        expect(productSlugs.has(slug), `${article.slug} -> ${slug}`).toBe(true);
      }
    }
  });

  it("uses ISO publication dates when a source date is present", () => {
    for (const record of getAllContent()) {
      if (record.publishedAt !== undefined) {
        expect(record.publishedAt, record.sourceUrl).toMatch(
          /^\d{4}-\d{2}-\d{2}$/,
        );
      }
    }
  });

  it("keeps Exhibition Site out of the product catalog", () => {
    expect(
      getProducts().some(({ sourceUrl }) =>
        new URL(sourceUrl).pathname.startsWith("/en/list_45"),
      ),
    ).toBe(false);
  });

  it("returns stable ordered copies instead of mutable JSON references", () => {
    const lists = [
      getProducts(),
      getApplications(),
      getArticles(),
      getAboutPages(),
      getStaticPages(),
    ];

    for (const list of lists) {
      expectStableRouteTitleOrder(list);
    }

    const products = getProducts();
    const originalTitle = products[0]?.title;
    if (products[0]) {
      products[0].title = "変更済み";
      products[0].features.push("変更済み");
    }

    expect(getProducts()[0]?.title).toBe(originalTitle);
    expect(getProducts()[0]?.features).not.toContain("変更済み");
  });
});

describe("content audit CLI", () => {
  it("reports a clean 112-source migration audit", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [path.join(process.cwd(), "scripts", "audit-content.mjs")],
      { cwd: process.cwd() },
    );

    expect(stderr).toBe("");
    expect(stdout).toMatch(/source record count:\s*112/i);
    expect(stdout).toMatch(/represented source URL count:\s*112/i);
    expect(stdout).toMatch(/unmapped source URLs:\s*0/i);
    expect(stdout).toMatch(/multiply mapped source URLs:\s*0/i);
    expect(stdout).toMatch(/duplicate routes:\s*0/i);
    expect(stdout).toMatch(/missing local images:\s*0/i);
    expect(stdout).toMatch(/forbidden contact matches:\s*0/i);
    expect(stdout).toMatch(/unresolved related-product references:\s*0/i);
  });
});
