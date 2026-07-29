import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
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
const rawEnglishPhrasePattern = /\b[a-z]{3,}(?:\s+[a-z]{2,})+\b/gi;
const allowedTechnicalPhrases = new Set(
  [
    "MODBUS RTU",
    "Modbus RTU",
    "ARM Cortex",
    "bit ADC",
    "Thermo Fisher",
    "Mettler Toledo",
    "Beckman Coulter",
    "Bebur UVSense",
    "feric chloide",
  ].map((phrase) => phrase.toLowerCase()),
);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
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

function publicText(value, key = "") {
  if (typeof value === "string") {
    return key === "sourceUrl" || key === "src" ? [] : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => publicText(item));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, childValue]) =>
      publicText(childValue, childKey),
    );
  }
  return [];
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

const rawEnglishPublicProse = [];
for (const { file, record } of contentEntries) {
  for (const value of publicText(record)) {
    const phrases = value.match(rawEnglishPhrasePattern) ?? [];
    for (const phrase of phrases) {
      if (!allowedTechnicalPhrases.has(phrase.toLowerCase())) {
        rawEnglishPublicProse.push(
          `${recordLabel(file, record)} -> ${phrase}`,
        );
      }
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
  missingLocalImages.length > 0 ||
  forbiddenContactMatches.length > 0 ||
  rawEnglishPublicProse.length > 0 ||
  missingJapaneseTitlesDescriptions.length > 0 ||
  invalidDates.length > 0 ||
  unresolvedRelatedProductReferences.length > 0;

if (failed) {
  process.exitCode = 1;
}
