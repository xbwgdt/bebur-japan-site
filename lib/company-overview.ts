import defaults from "@/content/ja/company-overview.json";
import type { CSSProperties } from "react";
import type { PageBlock, PageBlockStyle } from "./page-blocks";
import type { SanityPage, SanityImage } from "./sanity/queries";
import { getPublishedPageForRoute } from "./cms-pages";

export const localCompanyOverview = { ...defaults, blocks: defaults.blocks as PageBlock[] } as SanityPage;
export type CompanyOverviewStyle = typeof defaults.companyOverviewStyle;
const colors = ["primary", "background", "surface", "text", "muted"] as const;

export function resolveCompanyOverviewStyle(value?: unknown): CompanyOverviewStyle {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const result = { ...defaults.companyOverviewStyle };
  for (const key of colors) if (typeof input[key] === "string" && /^#[0-9a-f]{6}$/i.test(input[key])) result[key] = input[key];
  result.fontFamily = input.fontFamily === "serif" ? "serif" : "sans";
  for (const key of ["eyebrow", "navigationLabel", "documentActionLabel"] as const) {
    const text = input[key];
    if (typeof text === "string" && text.trim() && text.length <= 80 && !/[<>\x00-\x1f]/.test(text)) result[key] = text.trim();
  }
  return result;
}

export function companyOverviewStyle(value?: unknown): CSSProperties {
  const style = resolveCompanyOverviewStyle(value);
  return Object.fromEntries(colors.map(key => [`--overview-${key}`, style[key]])) as CSSProperties;
}

export function overviewBlockStyle(block: PageBlockStyle): CSSProperties {
  const sizes = { sm: .9, md: 1, lg: 1.12, xl: 1.25 };
  const spaces = { compact: "2.5rem", normal: "4.5rem", spacious: "6rem" };
  return { "--overview-block-scale": Object.hasOwn(sizes,block.fontSize??"") ? sizes[block.fontSize as keyof typeof sizes] : 1, "--overview-block-space": Object.hasOwn(spaces,block.spacing??"") ? spaces[block.spacing as keyof typeof spaces] : spaces.normal, textAlign: block.alignment === "center" ? "center" : "left" } as CSSProperties;
}

const object = (value: unknown): Record<string,unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;

function cleanImage(value: unknown): SanityImage | undefined {
  const image=object(value), url=overviewImage(text(object(image.asset).url),false);
  return url ? { alt:text(image.alt), asset:{url} } : undefined;
}

function cleanOverview(page: unknown): SanityPage | null {
  const input=object(page);
  const blocks=array(input.blocks).flatMap(value=>{
    const original=object(value), type=original._type;
    if(typeof type!=="string" || !["hero","cardGrid","richText","gallery","dataTable","cta"].includes(type)) return [];
    const block:Record<string,unknown>={...original,title:text(original.title),summary:text(original.summary),label:text(original.label),ctaLabel:text(original.ctaLabel),ctaHref:overviewHref(text(original.ctaHref)),image:cleanImage(original.image),anchorId:text(original.anchorId),fontSize:text(original.fontSize),spacing:text(original.spacing),alignment:text(original.alignment),color:text(original.color),desktopTitleWrap:text(original.desktopTitleWrap)};
    if(type==="dataTable"&&array(original.columns).some(value=>typeof value!=="string"||!value.trim())) return [];
    if(type==="cardGrid") block.cards=array(original.cards).map(object).filter(card=>typeof card.title==="string"&&card.title.trim()).map(card=>({...card,title:text(card.title),summary:text(card.summary),linkLabel:text(card.linkLabel),href:overviewHref(text(card.href)),image:cleanImage(card.image)}));
    if(type==="richText") block.content=array(original.content).map(object).map(paragraph=>({...paragraph,style:paragraph.style==="h1"?"h3":text(paragraph.style),children:array(paragraph.children).map(object).filter(child=>typeof child.text==="string").map(child=>({text:child.text}))}));
    if(type==="gallery") block.images=array(original.images).map(cleanImage).filter(Boolean);
    if(type==="dataTable") {block.columns=array(original.columns).filter(value=>typeof value==="string");block.rows=array(original.rows).map(object).map(row=>({cells:array(row.cells).map(value=>text(value)??"")}));}
    return [block as unknown as PageBlock];
  });
  return {...localCompanyOverview,...input,_id:text(input._id)??localCompanyOverview._id,title:text(input.title)||localCompanyOverview.title,slug:"overview",seoTitle:text(input.seoTitle)||localCompanyOverview.seoTitle,seoDescription:text(input.seoDescription)||localCompanyOverview.seoDescription,blocks} as SanityPage;
}

function hasBody(page: SanityPage | null): page is SanityPage {
  return Boolean(page?.blocks?.some(block =>
    block._type === "cardGrid" ? block.cards?.some(card => card.title?.trim()) :
    block._type === "richText" ? block.content?.some(p => p.children?.some(c => c.text?.trim())) :
    block._type === "gallery" ? block.images?.some(image => image.asset?.url) :
    block._type === "dataTable" ? block.columns?.length && block.rows?.some(row=>row.cells?.some(Boolean)) :
    block._type === "cta" ? Boolean(block.title?.trim() && block.summary?.trim()) : false));
}

export async function getCompanyOverview(): Promise<SanityPage> {
  try {
    const published = await getPublishedPageForRoute("overview");
    const usable = cleanOverview(published);
    return hasBody(usable) ? usable : structuredClone(localCompanyOverview);
  } catch { return structuredClone(localCompanyOverview); }
}

export function overviewSections(blocks: PageBlock[]) {
  const used = new Set<string>();
  return blocks.filter(block => block._type !== "hero").map((block, index) => {
    let id = block.anchorId && /^[a-z][a-z0-9-]*$/.test(block.anchorId) ? block.anchorId : `company-section-${index + 1}`;
    while (used.has(id)) id += "-next";
    used.add(id); return { id, block };
  });
}

export function overviewImage(url?: string, preview = true): string | null {
  if (typeof url !== "string" || !url) return null;
  if (url.startsWith("/media/company-overview/") && /^\/[a-zA-Z0-9/_.-]+$/.test(url)) return preview ? url.replace(/\.(png|jpg)$/i, "-preview.webp") : url;
  if (/^\/source-media\/[a-zA-Z0-9_.-]+$/.test(url)) return url;
  if (/^https:\/\/cdn\.sanity\.io\/images\//.test(url)) {
    const parsed = new URL(url); if (preview) { parsed.searchParams.set("w", "1000"); parsed.searchParams.set("auto", "format"); parsed.searchParams.set("fit", "max"); }
    return parsed.href;
  }
  return null;
}

export function overviewHref(value?: string): string | null {
  return typeof value === "string" && !/[\\\s<>"\x00-\x1f]/.test(value) && (/^\/(?!\/)/.test(value) || /^#[a-z][a-z0-9-]*$/.test(value)) ? value : null;
}
