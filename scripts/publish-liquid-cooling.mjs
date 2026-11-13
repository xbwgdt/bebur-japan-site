import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { validateSanityImportDocuments } from "./validate-sanity-import.mjs";

const root = process.cwd();
const projectId = "gbzt89e5";
const dataset = "production";
const api = `https://${projectId}.api.sanity.io/v2025-02-19`;
const load = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));

function portableText(sections) {
  let n = 0;
  const make = (text, style = "normal", listItem) => ({
    _key: `text${n++}`, _type: "block", style, ...(listItem ? { listItem } : {}), markDefs: [],
    children: [{ _key: "span", _type: "span", text, marks: [] }],
  });
  return sections.flatMap((section) => [make(section.heading, "h2"), ...section.paragraphs.map((text) => make(text)), ...(section.bullets ?? []).map((text) => make(text, "normal", "bullet"))]);
}

export function buildReleaseDocuments() {
  const products = load("content/ja/liquid-cooling-sensors.json").map((product) => ({
    _id: `product--water-quality--${product.slug}`, _type: "product", category: product.category,
    title: product.title, model: product.model, slug: { _type: "slug", current: product.slug },
    summary: product.description, principle: product.principle, body: portableText(product.sections), features: product.features, applications: product.applications,
    specifications: product.specifications.map((row, i) => ({ _key: `spec${i}`, _type: "specification", ...row })),
    relatedProducts: product.relatedSlugs.map((slug) => ({ _key: slug, _type: "reference", _ref: slug === "bt8500" ? `product--cleanliness--${slug}` : `product--water-quality--${slug}` })),
    coverImage: { _type: "image", alt: product.images[0].alt, asset: { url: product.images[0].src } },
    gallery: product.images.slice(1).map((image, i) => ({ _key: `image${i}`, _type: "image", alt: image.alt, asset: { url: image.src } })),
    seoTitle: product.seoTitle, seoDescription: product.seoDescription, publishState: "published",
  }));
  const page = load("content/ja/liquid-cooling-solution.json");
  function addArrayKeys(value) {
    if (!value || typeof value !== "object") return;
    for (const [field, item] of Object.entries(value)) {
      if (Array.isArray(item)) item.forEach((child, i) => { if (child && typeof child === "object") { child._key ??= `item${i}`; if (field === "rows") child._type ??= "dataRow"; if (field === "cards") child._type ??= "card"; addArrayKeys(child); } });
      else addArrayKeys(item);
    }
  }
  addArrayKeys(page);
  return [...products, page];
}

async function run() {
  const documents = buildReleaseDocuments();
  const validateOnly = process.argv.includes("--validate-only");
  const dryRun = process.argv.includes("--dry-run");
  const updateRelease = process.argv.includes("--update-release");
  const config = [path.join(process.env.APPDATA ?? path.join(homedir(), "AppData", "Roaming"), "sanity", "config.json"), path.join(homedir(), ".config", "sanity", "config.json")].find(existsSync);
  const token = process.env.SANITY_AUTH_TOKEN ?? (config ? JSON.parse(readFileSync(config, "utf8")).authToken : undefined);
  const request = async (pathname, options = {}) => {
    const response = await fetch(`${api}${pathname}`, { ...options, signal: AbortSignal.timeout(60000), headers: { ...options.headers, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Sanity request ${response.status}: ${await response.text()}`);
    return response.json();
  };
  const query = async (groq, params = {}) => (await request(`/data/query/${dataset}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: groq, params }) })).result;
  const images = new Map();
  const normalizeImages = async (value, validation = false) => {
    if (!value || typeof value !== "object") return;
    if (value._type === "image" && value.asset?.url) {
      const source = value.asset.url;
      if (validation) { value.asset = { _type: "reference", _ref: "image-0123456789012345678901234567890123456789-820x500-svg" }; return; }
      if (!images.has(source)) {
        if (!source.startsWith("/media/") && !source.startsWith("/source-media/")) throw new Error(`Use a reviewed local image: ${source}`);
        const file = path.resolve(root, "public", source.slice(1));
        if (!file.startsWith(path.resolve(root, "public") + path.sep)) throw new Error("Image outside public");
        const bytes = readFileSync(file);
        const sha1hash = createHash("sha1").update(bytes).digest("hex");
        const known = await query('*[_type == "sanity.imageAsset" && sha1hash == $sha1hash][0]{_id}', { sha1hash });
        const mime = source.endsWith(".svg") ? "image/svg+xml" : source.endsWith(".png") ? "image/png" : "image/jpeg";
        const id = known?._id ?? (await request(`/assets/images/${dataset}?filename=${encodeURIComponent(path.basename(file))}`, { method: "POST", headers: { "Content-Type": mime }, body: bytes })).document._id;
        images.set(source, id);
      }
      value.asset = { _type: "reference", _ref: images.get(source) };
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) { for (const item of child) await normalizeImages(item, validation); }
      else if (child && typeof child === "object") await normalizeImages(child, validation);
    }
  };
  const checked = structuredClone(documents);
  for (const document of checked) await normalizeImages(document, true);
  const baseline = readFileSync(path.join(root, "sanity/import/initial.ndjson"), "utf8").trim().split(/\r?\n/).map(JSON.parse);
  const errors = await validateSanityImportDocuments(checked, { existingDocumentIds: [...baseline.map(({ _id }) => _id), "image-0123456789012345678901234567890123456789-820x500-svg"] });
  if (errors.length) throw new Error(JSON.stringify(errors.map(({ path, message }) => ({ path, message })), null, 2));
  if (validateOnly) { console.log(JSON.stringify({ validated: documents.map(({ _id }) => _id), errors: 0 })); return; }
  if (!token) throw new Error("Existing Sanity login is required.");
  const before = await query('*[_id == "siteSettings"][0]');
  if (before?.phone !== "080-5189-8663" || before?.inquiryEmail !== "info@newtree-i.com") throw new Error("Unexpected contact settings; refusing write");
  const existing = await query('*[_id in $ids]{_id,_rev}', { ids: documents.map(({ _id }) => _id) });
  const knownIds = new Set(existing.map(({ _id }) => _id));
  const absent = documents.filter(({ _id }) => !knownIds.has(_id));
  const selected = updateRelease ? documents : absent;
  if (dryRun) { console.log(JSON.stringify({ dryRun: true, validated: documents.length, create: absent.map(({ _id }) => _id), update: updateRelease ? [...knownIds] : [], preserveExisting: updateRelease ? [] : [...knownIds], settingsFields: ["homeSolution", "navigationLabels.solutions"], contactVerified: true })); return; }
  for (const document of selected) await normalizeImages(document);
  const promotion = {
    eyebrow: "液冷・データセンター", title: "液冷システムの清浄度検査ソリューション",
    summary: "粒子計数とpH・導電率・濁度の測定で、部品洗浄から運用監視まで。測定項目、検査工程、機器選定をまとめてご確認いただけます。",
    image: { _type: "image", asset: { url: "/media/liquid-cooling-monitoring.svg" }, alt: "液冷二次側ループにおける水質測定と粒子計数の配置例" },
    action: { label: "液冷ソリューションを見る", href: "/solutions/liquid-cooling-cleanliness-testing" }, style: { color: "deepBlue", fontSize: "md", fontFamily: "sans" },
  };
  await normalizeImages(promotion);
  const mutations = [...selected.map((document) => {
    const previous = existing.find(({ _id }) => _id === document._id);
    if (!previous) return { create: document };
    const { _id, _type, ...set } = document;
    return { patch: { id: _id, ifRevisionID: previous._rev, set } };
  }), { patch: { id: before._id, ifRevisionID: before._rev, setIfMissing: { homeSolution: promotion, "navigationLabels.solutions": "液冷ソリューション" } } }];
  await request(`/data/mutate/${dataset}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mutations, visibility: "sync" }) });
  const after = await query('*[_id == "siteSettings"][0]');
  for (const key of Object.keys(before).filter((key) => !["_rev", "_updatedAt", "homeSolution", "navigationLabels"].includes(key))) {
    if (!isDeepStrictEqual(before[key], after[key])) throw new Error(`Unrelated settings changed: ${key}`);
  }
  const confirmed = await query('*[_id in $ids]{_id,title,publishState}', { ids: documents.map(({ _id }) => _id) });
  if (confirmed.length !== 4 || confirmed.some(({ publishState }) => publishState !== "published")) throw new Error("Published document verification failed");
  if (!isDeepStrictEqual(after.homeSolution, before.homeSolution ?? promotion)) throw new Error("Homepage promotion read-back mismatch");
  if (after.navigationLabels?.solutions !== (before.navigationLabels?.solutions ?? "液冷ソリューション")) throw new Error("Navigation read-back mismatch");
  const otherNavigation = ({ solutions, ...rest }) => rest;
  if (!isDeepStrictEqual(otherNavigation(after.navigationLabels), otherNavigation(before.navigationLabels))) throw new Error("Unrelated navigation changed");
  const stored = await query('*[_id in $ids]', { ids: selected.map(({ _id }) => _id) });
  for (const document of selected) {
    const actual = stored.find(({ _id }) => _id === document._id);
    for (const key of Object.keys(document)) if (!isDeepStrictEqual(actual?.[key], document[key])) throw new Error(`Content read-back mismatch: ${document._id}.${key}`);
  }
  console.log(JSON.stringify({ published: confirmed, created: absent.length, updated: selected.length - absent.length, images: images.size, contentReadBackVerified: true, promotionReadBackVerified: true, contactVerified: after.phone === before.phone && after.inquiryEmail === before.inquiryEmail }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch((error) => { console.error(error.message); process.exitCode = 1; });
