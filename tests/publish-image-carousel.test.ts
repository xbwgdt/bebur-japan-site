import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const helperPath = "scripts/image-carousel-validation.mjs";
const load = async () => {
  expect(existsSync(helperPath), "release validation helper exists").toBe(true);
  return import("../" + helperPath);
};
const home = JSON.parse(readFileSync("content/ja/home-carousel.json", "utf8"));
const fixture = async () => {
  const helper = await load();
  return {helper, docs: helper.intendedTargets.map((row: {id:string;type:string;slug?:string}) => ({
    _id: row.id, _type: row.type, _rev: "test", publishState: "published", ...(row.slug ? {slug:{current:row.slug}} : {}),
    ...(row.type === "siteSettings" ? {homeCarousel:{slides:[]}} : row.type === "page" ? {contextImages:[]} : {coverImage:null,gallery:[]}),
  }))};
};

describe("image carousel release safeguards", () => {
  it("adds and validates the Sanity slide type and retains valid unique keys", async () => {
    const helper = await load();
    const carousel=await helper.prepareCarousel(home, async (image: {alt:string})=>({_type:"image",asset:{_type:"reference",_ref:"image-test"},alt:image.alt}));
    expect(carousel.slides).toHaveLength(6);
    expect(carousel.slides.map((slide: {_key:string})=>slide._key)).toEqual(home.slides.map((slide: {_key:string})=>slide._key));
    for(const slide of carousel.slides) expect(slide._type).toBe("homeCarouselSlide");
    expect(()=>helper.validateCarousel(carousel)).not.toThrow();
    for(const mutate of [
      (value:typeof carousel)=>delete value.slides[0]._type,
      (value:typeof carousel)=>value.slides[0]._key="bad.key",
      (value:typeof carousel)=>value.slides[1]._key=value.slides[0]._key,
      (value:typeof carousel)=>delete value.slides[0].image.asset,
    ]) {const invalid=structuredClone(carousel);mutate(invalid);expect(()=>helper.validateCarousel(invalid)).toThrow();}
    const invalid=structuredClone(home);invalid.slides[1]._key=invalid.slides[0]._key;
    await expect(helper.prepareCarousel(invalid, async()=>({}))).rejects.toThrow(/key/i);
  });

  it("pairs drafts by exact published ID and always uses the published slug", async () => {
    const {helper,docs}=await fixture();
    const published=docs.find((doc:{_type:string})=>doc._type==="page");
    const draft={...structuredClone(published),_id:`drafts.${published._id}`,slug:{current:"edited-draft-slug"}};
    const pairs=helper.targetPlan([...docs,draft]);
    const pair=pairs.find((row:{doc:{_id:string}})=>row.doc._id===draft._id);
    expect(pair.published._id).toBe(published._id);
    expect(pair.slug).toBe(published.slug.current);
    expect(pairs).toHaveLength(22);
    expect(()=>helper.targetPlan([...docs,{...draft,contextImages:[{alt:"unpublished edit"}]}])).toThrow(/divergent draft/i);
    const outside={...draft,_id:"drafts.not-a-target"};
    expect(helper.targetPlan([...docs,outside])).toHaveLength(21);
  });

  it("rejects replaced, missing, duplicate or renamed published targets even when counts match", async () => {
    const {helper,docs}=await fixture();
    expect(helper.targetPlan(docs)).toHaveLength(21);
    for(const altered of [docs.slice(1),[...docs,docs[0]],docs.map((doc: {_id:string},i:number)=>i!==1?doc:{...doc,_id:"wrong-id"}),docs.map((doc: {_id:string},i:number)=>i!==1?doc:{...doc,slug:{current:"wrong-slug"}})]) expect(()=>helper.targetPlan(altered)).toThrow();
  });

  it("rejects invalid prepared slides before apply and requires exact desired target coverage", async () => {
    const {helper,docs}=await fixture();
    const pairs=helper.targetPlan(docs);
    const carousel=await helper.prepareCarousel(home,async()=>({_type:"image",asset:{_type:"reference",_ref:"image-test"}}));
    const desired=pairs.map((pair:{doc:{_id:string};fields:string[]})=>({id:pair.doc._id,set:Object.fromEntries(pair.fields.map(field=>[field,field==="homeCarousel"?carousel:[]]))}));
    expect(()=>helper.validateDesired(pairs,desired)).not.toThrow();
    expect(()=>helper.validateDesired(pairs,desired.slice(1))).toThrow();
    expect(()=>helper.validateDesired(pairs,[...desired,desired[0]])).toThrow();
    const settings=desired.find((row:{id:string})=>row.id==="siteSettings");
    delete settings.set.homeCarousel.slides[0]._type;
    expect(()=>helper.validateDesired(pairs,desired)).toThrow();
    expect(()=>helper.validateCarousel(settings.set.homeCarousel)).toThrow(/type/i);
  });
});
