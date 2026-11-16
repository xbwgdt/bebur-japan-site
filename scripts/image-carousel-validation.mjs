// Pure release checks live outside ignored scratch files so regression tests
// remain reproducible from a clean checkout. No network calls or mutations.
import {isDeepStrictEqual as equal} from 'node:util';

const appSlugs=['industry-solutions','liquid-cooling-industry','municipal-water-treatment','electric-power-industry','medical-pharmaceutical','chemical-industry','environmental-protection','food-industry','hydraulic-industry','bt8200-liquid-cooling','liquid-particle-counter-pharmaceutical','medical-pharmaceutical-cases','plate-heat-exchanger-cleanliness','scm530-power-plant-dosing'];
const productSlugs=['bt-9000c','bt-9000l','bt-9000s'];
const newsSlugs=['particle-charge-analyzer-papermaking','residual-chlorine-detector-brands-2026-april','toc-analyzer-brands-2026'];
export const intendedTargets=[
  {id:'siteSettings',type:'siteSettings'},
  ...appSlugs.map(slug=>({id:'page--'+slug,type:'page',slug})),
  ...productSlugs.map(slug=>({id:'product--dosing--'+slug,type:'product',slug})),
  ...newsSlugs.map(slug=>({id:'news--'+slug,type:'news',slug})),
];
const allowed={siteSettings:['homeCarousel'],page:['contextImages'],product:['coverImage','gallery'],news:['coverImage','gallery']};
const validKey=key=>typeof key==='string'&&/^[a-zA-Z0-9_-]+$/.test(key);
function validateKeys(slides){
  if(!Array.isArray(slides)||slides.length>20)throw Error('Invalid carousel slides');
  const keys=new Set();
  for(const slide of slides){
    if(!validKey(slide?._key)||keys.has(slide._key))throw Error('Invalid or duplicate carousel key');
    keys.add(slide._key);
  }
}
export function validateCarousel(carousel){
  validateKeys(carousel?.slides);
  for(const slide of carousel.slides){
    if(slide._type!=='homeCarouselSlide')throw Error('Invalid carousel slide type');
    if(slide.image?._type!=='image'||slide.image.asset?._type!=='reference'||!slide.image.asset._ref)throw Error('Invalid carousel image reference');
  }
}
export async function prepareCarousel(home,upload){
  const carousel=structuredClone(home);
  validateKeys(carousel.slides);
  for(const slide of carousel.slides){slide._type='homeCarouselSlide';slide.image=await upload(slide.image);}
  validateCarousel(carousel);
  return carousel;
}
export function targetPlan(all){
  const ids=new Set(all.map(doc=>doc._id));
  if(ids.size!==all.length)throw Error('Duplicate document ID');
  const published=all.filter(doc=>!doc._id.startsWith('drafts.')&&intendedTargets.some(row=>doc._id===row.id||(doc._type===row.type&&row.slug&&doc.slug?.current===row.slug)));
  if(published.length!==21||!equal(published.map(doc=>doc._id).sort(),intendedTargets.map(row=>row.id).sort()))throw Error('Expected exact allowlist of 21 published target IDs');
  const plan=[];
  for(const target of intendedTargets){
    const doc=all.find(row=>row._id===target.id);
    if(doc?._type!==target.type||(target.slug&&(doc.slug?.current!==target.slug||doc.publishState!=='published')))throw Error('Published target identity mismatch '+target.id);
    const fields=allowed[doc._type];
    plan.push({doc,published:doc,fields,slug:target.slug});
    const draft=all.find(row=>row._id==='drafts.'+target.id);
    if(draft){
      if(draft._type!==doc._type||fields.some(field=>!equal(draft[field],doc[field])))throw Error('Affected fields have divergent draft '+draft._id);
      plan.push({doc:draft,published:doc,fields,slug:target.slug});
    }
  }
  return plan;
}
export function validateDesired(plan,desired){
  if(!Array.isArray(desired)||desired.length!==plan.length||new Set(desired.map(change=>change.id)).size!==desired.length||!equal(desired.map(change=>change.id).sort(),plan.map(pair=>pair.doc._id).sort()))throw Error('Desired target coverage mismatch');
  for(const change of desired){
    const pair=plan.find(row=>row.doc._id===change.id);
    if(!equal(Object.keys(change.set).sort(),[...pair.fields].sort()))throw Error('Field allowlist mismatch');
    if(pair.doc._type==='siteSettings')validateCarousel(change.set.homeCarousel);
  }
}
