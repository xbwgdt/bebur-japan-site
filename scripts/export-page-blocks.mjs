import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDirectory = path.join(root, "content", "ja");
const destination = path.join(root, "sanity", "import", "pages.ndjson");
const importDirectory = path.dirname(destination);
const japaneseCharacterPattern = /[\u3041-\u30ff\u31f0-\u31ff\u3400-\u9fff\uf900-\ufaff]/u;
const approvedContact = {
  distributorName: "Bebur 日本総代理店",
  companyName: "新樹産業株式会社",
  postalCode: "340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  inquiryEmail: "info@newtree-i.com",
};

const readJson = async (file) =>
  JSON.parse(await readFile(path.join(contentDirectory, file), "utf8"));

const keyFor = (identifier, index) =>
  `${identifier.replace(/[^a-z0-9]/giu, "").slice(0, 18)}${String(index).padStart(4, "0")}`;

const importedImage = (image, key) => {
  if (!image?.src || !image?.alt) {
    throw new Error(`Page image ${key} must include a local source and Japanese alt text.`);
  }
  if (!japaneseCharacterPattern.test(image.alt)) {
    throw new Error(`Page image ${key} must include Japanese alt text.`);
  }

  const imagePath = path.resolve(root, "public", image.src.slice(1));
  if (!existsSync(imagePath)) {
    throw new Error(`Missing local image for page import: ${image.src}`);
  }
  const relativePath = path.relative(importDirectory, imagePath).split(path.sep).join("/");
  if (!relativePath.startsWith("../../public/")) {
    throw new Error(`Expected page image to stay within public: ${image.src}`);
  }

  return {
    _key: key,
    _type: "image",
    _sanityAsset: `image@file://./${relativePath}`,
    alt: image.alt,
  };
};

const portableText = (sections, identifier) => {
  const blocks = [];
  let index = 0;
  const add = (text, options = {}) => {
    const key = keyFor(identifier, index++);
    blocks.push({
      _key: key,
      _type: "block",
      style: options.style ?? "normal",
      ...(options.listItem ? { listItem: options.listItem } : {}),
      children: [
        {
          _key: `${key}span`,
          _type: "span",
          marks: [],
          text,
        },
      ],
      markDefs: [],
    });
  };

  for (const section of sections ?? []) {
    if (section.heading) add(section.heading, { style: "h2" });
    for (const paragraph of section.paragraphs ?? []) add(paragraph);
    for (const bullet of section.bullets ?? []) add(bullet, { listItem: "bullet" });
  }
  return blocks;
};

const seoTitle = (title) => `${title}｜Bebur Japan`.slice(0, 60);
const seoDescription = (description) =>
  `${description} Bebur Japanの日本語サイトで、製品・用途・技術情報をご案内します。`.slice(0, 160);

const pageBlock = (record, productsBySlug) => {
  const identifier = `page--${record.slug}`;
  const [heroImage, ...galleryImages] = record.images ?? [];
  const blocks = [
    {
      _key: keyFor(identifier, 0),
      _type: "hero",
      title: record.title,
      summary: record.description,
      ...(heroImage
        ? { image: importedImage(heroImage, `${identifier}hero`) }
        : {}),
      ctaLabel: "お問い合わせ",
      ctaHref: "/contact",
      color: "brand",
      fontSize: "lg",
      alignment: "left",
      spacing: "normal",
      desktopTitleWrap: "wrap",
    },
  ];

  const content = portableText(record.sections, identifier);
  if (content.length > 0) {
    blocks.push({
      _key: keyFor(identifier, 1),
      _type: "richText",
      title: "詳細",
      content,
      color: "neutral",
      fontSize: "md",
      alignment: "left",
      spacing: "normal",
      desktopTitleWrap: "wrap",
    });
  }

  if (galleryImages.length > 0) {
    blocks.push({
      _key: keyFor(identifier, 2),
      _type: "gallery",
      title: "関連画像",
      images: galleryImages.map((image, index) =>
        importedImage(image, `${identifier}gallery${String(index).padStart(3, "0")}`),
      ),
      color: "neutral",
      fontSize: "md",
      alignment: "left",
      spacing: "normal",
      desktopTitleWrap: "wrap",
    });
  }

  const recommendedProducts = (record.recommendedProductSlugs ?? [])
    .map((slug) => productsBySlug.get(slug))
    .filter(Boolean);
  if (recommendedProducts.length > 0) {
    blocks.push({
      _key: keyFor(identifier, 3),
      _type: "cardGrid",
      title: "関連製品",
      cards: recommendedProducts.map((product, index) => ({
        _key: `${identifier}product${String(index).padStart(3, "0")}`,
        title: product.title,
        summary: product.description,
        ...(product.images?.[0]
          ? { image: importedImage(product.images[0], `${identifier}productimage${String(index).padStart(3, "0")}`) }
          : {}),
        linkLabel: "製品を見る",
        href: product.route,
      })),
      color: "neutral",
      fontSize: "md",
      alignment: "left",
      spacing: "normal",
      desktopTitleWrap: "wrap",
    });
  }

  return {
    _id: identifier,
    _type: "page",
    title: record.title,
    slug: { _type: "slug", current: record.slug },
    blocks,
    seoTitle: seoTitle(record.title),
    seoDescription: seoDescription(record.description),
    publishState: "published",
  };
};

const validatePageDocuments = (documents) => {
  for (const document of documents) {
    if (
      document._type !== "page" ||
      !/^page--[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(document._id) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(document.slug?.current ?? "")
    ) {
      throw new Error(`Invalid page identity: ${document._id}`);
    }
    if (!document.title || document.blocks.length < 1 || document.publishState !== "published") {
      throw new Error(`Incomplete published page document: ${document._id}`);
    }
    if (
      document.seoTitle.length < 10 ||
      document.seoTitle.length > 60 ||
      document.seoDescription.length < 50 ||
      document.seoDescription.length > 160
    ) {
      throw new Error(`Invalid SEO metadata length: ${document._id}`);
    }

    for (const block of document.blocks) {
      if (block._type === "hero") {
        if (!block.title || !block.summary || !block.ctaLabel) {
          throw new Error(`Incomplete hero block: ${document._id}`);
        }
        if (block.image && !japaneseCharacterPattern.test(block.image.alt ?? "")) {
          throw new Error(`Hero image needs Japanese alt text: ${document._id}`);
        }
      }
      if (block._type === "richText" && (!block.title || block.content.length < 1)) {
        throw new Error(`Incomplete rich text block: ${document._id}`);
      }
      if (block._type === "gallery") {
        if (!block.title || block.images.length < 1 || block.images.some((image) => !japaneseCharacterPattern.test(image.alt ?? ""))) {
          throw new Error(`Invalid gallery block: ${document._id}`);
        }
      }
      if (block._type === "cardGrid") {
        if (!block.title || block.cards.length < 1 || block.cards.some((card) => !card.title || !card.linkLabel || (card.image && !japaneseCharacterPattern.test(card.image.alt ?? "")))) {
          throw new Error(`Invalid product card grid: ${document._id}`);
        }
      }
    }
  }
};

const [aboutPages, applications, pages, products] = await Promise.all([
  readJson("about.json"),
  readJson("applications.json"),
  readJson("pages.json"),
  readJson("products.json"),
]);
const contact = pages.find(({ route }) => route === "/contact")?.contact;
if (JSON.stringify(contact) !== JSON.stringify(approvedContact)) {
  throw new Error("Localized contact content must match approved New Tree Industries contact values.");
}

const normalPages = [...aboutPages, ...applications, ...pages].toSorted(
  (left, right) => left.route.localeCompare(right.route, "ja") || left.title.localeCompare(right.title, "ja"),
);
const productsBySlug = new Map(products.map((product) => [product.slug, product]));
const documents = normalPages.map((record) => pageBlock(record, productsBySlug));
const expectedCount = 48;
if (documents.length !== expectedCount) {
  throw new Error(`Expected ${expectedCount} normal page documents, received ${documents.length}.`);
}
if (new Set(documents.map(({ _id }) => _id)).size !== expectedCount) {
  throw new Error("Normal page documents must have unique deterministic IDs.");
}

validatePageDocuments(documents);

await mkdir(importDirectory, { recursive: true });
await writeFile(
  destination,
  `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`,
  "utf8",
);

console.log(`Wrote ${documents.length} deterministic page documents to ${path.relative(root, destination)}.`);
