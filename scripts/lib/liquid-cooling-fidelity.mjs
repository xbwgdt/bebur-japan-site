import { createHash } from "node:crypto";
const pageId = "page--liquid-cooling-cleanliness-testing";

export function publicationFingerprint(before, after) {
  return createHash("sha256").update(JSON.stringify({before:before.map(page=>({id:page._id,revision:page._rev})),after})).digest("hex");
}
export function requirePublicationFingerprint(expected, before, after) {
  if (!expected || expected !== publicationFingerprint(before, after)) throw new Error("Publication fingerprint changed or missing; review a fresh dry run");
}

function mergeKeyed(current = [], reviewed = []) {
  const existing = new Map(current.map(entry=>[entry._key,entry]));
  const keys = new Set(reviewed.map(entry=>entry._key));
  return [...reviewed.map(entry=>({...structuredClone(existing.get(entry._key) ?? {}),...structuredClone(entry)})),...structuredClone(current.filter(entry=>!keys.has(entry._key)))];
}
const copyFields = {
  hero: ["title", "summary", "ctaLabel", "ctaHref"],
  richText: ["title", "content"],
  dataTable: ["title", "columns", "rows"],
  cardGrid: ["title", "cards"],
  cta: ["title", "summary", "label", "href"],
};

function arrayKeys(value) {
  if (!value || typeof value !== "object") return value;
  for (const [field, children] of Object.entries(value)) {
    if (Array.isArray(children)) children.forEach((child, index) => {
      if (child && typeof child === "object") {
        child._key ??= `${field}-${index}`;
        if (field === "rows") child._type ??= "dataRow";
        if (field === "cards") child._type ??= "card";
        if (field === "children") child.marks ??= [];
        arrayKeys(child);
      }
    });
    else arrayKeys(children);
  }
  return value;
}

/** Build the reviewed text-only page update without replacing uploaded media or styles. */
export function buildFidelityPage(current, source, design) {
  if (![pageId, `drafts.${pageId}`].includes(current?._id)) throw new Error("Unexpected page target");
  const existing = new Map((current.blocks ?? []).map(block => [block._key, block]));
  const keys = source.blocks.map(block => block._key);
  if (keys.some(key => !key) || new Set(keys).size !== keys.length) throw new Error("Duplicate or absent source block key");
  for (const key of existing.keys()) if (!keys.includes(key)) throw new Error(`Current CMS block missing from reviewed source: ${key}`);
  const next = structuredClone(current);
  next.title = source.title;
  next.blocks = source.blocks.map(block => {
    const previous = existing.get(block._key);
    if (!copyFields[block._type]) throw new Error(`Unsupported source block type: ${block._type}`);
    if (!previous) {
      if (JSON.stringify(block).includes('"asset"')) throw new Error("New media requires separate asset review");
      return arrayKeys(structuredClone(block));
    }
    if (previous._type !== block._type || previous.anchorId !== block.anchorId) throw new Error(`Current CMS block identity changed: ${block._key}`);
    const result = structuredClone(previous);
    for (const field of copyFields[block._type]) {
      if (!Object.hasOwn(block, field)) continue;
      if (field === "cards") {
        const cards = new Map((previous.cards ?? []).map(card => [card._key, card]));
        result.cards = block.cards.map(card => {
          const before = cards.get(card._key);
          if (!before && card.image) throw new Error("New card media requires separate asset review");
          return { ...structuredClone(before ?? {}), ...Object.fromEntries(["_key", "title", "summary", "linkLabel", "href"].filter(key => Object.hasOwn(card, key)).map(key => [key, structuredClone(card[key])])) };
        });
        for (const old of previous.cards ?? []) if (!result.cards.some(card => card._key === old._key)) throw new Error(`Current CMS card would be removed: ${old._key}`);
      } else result[field] = structuredClone(block[field]);
    }
    return arrayKeys(result);
  });
  next.liquidCoolingDesign ??= {};
  for (const key of ["eyebrow", "metadata", "metricNote", "parameters"]) if (Object.hasOwn(design, key)) next.liquidCoolingDesign[key] = ["metadata","parameters"].includes(key) ? mergeKeyed(next.liquidCoolingDesign[key],design[key]) : structuredClone(design[key]);
  return next;
}
