import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateSanityImportDocuments } from "./validate-sanity-import.mjs";

const root = process.cwd();
const contentDirectory = path.join(root, "content", "ja");
const destination = path.join(root, "sanity", "import", "initial.ndjson");
const importDirectory = path.dirname(destination);
const approvedInquiryEmail = "info@newtree-i.com";
const approvedContact = {
  distributorName: "Bebur 日本総代理店",
  companyName: "新樹産業株式会社",
  postalCode: "340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  inquiryEmail: approvedInquiryEmail,
};
const obsoleteContactPattern =
  /18001379750|010-87653191|0838-2236056|sales@bebur\.net|wechat|douyin/i;

const readJson = async (file) =>
  JSON.parse(await readFile(path.join(contentDirectory, file), "utf8"));

const keyFor = (identifier, index) =>
  `${identifier.replace(/[^a-z0-9]/giu, "").slice(0, 16)}${String(index).padStart(4, "0")}`;

const portableText = (sections, identifier) => {
  const blocks = [];
  let index = 0;
  const addBlock = (text, options = {}) => {
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
    if (section.heading) addBlock(section.heading, { style: "h2" });
    for (const paragraph of section.paragraphs ?? []) addBlock(paragraph);
    for (const bullet of section.bullets ?? []) {
      addBlock(bullet, { listItem: "bullet" });
    }
  }

  return blocks;
};

const seoTitle = (title) => `${title}｜Bebur Japan`.slice(0, 60);
const seoDescription = (description) => {
  const suffix = " Bebur Japanが日本国内向けにご案内します。";
  const value = description.length >= 50 ? description : `${description}${suffix}`;
  return value.slice(0, 160);
};

const productId = ({ category, slug }) => `product--${category}--${slug}`;

const defaultImage = {
  src: "/media/brand/bebur-og-background.png",
  alt: "Bebur Japanの水質分析・ガス検知ソリューション",
};

const importedImage = (image, key) => {
  const imagePath = path.resolve(root, "public", image.src.slice(1));
  if (!existsSync(imagePath)) {
    throw new Error(`Missing local image for Sanity import: ${image.src}`);
  }
  const relativePath = path
    .relative(importDirectory, imagePath)
    .split(path.sep)
    .join("/");
  if (!relativePath.startsWith("../../public/")) {
    throw new Error(`Expected import image to stay within public: ${image.src}`);
  }

  return {
    _key: key,
    _type: "image",
    _sanityAsset: `image@file://./${relativePath}`,
    alt: image.alt,
  };
};

const importedImages = (images, identifier, fallbackAlt) => {
  const sourceImages = images?.length
    ? images
    : [{ ...defaultImage, alt: fallbackAlt }];
  const [cover, ...gallery] = sourceImages;

  return {
    coverImage: importedImage(cover, `${identifier}cover`),
    ...(gallery.length > 0
      ? {
          gallery: gallery.map((image, index) =>
            importedImage(image, `${identifier}gallery${String(index).padStart(3, "0")}`),
          ),
        }
      : {}),
  };
};

const referenceList = (slugs, productsBySlug) =>
  (slugs ?? []).flatMap((slug) => {
    const product = productsBySlug.get(slug);
    return product
      ? [{ _key: `ref${slug.replace(/[^a-z0-9]/giu, "")}`, _type: "reference", _ref: productId(product) }]
      : [];
  });

const buildProduct = (product, productsBySlug) => ({
  _id: productId(product),
  _type: "product",
  category: product.category,
  title: product.title,
  slug: { _type: "slug", current: product.slug },
  model: product.model,
  summary: product.description,
  body: portableText(product.sections, productId(product)),
  features: product.features ?? [],
  applications: product.applications ?? [],
  specifications: (product.specifications ?? []).map((specification, index) => ({
    _key: `spec${String(index).padStart(3, "0")}`,
    label: specification.label,
    value: specification.value,
  })),
  relatedProducts: referenceList(product.relatedSlugs, productsBySlug),
  ...importedImages(product.images, productId(product), product.title),
  seoTitle: seoTitle(product.title),
  seoDescription: seoDescription(product.description),
  publishState: "published",
});

const buildNews = (article, productsBySlug) => ({
  _id: `news--${article.slug}`,
  _type: "news",
  title: article.title,
  slug: { _type: "slug", current: article.slug },
  publishedAt: article.publishedAt,
  summary: article.description,
  body: portableText(article.sections, `news--${article.slug}`),
  relatedProducts: referenceList(article.relatedProductSlugs, productsBySlug),
  ...importedImages(article.images, `news--${article.slug}`, article.title),
  seoTitle: seoTitle(article.title),
  seoDescription: seoDescription(article.description),
  publishState: "published",
});

const navigationLabels = {
  home: "ホーム",
  products: "製品情報",
  applications: "導入分野・事例",
  company: "企業情報",
  news: "ニュース・技術情報",
  contact: "お問い合わせ",
};

const buildSiteSettings = (contact) => ({
  _id: "siteSettings",
  _type: "siteSettings",
  navigationLabels,
  distributorName: contact.distributorName,
  companyName: contact.companyName,
  postalCode: contact.postalCode,
  address: contact.address,
  phone: contact.phone,
  inquiryEmail: contact.inquiryEmail,
  footerText: "Bebur 日本総代理店｜新樹産業株式会社",
  defaultSeoTitle: "Bebur Japan｜水質分析・ガス検知の精密計測",
  defaultSeoDescription:
    "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
  defaultOgImage: importedImage(defaultImage, "siteSettingsOgImage"),
});

const ensureApprovedContact = (contact) => {
  if (JSON.stringify(contact) !== JSON.stringify(approvedContact)) {
    throw new Error("Localized contact content must match approved New Tree Industries contact values.");
  }

  const serialized = JSON.stringify(contact);
  if (obsoleteContactPattern.test(serialized)) {
    throw new Error("Localized contact content contains an obsolete contact value.");
  }
};

const [products, insights, pages] = await Promise.all([
  readJson("products.json"),
  readJson("insights.json"),
  readJson("pages.json"),
]);
const contact = pages.find(({ route }) => route === "/contact")?.contact;
ensureApprovedContact(contact);

const productsBySlug = new Map(products.map((product) => [product.slug, product]));
const documents = [
  ...products.map((product) => buildProduct(product, productsBySlug)),
  ...insights.map((article) => buildNews(article, productsBySlug)),
  buildSiteSettings(contact),
].toSorted((left, right) => left._id.localeCompare(right._id, "en"));
const validationMarkers = await validateSanityImportDocuments(documents);

if (validationMarkers.length > 0) {
  throw new Error(
    `Sanity import validation failed:\n${validationMarkers
      .map(({ message, path: markerPath }) =>
        `${markerPath.join(".") || "document"}: ${message}`,
      )
      .join("\n")}`,
  );
}

await mkdir(path.dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`,
  "utf8",
);

console.log(`Wrote ${documents.length} deterministic Sanity documents to ${path.relative(root, destination)}.`);
