import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const projectId = "gbzt89e5";
const dataset = "production";
const apiVersion = "2025-02-19";
const root = process.cwd();
const importDirectory = path.join(root, "sanity", "import");
const source = path.join(importDirectory, "pages.ndjson");
const dryRun = process.argv.includes("--dry-run");
const apiBase = `https://${projectId}.api.sanity.io/v${apiVersion}`;

const configPath = [
  path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "sanity", "config.json"),
  path.join(os.homedir(), ".config", "sanity", "config.json"),
].find(existsSync);
const token = process.env.SANITY_AUTH_TOKEN ?? (configPath ? JSON.parse(readFileSync(configPath, "utf8")).authToken : undefined);
if (!token) {
  throw new Error("Sanity authentication token is required for page import.");
}

const request = async (pathname, options = {}) => {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiBase}${pathname}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Sanity request failed (${response.status}) ${pathname}: ${await response.text()}`);
  }
  return response;
};

const query = async (groq, params = {}) => {
  const response = await request(`/data/query/${dataset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: groq, params }),
  });
  return (await response.json()).result;
};

const readDocuments = async () =>
  (await readFile(source, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

const sourcePath = (image) => {
  const asset = image?._sanityAsset;
  const prefix = "image@file://./";
  if (typeof asset !== "string" || !asset.startsWith(prefix)) {
    throw new Error("Expected generated local image asset reference.");
  }
  const file = path.resolve(importDirectory, asset.slice(prefix.length));
  if (!file.startsWith(path.resolve(root, "public") + path.sep) || !existsSync(file)) {
    throw new Error(`Page image is missing or outside public: ${asset}`);
  }
  return file;
};

const collectImages = (documents) => {
  const images = [];
  for (const document of documents) {
    for (const block of document.blocks) {
      if (block._type === "hero" && block.image) images.push(block.image);
      if (block._type === "gallery") images.push(...block.images);
      if (block._type === "cardGrid") {
        images.push(...block.cards.flatMap((card) => (card.image ? [card.image] : [])));
      }
    }
  }
  return images;
};

const imageMimeType = (file) => {
  const extension = path.extname(file).toLowerCase();
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  }[extension] ?? "application/octet-stream";
};

const assetReference = (image, assetId) => ({
  _key: image._key,
  _type: "image",
  asset: { _type: "reference", _ref: assetId },
  alt: image.alt,
});

const replaceImageAssets = (document, assetIds) => {
  const replace = (image) => assetReference(image, assetIds.get(sourcePath(image)));
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (block._type === "hero" && block.image) return { ...block, image: replace(block.image) };
      if (block._type === "gallery") return { ...block, images: block.images.map(replace) };
      if (block._type === "cardGrid") {
        return {
          ...block,
          cards: block.cards.map((card) => (card.image ? { ...card, image: replace(card.image) } : card)),
        };
      }
      return block;
    }),
  };
};

const documents = await readDocuments();
if (
  documents.length !== 48 ||
  documents.some(({ _id, _type, publishState }) =>
    _type !== "page" || !/^page--[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(_id) || publishState !== "published",
  )
) {
  throw new Error("Refusing import: pages.ndjson must contain exactly 48 published page--* documents.");
}

const imagesByPath = new Map();
for (const image of collectImages(documents)) {
  const file = sourcePath(image);
  if (!imagesByPath.has(file)) {
    imagesByPath.set(file, {
      file,
      sha1hash: createHash("sha1").update(await readFile(file)).digest("hex"),
    });
  }
}

const currentCounts = await query(
  '{"products":count(*[_type == "product"]),"news":count(*[_type == "news"]),"siteSettings":count(*[_type == "siteSettings"]),"pages":count(*[_type == "page"])}',
);
if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, documents: documents.length, uniqueImages: imagesByPath.size, currentCounts }));
} else {

const existingAssets = await query(
  '*[_type == "sanity.imageAsset" && sha1hash in $hashes]{_id,sha1hash}',
  { hashes: [...imagesByPath.values()].map(({ sha1hash }) => sha1hash) },
);
const assetIdsByHash = new Map(existingAssets.map(({ sha1hash, _id }) => [sha1hash, _id]));
let uploadedAssets = 0;
for (const image of imagesByPath.values()) {
  if (!assetIdsByHash.has(image.sha1hash)) {
    const response = await request(`/assets/images/${dataset}?filename=${encodeURIComponent(path.basename(image.file))}`, {
      method: "POST",
      headers: { "Content-Type": imageMimeType(image.file) },
      body: await readFile(image.file),
    });
    const asset = (await response.json()).document;
    assetIdsByHash.set(image.sha1hash, asset._id);
    uploadedAssets += 1;
  }
}

const assetIdsByPath = new Map(
  [...imagesByPath.values()].map((image) => [image.file, assetIdsByHash.get(image.sha1hash)]),
);
const mutationResponse = await request(`/data/mutate/${dataset}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mutations: documents.map((document) => ({ createOrReplace: replaceImageAssets(document, assetIdsByPath) })),
    returnDocuments: false,
  }),
});
await mutationResponse.json();

const verification = await query(
  '{"counts":{"products":count(*[_type == "product"]),"news":count(*[_type == "news"]),"siteSettings":count(*[_type == "siteSettings"]),"pages":count(*[_type == "page"]),"publishedPages":count(*[_type == "page" && publishState == "published"])},"slugs":*[_type == "page" && slug.current in ["home","contact","overview","liquid-cooling-industry"]]{_id,"slug":slug.current,publishState}|order(slug),"contact":*[_id == "page--contact"][0]{title,publishState,blocks}}',
);
console.log(JSON.stringify({ documents: documents.length, uniqueImages: imagesByPath.size, uploadedAssets, reusedAssets: imagesByPath.size - uploadedAssets, verification }));
}
