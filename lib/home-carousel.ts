import defaults from "../content/ja/home-carousel.json";

export const carouselPresets = {
  color: ["deepBlue", "light", "paleBlue"],
  fontFamily: ["sans", "serif", "mono"],
  fontSize: ["sm", "md", "lg", "xl"],
  alignment: ["left", "center", "right"],
} as const;
export type HomeCarouselStyle = { [K in keyof typeof carouselPresets]: (typeof carouselPresets)[K][number] };
export type HomeCarouselSlide = {
  _key: string; eyebrow: string; title: string; summary: string;
  image: { src: string; alt: string };
  primaryAction: { label: string; href: string };
  style: HomeCarouselStyle;
};
export type HomeCarouselSettings = { enabled: boolean; autoPlay: boolean; intervalSeconds: number; slides: HomeCarouselSlide[] };
export type SanityHomeCarousel = {
  enabled?: boolean; autoPlay?: boolean; intervalSeconds?: number;
  slides?: Array<{
    _key?: string; eyebrow?: string; title?: string; summary?: string;
    image?: { asset?: { _ref?: string; url?: string }; alt?: string };
    primaryAction?: { label?: string; href?: string };
    style?: { color?: string; fontFamily?: string; fontSize?: string; alignment?: string };
  }>;
};
export const localHomeCarousel = defaults as HomeCarouselSettings;

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\r\n?|\n/gu, " ");
  return trimmed.length > 0 && trimmed.length <= max && !/[\u0000-\u001f\u007f<>]/u.test(trimmed) ? trimmed : undefined;
}

/** Only absolute site paths and credential-free HTTPS URLs, never protocol-relative paths. */
export function isSafeCarouselUrl(value: unknown): value is string {
  if (typeof value !== "string" || value !== value.trim() || !value || value.length > 2_048 || /[\\\s<>\u0000-\u001f\u007f]/u.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return value.startsWith("https://") && url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function preset<K extends keyof HomeCarouselStyle>(key: K, value: unknown, fallback: HomeCarouselStyle[K]): HomeCarouselStyle[K] {
  return typeof value === "string" && (carouselPresets[key] as readonly string[]).includes(value) ? value as HomeCarouselStyle[K] : fallback;
}

export function resolveHomeCarousel(value: SanityHomeCarousel | null | undefined): HomeCarouselSettings {
  if (value === undefined || value === null) return localHomeCarousel;
  const seenKeys = new Set<string>();
  const slides = !Array.isArray(value.slides) ? localHomeCarousel.slides : value.slides.slice(0, 20).flatMap((slide, index): HomeCarouselSlide[] => {
    if (!slide || typeof slide !== "object") return [];
    const title = text(slide.title, 100), eyebrow = text(slide.eyebrow, 60), summary = text(slide.summary, 300);
    const src = slide.image?.asset?.url, alt = text(slide.image?.alt, 160);
    const label = text(slide.primaryAction?.label, 40), href = slide.primaryAction?.href;
    if (!title || !eyebrow || !summary || !alt || !label || !isSafeCarouselUrl(src) || !isSafeCarouselUrl(href)) return [];
    let key = text(slide._key, 80);
    if (!key || !/^[a-zA-Z0-9_-]+$/u.test(key) || seenKeys.has(key)) key = `cms-slide-${index}`;
    while (seenKeys.has(key)) key += "-slide";
    seenKeys.add(key);
    return [{ _key: key, title, eyebrow, summary, image: { src, alt }, primaryAction: { label, href }, style: {
      color: preset("color", slide.style?.color, "deepBlue"),
      fontFamily: preset("fontFamily", slide.style?.fontFamily, "sans"),
      fontSize: preset("fontSize", slide.style?.fontSize, "md"),
      alignment: preset("alignment", slide.style?.alignment, "left"),
    } }];
  });
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
    autoPlay: typeof value.autoPlay === "boolean" ? value.autoPlay : true,
    intervalSeconds: typeof value.intervalSeconds === "number" && Number.isFinite(value.intervalSeconds) ? Math.min(20, Math.max(5, value.intervalSeconds)) : 8,
    slides,
  };
}
