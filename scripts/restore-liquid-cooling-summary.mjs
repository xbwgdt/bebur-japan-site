import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { validateSanityImportDocuments } from "./validate-sanity-import.mjs";

const id = "page--liquid-cooling-cleanliness-testing";
const base = "https://gbzt89e5.api.sanity.io/v2025-02-19";
const config = [path.join(process.env.APPDATA ?? "", "sanity/config.json"), path.join(homedir(), ".config/sanity/config.json")].find(existsSync);
const token = process.env.SANITY_AUTH_TOKEN ?? (config && JSON.parse(readFileSync(config, "utf8")).authToken);
if (!token) throw new Error("Existing Sanity login required");
const request = async (route, options = {}) => {
  const r = await fetch(base + route, { ...options, signal: AbortSignal.timeout(60000), headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Sanity HTTP ${r.status}`);
  return r.json();
};
const query = async () => (await request(`/data/query/production?perspective=raw&query=${encodeURIComponent('*[_id in ["siteSettings", "page--liquid-cooling-cleanliness-testing", "drafts.page--liquid-cooling-cleanliness-testing"]]')}`)).result;
const before = await query();
const published = before.find(d => d._id === id);
const settings = before.find(d => d._id === "siteSettings");
if (published?.blocks?.length !== 25 || settings?.phone !== "080-5189-8663" || settings?.inquiryEmail !== "info@newtree-i.com") throw new Error("Page/contact precondition failed");
const source = JSON.parse(readFileSync("content/ja/liquid-cooling-solution.json", "utf8")).blocks.find(b => b._key === "summary");
const content = source.content.map((block, i) => ({ ...block, children: block.children.map((span, j) => ({ ...span, _key: `summary-${i}-${j}`, marks: [] })) }));
const targets = before.filter(d => d._id === id || d._id === `drafts.${id}`);
const patches = [];
const expected = [];
for (const doc of targets) {
  const block = doc.blocks.find(b => b._key === "summary");
  if (block?._type !== "richText" || block.anchorId !== "summary") throw new Error("Summary target mismatch");
  const next = structuredClone(doc);
  Object.assign(next.blocks.find(b => b._key === "summary"), { title: source.title, content });
  const assetIds = [...new Set(JSON.stringify(doc).match(/image-[a-z0-9-]+/g) ?? [])];
  const errors = await validateSanityImportDocuments([next], { existingDocumentIds: assetIds });
  if (errors.length) throw new Error(JSON.stringify(errors.map(({ path, message }) => ({ path, message }))));
  expected.push(next);
  if (!isDeepStrictEqual(block.title, source.title) || !isDeepStrictEqual(block.content, content)) patches.push({ patch: { id: doc._id, ifRevisionID: doc._rev, set: { 'blocks[_key=="summary"].title': source.title, 'blocks[_key=="summary"].content': content } } });
}
if (!process.argv.includes("--publish")) {
  console.log(JSON.stringify({ dryRun: true, documents: targets.map(d => d._id), fields: ["summary.title", "summary.content"], numberedPoints: content.filter(b => b.listItem === "number").length, separateAudience: true, preservedPageBlocks: published.blocks.length, validationErrors: 0, patchCount: patches.length }));
} else {
  mkdirSync(".codex-tmp/backups", { recursive: true });
  const backup = `.codex-tmp/backups/liquid-cooling-summary-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backup, JSON.stringify(before, null, 2));
  if (patches.length) await request("/data/mutate/production", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mutations: patches, visibility: "sync" }) });
  const after = await query();
  for (const next of expected) {
    const actual = after.find(d => d._id === next._id);
    for (const key of Object.keys(next).filter(k => !["_rev", "_updatedAt"].includes(k))) if (!isDeepStrictEqual(next[key], actual?.[key])) throw new Error(`Read-back mismatch: ${next._id}.${key}`);
  }
  if (!isDeepStrictEqual(settings, after.find(d => d._id === "siteSettings"))) throw new Error("Unrelated settings changed");
  console.log(JSON.stringify({ published: targets.map(d => d._id), changedOnly: ["summary.title", "summary.content"], preservedPageBlocks: published.blocks.length, unrelatedFieldsPreserved: true, contactsUnchanged: true, backup }));
}
