import type { ContentImage } from "./types";
import { getSanityClient } from "./sanity/client";

type ImagePage={slug:string;contextImages?:unknown[];blocks?:unknown[]};
function image(value:unknown):ContentImage|undefined{
  if(!value||typeof value!=="object")return;
  const candidate=value as {asset?:{url?:unknown};alt?:unknown};
  if(typeof candidate.asset?.url!=="string"||typeof candidate.alt!=="string"||!candidate.alt.trim()||/[<>\u0000-\u001f]/u.test(candidate.alt))return;
  try{
    const url=new URL(candidate.asset.url);
    if(url.protocol!=="https:"||url.hostname!=="cdn.sanity.io"||!url.pathname.startsWith("/images/gbzt89e5/"))return;
    return {src:url.href,alt:candidate.alt.trim()};
  }catch{return;}
}

/** Dedicated photo fields only: never let legacy generic page blocks replace the canonical design. */
export function resolveApplicationImages<T extends {slug:string;images:ContentImage[]}>(records:readonly T[], pages:readonly ImagePage[]):T[]{
  const bySlug=new Map(pages.map(page=>[page.slug,page]));
  return records.map(record=>{
    const page=bySlug.get(record.slug);
    if(!Array.isArray(page?.contextImages))return structuredClone(record);
    const images=page.contextImages.flatMap(value=>{const normalized=image(value);return normalized?[normalized]:[];});
    if(page.contextImages.length&&!images.length)return structuredClone(record);
    return {...structuredClone(record),images};
  });
}

export async function loadApplicationImages<T extends {slug:string;images:ContentImage[]}>(records:readonly T[]):Promise<T[]>{
  const client=getSanityClient();
  if(!client)return structuredClone([...records]);
  try{
    const pages=await client.fetch<ImagePage[]>(`*[_type=="page" && publishState=="published" && defined(contextImages)]{"slug":slug.current,contextImages[]{alt,asset->{url}}}`,{buildSnapshot:Date.now().toString(36)},{cache:"force-cache"});
    return Array.isArray(pages)?resolveApplicationImages(records,pages):structuredClone([...records]);
  }catch{return structuredClone([...records]);}
}
