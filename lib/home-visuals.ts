import type { CSSProperties } from "react";
import defaults from "../content/ja/home-visuals.json";

export type VisualImage = { src: string; alt: string };
export type HomeBackdrop = { image: VisualImage; overlayColor: string; overlayOpacity: number };
export type HomeVisuals = {
  about: HomeBackdrop; technology: HomeBackdrop; applications: HomeBackdrop; contact: HomeBackdrop;
  companyImage: VisualImage;
  categoryImages: Record<keyof typeof defaults.categoryImages, VisualImage>;
  strengthImages: Record<keyof typeof defaults.strengthImages, VisualImage>;
};
export const localHomeVisuals: HomeVisuals = defaults;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function resolveImage(value: unknown, fallback: VisualImage): VisualImage {
  const input = object(value), asset = object(input.asset);
  let src = fallback.src;
  if (typeof asset.url === "string" && asset.url.length <= 2048 && !/[\s\\<>"'()]/u.test(asset.url)) {
    try {
      const url = new URL(asset.url);
      if (url.protocol === "https:" && url.hostname === "cdn.sanity.io" && !url.port && !url.username && !url.password && url.pathname.startsWith("/images/gbzt89e5/production/")) src = url.href;
    } catch { /* Keep reviewed local image. */ }
  }
  const alt = typeof input.alt === "string" && input.alt.trim() && input.alt.length <= 160 && !/[<>\u0000-\u001f\u007f]/u.test(input.alt) ? input.alt.trim() : undefined;
  return src !== fallback.src && alt ? { src, alt } : { ...fallback };
}

export function resolveHomeVisuals(value?: unknown): HomeVisuals {
  const input = object(value), result = structuredClone(localHomeVisuals);
  for (const key of ["about", "technology", "applications", "contact"] as const) {
    const field = object(input[key]), fallback = result[key];
    result[key] = {
      image: resolveImage(field.image, fallback.image),
      overlayColor: typeof field.overlayColor === "string" && /^#[0-9a-f]{6}$/iu.test(field.overlayColor) ? field.overlayColor : fallback.overlayColor,
      overlayOpacity: typeof field.overlayOpacity === "number" && Number.isFinite(field.overlayOpacity) && field.overlayOpacity >= 0 && field.overlayOpacity <= 0.85 ? field.overlayOpacity : fallback.overlayOpacity,
    };
  }
  result.companyImage = resolveImage(input.companyImage, result.companyImage);
  for (const group of ["categoryImages", "strengthImages"] as const) {
    const images = object(input[group]);
    for (const key of Object.keys(result[group])) {
      const target = result[group] as Record<string, VisualImage>;
      target[key] = resolveImage(images[key], target[key]);
    }
  }
  return result;
}

/** Only resolved local defaults or project-owned Sanity images reach CSS. */
export function homeBackdropStyle(backdrop: HomeBackdrop): CSSProperties {
  const hex = backdrop.overlayColor.slice(1);
  const rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  return {
    "--section-background-image": `url("${backdrop.image.src}")`,
    "--section-overlay": `rgba(${rgb.join(",")},${backdrop.overlayOpacity})`,
  } as CSSProperties;
}
