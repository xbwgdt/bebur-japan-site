import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { validateSanityImportDocuments } from "./validate-sanity-import.mjs";

const id = "page--liquid-cooling-cleanliness-testing";
const base = "https://gbzt89e5.api.sanity.io/v2025-02-19";
const configFile = [path.join(process.env.APPDATA ?? "", "sanity/config.json"), path.join(homedir(), ".config/sanity/config.json")].find(existsSync);
const token = process.env.SANITY_AUTH_TOKEN ?? (configFile && JSON.parse(readFileSync(configFile,"utf8")).authToken);
if (!token) throw new Error("Existing Sanity login required");
const request = async (pathname, options = {}) => {
  const r = await fetch(base + pathname, {...options,signal:AbortSignal.timeout(60000),headers:{...options.headers,Authorization:`Bearer ${token}`}});
  if (!r.ok) throw new Error(`Sanity HTTP ${r.status}`);
  return r.json();
};
const query = async () => (await request(`/data/query/production?query=${encodeURIComponent('*[_id in ["siteSettings", "page--liquid-cooling-cleanliness-testing"]]')}`)).result;
const before = await query();
const page = before.find(d=>d._id===id);
const settings = before.find(d=>d._id==="siteSettings");
if (!page?.blocks?.length || settings?.phone!=="080-5189-8663" || settings?.inquiryEmail!=="info@newtree-i.com") throw new Error("Page/contact precondition failed");
const design = page.liquidCoolingDesign ?? JSON.parse(readFileSync("content/ja/liquid-cooling-design.json","utf8"));
// A new animated diagram has no uploaded image asset. Sanity images must use
// asset references, so omit this optional empty placeholder from the seed.
if (!page.liquidCoolingDesign && !design.diagram.image?.asset?.url) delete design.diagram.image;
const assetIds = [...new Set(JSON.stringify(page).match(/image-[a-z0-9-]+/g) ?? [])];
const errors = await validateSanityImportDocuments([{...page,liquidCoolingDesign:design}], {existingDocumentIds:assetIds});
if (errors.length) throw new Error(JSON.stringify(errors.map(({path,message})=>({path,message}))));
if (!process.argv.includes("--publish")) {
  console.log(JSON.stringify({dryRun:true,document:id,addOnly:page.liquidCoolingDesign?[]:["liquidCoolingDesign"],preservedBlocks:page.blocks.length,validationErrors:0,contactVerified:true}));
} else {
  if (!page.liquidCoolingDesign) await request("/data/mutate/production",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mutations:[{patch:{id,ifRevisionID:page._rev,setIfMissing:{liquidCoolingDesign:design}}}],visibility:"sync"})});
  const after = await query();
  const confirmed = after.find(d=>d._id===id);
  if (!isDeepStrictEqual(confirmed.liquidCoolingDesign,design)) throw new Error("Design read-back mismatch");
  for (const key of Object.keys(page).filter(k=>!['_rev','_updatedAt'].includes(k))) {
    if (!isDeepStrictEqual(page[key],confirmed[key])) throw new Error(`Unrelated page field changed: ${key}`);
  }
  if (!isDeepStrictEqual(settings,after.find(d=>d._id==="siteSettings"))) throw new Error("Unrelated site settings changed");
  console.log(JSON.stringify({published:id,createdField:!page.liquidCoolingDesign,allPreviousFieldsPreserved:true,blocks:confirmed.blocks.length,contactsUnchanged:true,designReadBackVerified:true}));
}
