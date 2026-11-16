import defaults from "../content/ja/page-enhancements.json";

export type CategoryHero = typeof defaults.dosing;
export type ApplicationProductSelection = typeof defaults["chemical-industry"];
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
function text(value: unknown, fallback: string, max = 300): string {
  return typeof value === "string" && value.trim() && value.length <= max && !/[<>\u0000-\u001f\u007f]/u.test(value) ? value.trim() : fallback;
}
function preset(value: unknown, allowed: string[], fallback: string): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

/** Dedicated fields only; legacy generic page blocks never replace a route's layout. */
export function resolveCategoryHero(category: string, value?: unknown): CategoryHero | undefined {
  if (category !== "dosing") return;
  const fallback = structuredClone(defaults.dosing), input = object(value);
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
  if (slug !== "chemical-industry") return;
  const fallback = structuredClone(defaults["chemical-industry"]), input = object(value);
  const groups = Array.isArray(input.groups) ? input.groups.slice(0, 5).flatMap(value => {
    const group = object(value);
    if (group.category !== "gas-detection" && group.category !== "water-quality") return [];
    const base = fallback.groups.find(item => item.category === group.category)!;
    if (!Array.isArray(group.productSlugs)) return [];
    const productSlugs = [...new Set(group.productSlugs.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) && (!catalog || catalog.some(product => product.slug === slug && product.category === group.category))))].slice(0, 12);
    if (!productSlugs.length) return [];
    return [{ category: group.category, title: text(group.title, base.title, 100), summary: text(group.summary, base.summary), moreLabel: text(group.moreLabel, base.moreLabel, 60), productSlugs }];
  }) : fallback.groups;
  return { title: text(input.title, fallback.title, 100), summary: text(input.summary, fallback.summary), groups: Array.isArray(input.groups) && input.groups.length && !groups.length ? fallback.groups : groups };
}
