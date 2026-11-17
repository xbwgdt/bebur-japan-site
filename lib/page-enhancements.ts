import defaults from "../content/ja/page-enhancements.json";
import applicationDefaults from "../content/ja/application-product-selections.json";
import { isProductCategory, productCategoryLabels } from "./routes";

export type CategoryHero = typeof defaults.dosing;
export type ApplicationProductSelection = {
  title: string; summary: string;
  groups: Array<{category: string; title: string; summary: string; moreLabel: string; productSlugs: string[]}>;
  navigation?: {title: string; summary: string; items: Array<{slug: string; title: string; summary: string}>};
};
const applicationSelections: Record<string, ApplicationProductSelection> = {...applicationDefaults, "chemical-industry": defaults["chemical-industry"]};
export const applicationProductPageSlugs = Object.keys(applicationSelections);
const industryLinks = applicationDefaults["industry-solutions"].navigation.items;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
function text(value: unknown, fallback: string, max = 300): string {
  return typeof value === "string" && value.trim() && value.length <= max && !/[<>\u0000-\u001f\u007f]/u.test(value) ? value.trim() : fallback;
}
function preset(value: unknown, allowed: string[], fallback: string): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

/** Dedicated fields only; legacy generic page blocks never replace a route's layout. */
export function resolveCategoryHero(category: string, value?: unknown): CategoryHero | undefined {
  if (category !== "dosing" && category !== "application-index") return;
  const fallback = structuredClone(defaults[category]), input = object(value);
  const image = object(input.image), asset = object(image.asset);
  let src = fallback.image.src;
  if (typeof asset.url === "string") {
    try {
      const url = new URL(asset.url);
      if (url.protocol === "https:" && url.hostname === "cdn.sanity.io" && !url.username && !url.password && url.pathname.startsWith("/images/gbzt89e5/production/")) src = url.href;
    } catch { /* Keep the reviewed local image. */ }
  }
  return {
    eyebrow: text(input.eyebrow, fallback.eyebrow, 60), title: text(input.title, fallback.title, 100),
    summary: text(input.summary, fallback.summary), image: { src, alt: text(image.alt, fallback.image.alt, 160) },
    color: preset(input.color, ["deepBlue", "light"], fallback.color),
    fontFamily: preset(input.fontFamily, ["sans", "serif"], fallback.fontFamily),
    fontSize: preset(input.fontSize, ["sm", "md", "lg"], fallback.fontSize),
  };
}

export function resolveApplicationProducts(slug: string, value?: unknown, catalog?: readonly {slug: string; category: string}[]): ApplicationProductSelection | undefined {
  if (!Object.hasOwn(applicationSelections, slug)) return;
  const fallback = structuredClone(applicationSelections[slug]), input = object(value);
  const groups = Array.isArray(input.groups) ? input.groups.slice(0, 8).flatMap(value => {
    const group = object(value);
    if (typeof group.category !== "string" || (group.category !== "all" && !isProductCategory(group.category))) return [];
    const categoryLabel = group.category === "all" ? "製品" : productCategoryLabels[group.category];
    const base = fallback.groups.find(item => item.category === group.category) ?? {title:categoryLabel,summary:fallback.summary,moreLabel:`${categoryLabel}をすべて見る`};
    if (!Array.isArray(group.productSlugs)) return [];
    const productSlugs = [...new Set(group.productSlugs.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) && (!catalog || catalog.some(product => product.slug === slug && (group.category === "all" || product.category === group.category)))))].slice(0, 12);
    if (!productSlugs.length) return [];
    return [{ category: group.category, title: text(group.title, base.title, 100), summary: text(group.summary, base.summary), moreLabel: text(group.moreLabel, base.moreLabel, 60), productSlugs }];
  }) : fallback.groups;
  const result: ApplicationProductSelection = { title: text(input.title, fallback.title, 100), summary: text(input.summary, fallback.summary), groups: Array.isArray(input.groups) && input.groups.length && !groups.length ? fallback.groups : groups };
  if (slug === "industry-solutions" && fallback.navigation) {
    const navigation = object(input.navigation), seen = new Set<string>();
    const items = Array.isArray(navigation.items) ? navigation.items.slice(0,8).flatMap(value => {
      const item = object(value), base = industryLinks.find(link=>link.slug === item.slug);
      if (!base || seen.has(base.slug)) return [];
      seen.add(base.slug);
      return [{slug:base.slug,title:text(item.title,base.title,80),summary:text(item.summary,base.summary,160)}];
    }) : fallback.navigation.items;
    result.navigation = {title:text(navigation.title,fallback.navigation.title,100),summary:text(navigation.summary,fallback.navigation.summary),items:Array.isArray(navigation.items)&&navigation.items.length&&!items.length?fallback.navigation.items:items};
  }
  return result;
}
