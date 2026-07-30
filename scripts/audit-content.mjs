import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const canonicalOrigin = "https://www.bebur-jp.com";
const sourcePath = path.join(root, "content", "source", "source-manifest.json");
const contentDirectory = path.join(root, "content", "ja");
const contentFiles = [
  "products.json",
  "applications.json",
  "about.json",
  "insights.json",
  "pages.json",
];
const forbiddenContactPattern =
  /18001379750|010-87653191|0838-2236056|sales@bebur\.net|wechat|douyin|陕ICP备|正規販売店|お問い合わせ窓口/i;
const japanesePattern = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
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
// Keep this list limited to identifiers, acronyms, units, trade names, and
// proper names. Ordinary English words in public Japanese copy must be translated.
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
    "g",
    "ag",
    "agcl",
    "gb",
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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(absolutePath);
    }
    return /\.(?:json|ts|tsx)$/i.test(entry.name) ? [absolutePath] : [];
  });
}

function recordLabel(file, record) {
  return `${file}:${record.slug ?? "(missing slug)"}`;
}

function printList(label, values) {
  console.log(`${label}: ${values.length}`);
  for (const value of values) {
    console.log(`  - ${value}`);
  }
}

function publicText(value, pathParts = [], key = "") {
  if (structuralContentKeys.has(key)) {
    return [];
  }
  if (typeof value === "string") {
    return [{ path: pathParts.join("."), value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      publicText(item, [...pathParts, index], key),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, childValue]) =>
      publicText(childValue, [...pathParts, childKey], childKey),
    );
  }
  return [];
}

function disallowedAsciiWords(value, productModelWords) {
  if (
    /^https?:\/\//i.test(value) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    return [];
  }

  // Preserve only explicitly marked source/OCR anomalies.
  const scanValue = value
    .replace(/feric chloide(?=[^。]*原文表記・要確認)/gi, "")
    .replace(/Soil(?=[^。]*原文表記・要確認)/g, "")
    .replace(/m³p(?=[^。]*原文表記・要確認)/gi, "")
    .replace(/Norl(?=[^。]*原文表記・要確認)/gi, "")
    .replace(/\/on(?=」、要確認)/gi, "");

  return [...scanValue.matchAll(/(?<![A-Za-z0-9])[A-Za-z]+(?![A-Za-z0-9])/g)]
    .map(([word]) => word)
    .filter((word) => {
      const normalized = word.toLowerCase();
      return (
        word !== word.toUpperCase() &&
        !allowedAsciiWords.has(normalized) &&
        !productModelWords.has(normalized)
      );
    });
}

const sourceRecords = readJson(sourcePath);
const contentEntries = contentFiles.flatMap((file) => {
  const filePath = path.join(contentDirectory, file);
  const records = readJson(filePath);
  return records.map((record) => ({ file, record }));
});
const contentRecords = contentEntries.map(({ record }) => record);

const sourceUrlMappings = new Map();
for (const { file, record } of contentEntries) {
  const label = recordLabel(file, record);
  for (const sourceUrl of [
    record.sourceUrl,
    ...(record.sourceAliases ?? []),
  ].filter(Boolean)) {
    const labels = sourceUrlMappings.get(sourceUrl) ?? [];
    labels.push(label);
    sourceUrlMappings.set(sourceUrl, labels);
  }
}

const sourceUrls = new Set(sourceRecords.map(({ sourceUrl }) => sourceUrl));
const representedSourceUrls = new Set(sourceUrlMappings.keys());
const unmappedSourceUrls = [...sourceUrls]
  .filter((sourceUrl) => !representedSourceUrls.has(sourceUrl))
  .toSorted();
const multiplyMappedSourceUrls = [...sourceUrlMappings]
  .filter(([, labels]) => labels.length > 1)
  .map(([sourceUrl, labels]) => `${sourceUrl} -> ${labels.join(", ")}`)
  .toSorted();
const unexpectedSourceUrls = [...representedSourceUrls]
  .filter((sourceUrl) => !sourceUrls.has(sourceUrl))
  .toSorted();

const routeMappings = new Map();
for (const { file, record } of contentEntries) {
  const labels = routeMappings.get(record.route) ?? [];
  labels.push(recordLabel(file, record));
  routeMappings.set(record.route, labels);
}
const duplicateRoutes = [...routeMappings]
  .filter(([, labels]) => labels.length > 1)
  .map(([route, labels]) => `${route} -> ${labels.join(", ")}`)
  .toSorted();

const canonicalRoutes = [...routeMappings.keys()].toSorted();

const { createViteServer } = await import("vitest/node");
const moduleServer = await createViteServer({
  appType: "custom",
  configFile: path.join(root, "vitest.config.ts"),
  logLevel: "silent",
  root,
  server: {
    middlewareMode: true,
  },
});

let sitemapEntries;
let robotsPolicy;
let liveSiteConfig;
let organizationJsonLd;
let auditSeoOutputs;
try {
  const [
    sitemapModule,
    robotsModule,
    constantsModule,
    layoutModule,
    seoAuditModule,
  ] = await Promise.all([
    moduleServer.ssrLoadModule("/app/sitemap.ts"),
    moduleServer.ssrLoadModule("/app/robots.ts"),
    moduleServer.ssrLoadModule("/lib/constants.ts"),
    moduleServer.ssrLoadModule("/app/layout.tsx"),
    moduleServer.ssrLoadModule("/lib/seo-output-audit.ts"),
  ]);
  sitemapEntries = sitemapModule.default();
  robotsPolicy = robotsModule.default();
  liveSiteConfig = constantsModule.siteConfig;
  organizationJsonLd = layoutModule.organizationJsonLd;
  auditSeoOutputs = seoAuditModule.auditSeoOutputs;
} finally {
  await moduleServer.close();
}

const seoOutputErrors = auditSeoOutputs({
  canonicalOrigin,
  canonicalRoutes,
  sitemapEntries,
  robotsPolicy,
  siteConfig: liveSiteConfig,
  organizationJsonLd,
});
const sitemapUrls = sitemapEntries.map(({ url }) =>
  typeof url === "string" ? url : url?.toString() ?? "",
);
const duplicateSitemapUrls = sitemapUrls
  .filter((url, index) => sitemapUrls.indexOf(url) !== index)
  .toSorted();
const invalidSitemapUrls = sitemapUrls
  .filter((url) => !url.startsWith(`${canonicalOrigin}/`))
  .toSorted();

const aliasMappings = contentEntries
  .flatMap(({ file, record }) =>
    (record.sourceAliases ?? []).map(
      (sourceUrl) => `${sourceUrl} -> ${recordLabel(file, record)}`,
    ),
  )
  .toSorted();

const missingLocalImages = [];
for (const { file, record } of contentEntries) {
  for (const image of record.images ?? []) {
    if (
      typeof image.src !== "string" ||
      !image.src.startsWith("/") ||
      image.src.startsWith("//") ||
      /^https?:/i.test(image.src)
    ) {
      missingLocalImages.push(
        `${recordLabel(file, record)} -> invalid local path ${String(image.src)}`,
      );
      continue;
    }
    const absolutePath = path.resolve(root, "public", image.src.slice(1));
    const publicRoot = path.resolve(root, "public");
    if (
      !absolutePath.startsWith(`${publicRoot}${path.sep}`) ||
      !existsSync(absolutePath)
    ) {
      missingLocalImages.push(
        `${recordLabel(file, record)} -> ${image.src}`,
      );
    }
  }
}

const forbiddenContactMatches = [];
for (const { file, record } of contentEntries) {
  const serialized = JSON.stringify(record);
  const match = serialized.match(forbiddenContactPattern);
  if (match) {
    forbiddenContactMatches.push(
      `${recordLabel(file, record)} -> ${match[0]}`,
    );
  }
}

const publicSourceEntries = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "lib"),
].flatMap(sourceFiles).map((filePath) => ({
  file: path.relative(root, filePath),
  source: readFileSync(filePath, "utf8"),
}));
const forbiddenPublicSourceMatches = publicSourceEntries.flatMap(
  ({ file, source }) => {
    const match = source.match(forbiddenContactPattern);
    return match ? [`${file} -> ${match[0]}`] : [];
  },
);

const languageSwitchPattern =
  /language(?:switcher|[-_\s]+switch)|言語切替|语言切换|href\s*=\s*(?:\{\s*)?["'`]\/(?:en|zh|cn)(?:\/|\?|["'`])/i;
const languageSwitchMatches = publicSourceEntries.flatMap(
  ({ file, source }) => {
    const match = source.match(languageSwitchPattern);
    return match ? [`${file} -> ${match[0]}`] : [];
  },
);

const rawEnglishPublicProse = [];
const productModelWords = new Set(
  contentRecords
    .filter(({ kind }) => kind === "product")
    .flatMap(({ model }) =>
      typeof model === "string"
        ? [...model.matchAll(/[A-Za-z]+/g)].map(([word]) => word.toLowerCase())
        : [],
    ),
);
for (const { file, record } of contentEntries) {
  for (const { path: publicPath, value } of publicText(record)) {
    for (const word of disallowedAsciiWords(value, productModelWords)) {
      rawEnglishPublicProse.push(
        `${recordLabel(file, record)}:${publicPath} -> ${word} in ${JSON.stringify(value)}`,
      );
    }
  }
}

const missingJapaneseTitlesDescriptions = [];
for (const { file, record } of contentEntries) {
  for (const field of ["title", "description"]) {
    const value = record[field];
    if (typeof value !== "string" || !japanesePattern.test(value)) {
      missingJapaneseTitlesDescriptions.push(
        `${recordLabel(file, record)} -> ${field}`,
      );
    }
  }
}

const invalidDates = contentEntries
  .filter(
    ({ record }) =>
      record.publishedAt !== undefined &&
      (typeof record.publishedAt !== "string" ||
        !isoDatePattern.test(record.publishedAt)),
  )
  .map(({ file, record }) =>
    `${recordLabel(file, record)} -> ${String(record.publishedAt)}`,
  );

const productSlugs = new Set(
  contentRecords
    .filter(({ kind }) => kind === "product")
    .map(({ slug }) => slug),
);
const unresolvedRelatedProductReferences = [];
for (const { file, record } of contentEntries) {
  const references =
    record.kind === "product"
      ? record.relatedSlugs
      : record.kind === "application"
        ? record.recommendedProductSlugs
        : record.kind === "article"
          ? record.relatedProductSlugs
          : [];
  for (const slug of references ?? []) {
    if (!productSlugs.has(slug)) {
      unresolvedRelatedProductReferences.push(
        `${recordLabel(file, record)} -> ${slug}`,
      );
    }
  }
}

const kindCounts = Object.fromEntries(
  ["product", "application", "article", "about", "page"].map((kind) => [
    kind,
    contentRecords.filter((record) => record.kind === kind).length,
  ]),
);
const productCategoryCounts = Object.fromEntries(
  [
    "cleanliness",
    "dosing",
    "water-quality",
    "gas-detection",
    "flow-level",
  ].map((category) => [
    category,
    contentRecords.filter(
      (record) => record.kind === "product" && record.category === category,
    ).length,
  ]),
);

console.log(`source record count: ${sourceRecords.length}`);
console.log(`represented source URL count: ${representedSourceUrls.size}`);
console.log(`canonical route count: ${routeMappings.size}`);
console.log(`sitemap canonical URL count: ${sitemapUrls.length}`);
console.log(`record counts by kind: ${JSON.stringify(kindCounts)}`);
console.log(
  `record counts by product category: ${JSON.stringify(productCategoryCounts)}`,
);
printList("alias mappings", aliasMappings);
printList("unmapped source URLs", unmappedSourceUrls);
printList("multiply mapped source URLs", multiplyMappedSourceUrls);
printList("unexpected source URLs", unexpectedSourceUrls);
printList("missing local images", missingLocalImages);
printList("forbidden contact matches", forbiddenContactMatches);
printList(
  "forbidden public-source contact matches",
  forbiddenPublicSourceMatches,
);
printList("language-switch matches", languageSwitchMatches);
printList("duplicate sitemap URLs", duplicateSitemapUrls);
printList("invalid sitemap URLs", invalidSitemapUrls);
printList("live SEO output errors", seoOutputErrors);
printList("raw English public prose", rawEnglishPublicProse);
printList(
  "missing Japanese titles/descriptions",
  missingJapaneseTitlesDescriptions,
);
printList("invalid dates", invalidDates);
printList(
  "unresolved related-product references",
  unresolvedRelatedProductReferences,
);
printList("duplicate routes", duplicateRoutes);

const failed =
  sourceRecords.length !== 112 ||
  representedSourceUrls.size !== 112 ||
  unmappedSourceUrls.length > 0 ||
  multiplyMappedSourceUrls.length > 0 ||
  unexpectedSourceUrls.length > 0 ||
  duplicateRoutes.length > 0 ||
  canonicalRoutes.length !== 110 ||
  sitemapUrls.length !== 110 ||
  duplicateSitemapUrls.length > 0 ||
  invalidSitemapUrls.length > 0 ||
  seoOutputErrors.length > 0 ||
  missingLocalImages.length > 0 ||
  forbiddenContactMatches.length > 0 ||
  forbiddenPublicSourceMatches.length > 0 ||
  languageSwitchMatches.length > 0 ||
  rawEnglishPublicProse.length > 0 ||
  missingJapaneseTitlesDescriptions.length > 0 ||
  invalidDates.length > 0 ||
  unresolvedRelatedProductReferences.length > 0;

if (failed) {
  process.exitCode = 1;
}
