import defaults from "../content/ja/home-industries.json";

export type HomeIndustrySlide = { _key: string; title: string; href: string; image: { src: string; alt: string } };
export type HomeIndustrySettings = { enabled: boolean; title: string; summary: string; autoPlay: boolean; intervalSeconds: number; fontFamily: "sans" | "serif"; fontSize: "sm" | "md" | "lg"; slides: HomeIndustrySlide[] };
export const localHomeIndustries = defaults as HomeIndustrySettings;
export const homeIndustryTargets = defaults.slides.map(({href,title}) => ({href,title}));
export const isHomeIndustryRoute = (value: unknown): value is string => typeof value === "string" && homeIndustryTargets.some(item => item.href === value);
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max: number): string | undefined => typeof value === "string" && value.trim() && value.length <= max && !/[<>\u0000-\u001f\u007f]/u.test(value) ? value.trim() : undefined;

function image(value: unknown, fallback: HomeIndustrySlide["image"]): HomeIndustrySlide["image"] {
  const input = object(value), asset = object(input.asset), alt = text(input.alt,160);
  if (typeof asset.url === "string" && asset.url.length <= 2048 && !/[\s\\<>"'()]/u.test(asset.url) && alt) {
    try {
      const url = new URL(asset.url);
      if (url.protocol === "https:" && url.hostname === "cdn.sanity.io" && !url.port && !url.username && !url.password && url.pathname.startsWith("/images/gbzt89e5/production/")) return {src:url.href,alt};
    } catch { /* Use the original photo and its matching description. */ }
  }
  return {...fallback};
}

/** A dedicated homepage slot; it never replaces application-page content. */
export function resolveHomeIndustries(value?: unknown): HomeIndustrySettings {
  const input = object(value), result = structuredClone(localHomeIndustries);
  result.enabled = typeof input.enabled === "boolean" ? input.enabled : result.enabled;
  result.autoPlay = typeof input.autoPlay === "boolean" ? input.autoPlay : result.autoPlay;
  result.title = text(input.title,100) ?? result.title;
  result.summary = text(typeof input.summary === "string" ? input.summary.replace(/\r\n?|\n/gu," ") : input.summary,300) ?? result.summary;
  result.intervalSeconds = typeof input.intervalSeconds === "number" && Number.isFinite(input.intervalSeconds) && input.intervalSeconds >= 5 && input.intervalSeconds <= 20 ? input.intervalSeconds : result.intervalSeconds;
  result.fontFamily = input.fontFamily === "serif" ? "serif" : "sans";
  result.fontSize = input.fontSize === "sm" || input.fontSize === "lg" ? input.fontSize : "md";
  if (Array.isArray(input.slides)) {
    const keys = new Set<string>(), routes = new Set<string>();
    const slides = input.slides.slice(0,20).flatMap(value => {
      const slide = object(value);
      if (!isHomeIndustryRoute(slide.href)) return [];
      const fallback = defaults.slides.find(item => item.href === slide.href)!;
      const key = text(slide._key,80);
      if (!key || !/^[a-zA-Z0-9_-]+$/u.test(key) || keys.has(key) || routes.has(slide.href)) return [];
      keys.add(key); routes.add(slide.href);
      return [{_key:key,title:text(slide.title,80) ?? fallback.title,href:slide.href,image:image(slide.image,fallback.image)}];
    });
    result.slides = input.slides.length && !slides.length ? result.slides : slides;
  }
  return result;
}
