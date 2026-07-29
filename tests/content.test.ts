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

type PublicString = {
  path: string;
  value: string;
};

const structuralContentKeys = new Set([
  "category",
  "kind",
  "relatedProductSlugs",
  "relatedSlugs",
  "recommendedProductSlugs",
  "route",
  "slug",
  "sourceAliases",
  "sourceUrl",
  "src",
]);

// These are identifiers, acronyms, units, material trade names, or proper names.
// Ordinary English prose is deliberately absent from this list.
const allowedAsciiWords = new Set(
  [
    "bar",
    "beckman",
    "bebur",
    "beer",
    "biotector",
    "bit",
    "chp",
    "cm",
    "cortex",
    "coulter",
    "create",
    "createc",
    "db",
    "dh",
    "endress",
    "ex",
    "exd",
    "fi",
    "fisher",
    "ft",
    "gb",
    "g",
    "ag",
    "agcl",
    "hach",
    "hardness",
    "hastelloy",
    "hauser",
    "hz",
    "kg",
    "lambert",
    "lb",
    "luheng",
    "ma",
    "mg",
    "min",
    "mettler",
    "ml",
    "mm",
    "mmol",
    "modbus",
    "multisizer",
    "ms",
    "mv",
    "nm",
    "noryl",
    "ph",
    "pphm",
    "ppb",
    "ppm",
    "psig",
    "pt",
    "qyresearch",
    "rion",
    "ryton",
    "schreimer",
    "ta",
    "tb",
    "thermo",
    "ti",
    "toledo",
    "us",
    "uvsense",
    "vis",
    "vocs",
    "wi",
    "wpcxview",
    "wt",
    "xylem",
  ].map((word) => word.toLowerCase()),
);

function getPublicStrings(
  value: unknown,
  pathParts: Array<string | number> = [],
  key = "",
): PublicString[] {
  if (structuralContentKeys.has(key)) {
    return [];
  }
  if (typeof value === "string") {
    return [{ path: pathParts.join("."), value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      getPublicStrings(item, [...pathParts, index], key),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, childValue]) =>
      getPublicStrings(childValue, [...pathParts, childKey], childKey),
    );
  }
  return [];
}

function findDisallowedAsciiWords(
  record: JapaneseContent,
  productModelWords: Set<string>,
): Array<{ path: string; value: string; word: string }> {
  return getPublicStrings(record).flatMap(({ path: publicPath, value }) => {
    if (
      /^https?:\/\//i.test(value) ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return [];
    }

    // Explicit source/OCR anomalies are retained only when visibly marked.
    const scanValue = value
      .replace(/feric chloide(?=[^。]*原文表記・要確認)/gi, "")
      .replace(/Soil(?=[^。]*原文表記・要確認)/g, "")
      .replace(/m³p(?=[^。]*原文表記・要確認)/gi, "")
      .replace(/Norl(?=[^。]*原文表記・要確認)/gi, "")
      .replace(/\/on(?=」、要確認)/gi, "");

    return [...scanValue.matchAll(/(?<![A-Za-z0-9])[A-Za-z]+(?![A-Za-z0-9])/g)]
      .filter(({ 0: word }) => {
        const normalized = word.toLowerCase();
        return (
          word !== word.toUpperCase() &&
          !allowedAsciiWords.has(normalized) &&
          !productModelWords.has(normalized)
        );
      })
      .map(({ 0: word }) => ({
        path: publicPath,
        value,
        word,
      }));
  });
}

function normalizedTechnicalText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function extractSourceStandardsAndProtocols(source: SourcePage): string[] {
  // Product-detail paragraphs and tables contain the technical body. Headings
  // are excluded because the capture appends related-industry navigation.
  const sourceBody = [
    source.title,
    ...source.paragraphs,
    ...source.tables.flatMap(({ rows }) => rows.flat()),
  ].join("\n");
  const patterns = [
    /\bGB(?:\/T)?\s*\d+(?:\.\d+)?-\d+\b/gi,
    /\bHJ\s*\d+\b/gi,
    /\bISO\s*\d+(?:[-/][A-Z0-9]+)?\b/gi,
    /\bEN\s*\d+\b/gi,
    /\bANSI\s*\d+[A-Z]?\b/gi,
    /\b(?:MODBUS(?:\s+RTU)?|HART|RS-?232|RS-?485|GPRS|SCADA|DCS|PLC|PROFIBUS)\b/gi,
    /\bIP\s*\d{2}\b/gi,
    /\bCAN\b/g,
  ];

  return [
    ...new Set(
      patterns.flatMap((pattern) =>
        [...sourceBody.matchAll(pattern)].map(([token]) => token),
      ),
    ),
  ];
}

function extractSourceModelTokens(source: SourcePage): string[] {
  // Titles and product tables are body-owned. Excluding headings/paragraphs
  // avoids treating related-industry navigation and footer copy as product data.
  const sourceProductBody = [
    source.title,
    ...source.tables.flatMap(({ rows }) => rows.flat()),
  ].join("\n");

  return [
    ...new Set(
      (sourceProductBody.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? []).flatMap(
        (candidate) => {
          if (!/[0-9]{2}/.test(candidate)) {
            return [];
          }
          if (/^BT6308-[A-Za-z]/.test(candidate)) {
            return ["BT6308"];
          }
          if (
            /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(candidate) ||
            /^[A-Z0-9]+-pH$/.test(candidate)
          ) {
            return [candidate];
          }

          // Captured product-list labels such as BT6308-Residual describe a
          // family member in English; only the model prefix is an identifier.
          const familyPrefix = candidate.match(
            /^([A-Z][A-Z0-9]*[0-9]{2,})(?=-[A-Z][a-z])/,
          )?.[1];
          return familyPrefix ? [familyPrefix] : [];
        },
      ),
    ),
  ];
}

const knownSourceIdentifierExclusions = new Map<string, Set<string>>([
  // The SCM520 capture includes a separate controller block.
  ["scm520", new Set(["rs485", "ip65"])],
  // The SCM530 table includes a comparison row for the separate SCM520 model.
  ["scm530", new Set(["scm520"])],
]);

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
      expectedValues: string[];
    }> = [
      {
        category: "water-quality",
        slug: "bt6308-do",
        expectedValues: [
          "0-20mg/L",
          "飽和度0-200%",
          "T90：60秒",
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
        expectedValues: [
          "254nm",
          "72時間",
          "0-200mg/NL",
          "0.1mg/NL",
          "±3%",
          "0.5±0.2L/min",
          "≤1bar(0.1MPa)",
          "AC 220V±10%50Hz",
          "340mm",
          "12か月",
        ],
      },
      {
        category: "flow-level",
        slug: "msf8100",
        expectedValues: [
          "DN6 - DN50",
          "-0.1MPa～6.3MPa",
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
      for (const expectedValue of fixture.expectedValues) {
        expect(localizedProduct, `${fixture.slug}: ${expectedValue}`).toContain(
          expectedValue,
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
          const localizedSourceValue =
            sourceValue === "Acid" ? "酸性ガス" : sourceValue;
          expect(
            localizedProduct,
            `${fixture.slug}: ${sourceValue}`,
          ).toContain(normalizeTechnicalText(localizedSourceValue));
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

  it("reconciles source model, standard, and protocol tokens for all 45 products", async () => {
    const manifest = await readManifest();
    const products = getProducts();
    const productSourceUrls = new Set(products.map(({ sourceUrl }) => sourceUrl));

    expect(products).toHaveLength(45);
    expect(productSourceUrls.size).toBe(45);

    for (const product of products) {
      const source = manifest.find(
        ({ sourceUrl }) => sourceUrl === product.sourceUrl,
      );
      const publicProduct = normalizedTechnicalText(
        JSON.stringify({ ...product, sourceUrl: undefined }),
      );

      expect(source, product.slug).toBeDefined();
      const expectedTokens = [
        ...extractSourceModelTokens(source!),
        ...extractSourceStandardsAndProtocols(source!),
      ].filter((token) => {
        const exclusions = knownSourceIdentifierExclusions.get(product.slug);
        return !exclusions?.has(normalizedTechnicalText(token));
      });
      for (const token of expectedTokens) {
        expect(publicProduct, `${product.slug}: ${token}`).toContain(
          normalizedTechnicalText(token),
        );
      }
    }
  });

  it("uses only source-body applications for reviewed products", () => {
    expect(getProducts().find(({ slug }) => slug === "at-2000")?.applications)
      .toEqual([
        "水処理",
        "下水処理",
        "食品",
        "化学",
        "冶金",
      ]);
    expect(getProducts().find(({ slug }) => slug === "bt-7000")?.applications)
      .toEqual([
        "上水配管網",
        "都市二次給水",
        "下水処理場",
        "化学プロセス水処理",
        "食品製造・飲料加工",
        "プール水処理",
      ]);
  });

  it("retains reviewed source-specific product facts without mixing variants", () => {
    const productText = (slug: string) =>
      JSON.stringify(getProducts().find((product) => product.slug === slug));

    for (const expected of [
      "60ml/min（測定範囲2-400μm向け）",
      "120ml/min（測定範囲2-750μm向け）",
      "センサー保護フィルター",
      "センサー注入・排出ホース",
      "センサー洗浄キット",
    ]) {
      expect(productText("bt8500")).toContain(expected);
    }

    expect(productText("scm520")).toContain("220VAC、50HZ");
    expect(productText("scm520")).toContain("310mm(W)、388mm(H)、165mm(D)");
    expect(productText("scm520")).not.toContain("100-240VAC/0.75A");
    expect(productText("bt6308-do")).toContain("膜式温度センサー");
    expect(productText("bt6308-do")).toContain("顧客要件に応じてカスタマイズ");
    expect(productText("bt6308-orp")).toContain("FC01");
    expect(productText("bt6308-ph")).toContain("FC01");
    expect(productText("bt6308-turb")).toContain("FC-TU910");
    expect(productText("bt6308-turb")).toContain("FC-B830");
    expect(productText("bt6308-ss")).toContain("FC-B210");
    expect(getProducts().find(({ slug }) => slug === "bt6308-ss")?.applications).toEqual([
      "下水処理",
      "工業用水・冷却水",
      "水道事業",
      "河川・湖沼などの表流水",
    ]);

    for (const expected of [
      "DPDによる校正",
      "加圧空気による自動パージ洗浄（オプション）",
      "カスタマイズ可能な温度センサー",
      "4芯、標準20ft（6m）ケーブル（原文表記・要確認）",
      "応答時間：<40s",
      "再現性：測定値の<0.3%",
      "リング電極",
      "Noryl変性ポリフェニレンエーテル",
      "金製作用電極",
      "ステンレス鋼製対極",
      "銀製陰極",
      "銀／銀製参照電極",
      "亜鉛・鉛製陽極",
      "多孔質親水膜",
      "流量：約500m/min（原文表記・要確認）",
    ]) {
      expect(productText("bt-7000")).toContain(expected);
    }

    for (const expected of [
      "≤60S（原文表記・要確認）",
      "故障信号：0.5mADC",
      "警報遅延：2s（初期値、変更可能）",
      "1.5〜2.0mm2 RVVPシールドケーブル",
    ]) {
      expect(productText("gt-3200h")).toContain(expected);
    }

    for (const expected of [
      "2.8インチTFT",
      "RS485およびネットワーク通信",
    ]) {
      expect(productText("at-2000")).toContain(expected);
    }

    for (const slug of [
      "as-300-combustible",
      "as-300-toxic",
      "as-525-voc",
      "as-525-toxic",
      "as-525-combustible",
      "as-525-toxic-online",
    ]) {
      expect(productText(slug), slug).toContain("4〜8か月ごと");
      expect(productText(slug), slug).toContain("3〜6か月ごと");
    }

    for (const expected of [
      "RS232/RS485",
      "16件の停電時記録",
      "E=B-V-D-K",
      "負荷：0-5002（原文表記・要確認）",
      "基本誤差：0.1%±10uA",
    ]) {
      expect(productText("msf8000")).toContain(expected);
    }
    expect(productText("msf8000")).not.toContain("E=B·V·D·K");
    expect(productText("gt-3200h")).not.toContain("応答時間：≤60S");
  });

  it("retains the complete source-backed GT-3280-OU operating facts", () => {
    const productText = JSON.stringify(
      getProducts().find(({ slug }) => slug === "gt-3280-ou"),
    );

    for (const expected of [
      "24時間連続監視",
      "8G",
      "3年超",
      "HJ 212",
      "450*250*650(MM)",
      "ポール取付、床置き、支柱取付（オプション）",
      "PID、電気化学、MOS",
      "ポンプ吸引式",
      "GB 14554-1993",
      "GB/T 14675-1993",
      "GB/T 14677-1993",
      "GB/T 14678-1993",
      "GB/T 14679-1993",
      "ごみ中継施設",
      "下水処理場",
      "化学工業団地",
      "石油・石油化学",
      "大気環境監視",
      "食品加工",
    ]) {
      expect(productText).toContain(expected);
    }
  });

  it("retains the final documented source-reconciliation facts", () => {
    const expectedBySlug: Record<string, string[]> = {
      bt8500: ["設備の摩耗防止"],
      bt8200: [
        "設備の摩耗防止",
        "60ml/min（測定範囲2-400μm向け）",
        "120ml/min（測定範囲2-750μm向け）",
      ],
      btp8300: [
        "軍需・後方支援、航空宇宙、電力、石油、化学、交通、港湾、冶金、機械、自動車製造",
        "航空灯油、作動油、潤滑油、変圧器油、タービン油、ギヤ油、エンジン油、水系作動油の固形粒子汚染度・粘度・水分試験",
        "有機液体・高分子溶液中の不溶性粒子検出",
        "ろ床・膜ろ過・セラミックフィルターのろ過工程監視",
        "医薬製剤用純水・洗浄剤などの製品品質監視、設備摩耗・流体清浄度の検出、科学研究分析",
      ],
      "streaming-current-system": ["その他の凝集剤を添加する工程"],
      labsense: [
        "LabSense2：内蔵自動凝集剤滴定器、希釈用滴定ポンプ1台",
        "LabSense3：希釈用滴定ポンプ2台、内蔵pH滴定器（酸または塩基）",
        "導電率：最大11ms（原文では単位末尾が「/on」、要確認）",
      ],
      uvsense: [
        "再生水処理",
        "UVSense-D：UVスペクトル吸収法（254nmおよび550nm）、<6W",
        "UVSense-M：紫外可視分光法（4波長）、<2W",
        "UVSense-F：紫外可視分光法（200-800nm）、<8W",
        "UVSense-D：0-500mg/L又は0-1000mg/L、分解能0.01mg/L、精度±2.5%/±2.5mg/L",
        "UVSense-F：0-100mg/L（±3%/±1.5mg/L）、0-300mg/L（±3%/±2.5mg/L）、0-600mg/L（±3%/±3mg/L）、分解能0.01mg/L",
        "UVSense-M：0-200mg/L、分解能0.01mg/L、精度±5%/±2mg/L",
        "UVSense-F：0-8mg/L（±3%/±0.1mg/L）、0-20mg/L（±3%/±0.2mg/L）、0-50mg/L（±3%/±0.5mg/L）、分解能0.01mg/L",
      ],
      "bt6308-ph": ["センサー内部で電源と通信を絶縁"],
      "bt6308-cl": [
        "BWCS4：残留塩素、BWCN1.1：ゼロ残留塩素、BWCCF1.0N：膜なし残留塩素、BWCP4.0：全塩素",
        "メンテナンス不要期間：6か月",
        "意味不明の「3か月の入札なし期間」",
        "BWCS4（残留塩素）",
        "範囲：0.01-2、0.01-5、0.01-10、0.01-20、0.5-200ppm；分解能：0.01；安定性：-1%/月",
        "BWCN1.1（ゼロ残留塩素）",
        "範囲：0.005-2、0.05-20ppm；分解能：0.001；安定性：-3%/月",
        "BWCCF1.0N（膜なし残留塩素）",
        "膜材質：原典表では「_」",
        "pH：6-9；初期分極：約15分；再分極：約15分；T90：約20秒",
        "BWCP4.0（全塩素）",
        "pH：4-12；初期分極：約2時間；再分極：約30分；T90：約180秒",
      ],
      "bt6308-peroxi": [
        "0.1mg/L、1mg/L、10mg/L、100mg/L（選択したセンサー範囲に依存）",
        "0～45℃（測定水に氷晶がないこと）",
        "0-0.5bar（圧力衝撃又は振動がないこと）",
      ],
      "peracetic-acid": [
        "BPES7 0-45℃、BP9.2 0-60℃、BP10 0-45℃（いずれも測定水に氷晶がないこと）",
        "0.5bar（圧力衝撃又は振動がないこと）",
      ],
      "bt-6308": [
        "上水道管網",
        "自治体の二次給水",
        "下水処理場",
        "化学プロセスの水処理",
        "食品製造",
        "飲料加工",
        "プール水処理",
      ],
      "gt-3200h": ["4桁LCDデジタル濃度表示"],
      "as-300-infrared": [
        "現場レベル2音響・視覚警報",
        "外部排気装置等に接続するリレー出力",
      ],
      "as-300-multi-gas": [
        "現場レベル2音響・視覚警報",
        "外部排気装置等に接続するリレー出力",
        "1～4種類のガスを同時検知",
        "選択可能な濃度単位：ppm、mg/m³、VOL%、LEL%、pphm",
      ],
      "as-300-voc": [
        "現場レベル2音響・視覚警報",
        "外部排気装置等に接続するリレー出力",
      ],
      "as-300-combustible": [
        "現場レベル2音響・視覚警報",
        "外部排気装置等に接続するリレー出力",
        "シクロヘキサン（CH2(CH2)4CH2）、イソプロパノール（C3H8O）、エーテル（C2H5OC2H5）：各0-100%LEL、分解能0.1",
      ],
      "as-300-toxic": [
        "現場レベル2音響・視覚警報",
        "外部排気装置等に接続するリレー出力",
      ],
      "as-525-voc": [
        "製品本文には現場レベル2音響・視覚警報および外部排気装置等に接続するリレー出力を記載（仕様表では音響・視覚警報灯をオプションと記載）",
        "アナログ3線式接続",
      ],
      "as-525-toxic": [
        "製品本文には現場レベル2音響・視覚警報および外部排気装置等に接続するリレー出力を記載（仕様表では音響・視覚警報灯をオプションと記載）",
        "アナログ3線式接続",
        "特殊な場所および閉鎖空間",
      ],
      "as-525-combustible": [
        "製品本文には現場レベル2音響・視覚警報および外部排気装置等に接続するリレー出力を記載（仕様表では音響・視覚警報灯をオプションと記載）",
        "アナログ3線式接続",
      ],
      "as-525-toxic-online": [
        "製品本文には現場レベル2音響・視覚警報および外部排気装置等に接続するリレー出力を記載（仕様表では音響・視覚警報灯をオプションと記載）",
        "アナログ3線式接続",
      ],
      msf8000: ["警報出力"],
    };

    for (const [slug, expectedFacts] of Object.entries(expectedBySlug)) {
      const productText = JSON.stringify(
        getProducts().find((product) => product.slug === slug),
      );
      for (const expectedFact of expectedFacts) {
        expect(productText, `${slug}: ${expectedFact}`).toContain(expectedFact);
      }
    }
  });

  it("rejects non-allowlisted ASCII words in every public content string", () => {
    const products = getProducts();
    const productModelWords = new Set(
      products.flatMap(({ model }) =>
        [...model.matchAll(/[A-Za-z]+/g)].map(([word]) => word.toLowerCase()),
      ),
    );

    for (const record of getAllContent()) {
      expect(
        findDisallowedAsciiWords(record, productModelWords),
        `${record.sourceUrl} contains raw English public prose`,
      ).toEqual([]);
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
