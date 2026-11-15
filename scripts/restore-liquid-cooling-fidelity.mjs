import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { buildFidelityPage, publicationFingerprint, requirePublicationFingerprint } from "./lib/liquid-cooling-fidelity.mjs";
import { validateSanityImportDocuments } from "./validate-sanity-import.mjs";

const id = "page--liquid-cooling-cleanliness-testing";
const base = "https://gbzt89e5.api.sanity.io/v2025-02-19";
const config = [path.join(process.env.APPDATA ?? "", "sanity/config.json"), path.join(homedir(), ".config/sanity/config.json")].find(existsSync);
const token = process.env.SANITY_AUTH_TOKEN ?? (config && JSON.parse(readFileSync(config, "utf8")).authToken);
if (!token) throw new Error("Existing Sanity login required");
async function request(route, options = {}) {
  const response = await fetch(base + route, { ...options, signal: AbortSignal.timeout(60000), headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Sanity HTTP ${response.status}`);
  return response.json();
}
const query = async () => (await request(`/data/query/production?perspective=raw&query=${encodeURIComponent('*[_id in ["siteSettings", "page--liquid-cooling-cleanliness-testing", "drafts.page--liquid-cooling-cleanliness-testing"]]')}`)).result;
const before = await query();
const settings = before.find(document => document._id === "siteSettings");
const pages = before.filter(document => [id, `drafts.${id}`].includes(document._id));
if (!pages.some(document => document._id === id) || settings?.phone !== "080-5189-8663" || settings?.inquiryEmail !== "info@newtree-i.com") throw new Error("Page/contact precondition failed");
const source = JSON.parse(readFileSync("content/ja/liquid-cooling-solution.json", "utf8"));
const design = JSON.parse(readFileSync("content/ja/liquid-cooling-design.json", "utf8"));
const standardsLocalization = process.argv.includes("--jp-us-standards");
if (standardsLocalization && pages.some(page => page._id.startsWith("drafts."))) throw new Error("Unexpected draft requires separate review before standards publication");
const expected = pages.map(page => buildFidelityPage(page, source, design, { approvedDesignFields: standardsLocalization ? ["metrics", "navigation"] : [] }));
for (const page of expected) {
  const assets = [...new Set(JSON.stringify(page).match(/image-[a-z0-9-]+/g) ?? [])];
  const errors = await validateSanityImportDocuments([page], { existingDocumentIds: assets });
  if (errors.length) throw new Error(JSON.stringify(errors.map(({ path, message }) => ({ path, message }))));
}
const fields = ["title", "blocks", "liquidCoolingDesign"];
const mutations = expected.flatMap(page => {
  const previous = pages.find(document => document._id === page._id);
  const set = Object.fromEntries(fields.filter(field => !isDeepStrictEqual(previous[field], page[field])).map(field => [field, page[field]]));
  return Object.keys(set).length ? [{ patch: { id: page._id, ifRevisionID: previous._rev, set } }] : [];
});
const hash = publicationFingerprint(pages, expected);
if (!process.argv.includes("--publish")) {
  console.log(JSON.stringify({ dryRun: true, documents: expected.map(page => page._id), beforeBlocks: pages.map(page => page.blocks.length), afterBlocks: expected.map(page => page.blocks.length), validationErrors: 0, protectedMediaAndStyles: true, contactVerified: true, changedFields: mutations.map(mutation => Object.keys(mutation.patch.set)), hash }));
} else {
  const approvedHash = process.argv.find(argument=>argument.startsWith("--expected-hash="))?.slice("--expected-hash=".length);
  requirePublicationFingerprint(approvedHash,pages,expected);
  mkdirSync(".codex-tmp/backups", { recursive: true });
  const backup = `.codex-tmp/backups/liquid-cooling-fidelity-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backup, JSON.stringify(before, null, 2));
  if (mutations.length) await request("/data/mutate/production", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mutations, visibility: "sync" }) });
  const after = await query();
  for (const page of expected) {
    const actual = after.find(document => document._id === page._id);
    for (const key of Object.keys(page).filter(key => !["_rev", "_updatedAt"].includes(key))) if (!isDeepStrictEqual(page[key], actual?.[key])) throw new Error(`Read-back mismatch: ${page._id}.${key}`);
  }
  if (!isDeepStrictEqual(settings, after.find(document => document._id === "siteSettings"))) throw new Error("Site settings changed during publication");
  console.log(JSON.stringify({ published: expected.map(page => page._id), pageBlocks: expected[0].blocks.length, textReadBackVerified: true, unrelatedFieldsPreserved: true, contactsUnchanged: true, backup, hash }));
}
