import defaults from "@/content/ja/liquid-cooling-design.json";
import type { CSSProperties } from "react";

export type LiquidCoolingDesign = Omit<typeof defaults, "metadata"> & { metadata: Array<{ _key: string; _type: string; label: string; value: string }> };
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function mergeKnown(base: unknown, value: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(value) ? value.slice(0, 40).map(item => mergeKnown(base[0], item)) : structuredClone(base);
  if (base && typeof base === "object") return Object.fromEntries(Object.entries(base).map(([key, original]) => [key, mergeKnown(original, record(value)[key])]));
  return typeof value === typeof base ? value : base;
}

export function resolveLiquidCoolingDesign(value?: unknown): LiquidCoolingDesign {
  const resolved = mergeKnown(defaults, value) as LiquidCoolingDesign;
  const metadata = record(value).metadata;
  resolved.metadata = Array.isArray(metadata) ? metadata.slice(0, 40).map(item => mergeKnown({ _key: "", _type: "solutionMeta", label: "", value: "" }, item)) as LiquidCoolingDesign["metadata"] : structuredClone(defaults.metadata);
  for (const key of Object.keys(defaults.theme) as Array<keyof LiquidCoolingDesign["theme"]>) {
    if (!/^#[0-9a-f]{6}$/i.test(resolved.theme[key])) resolved.theme[key] = defaults.theme[key];
  }
  resolved.fontSize = Number.isFinite(resolved.fontSize) ? Math.max(14, Math.min(20, resolved.fontSize)) : 16;
  resolved.fontFamily = resolved.fontFamily === "serif" ? "serif" : "sans";
  resolved.diagram.speed = Number.isFinite(resolved.diagram.speed) ? Math.max(4, Math.min(60, resolved.diagram.speed)) : 14;
  resolved.diagram.mode = resolved.diagram.mode === "image" ? "image" : "animation";
  resolved.navigation = resolved.navigation.filter(item => /^[a-z][a-z0-9-]*$/.test(item.anchor));
  resolved.heroActions = resolved.heroActions.filter(item => /^[a-z][a-z0-9-]*$/.test(item.anchor));
  if (!/^(?:\/(?!\/)|https:\/\/)/.test(resolved.diagram.image.asset.url)) resolved.diagram.image.asset.url = "";
  return resolved;
}

export function liquidCoolingStyle(design: LiquidCoolingDesign): CSSProperties {
  const names = {ink:"ink",ink2:"ink-2",paper:"paper",paperHi:"paper-hi",paperTint:"paper-tint",line:"line",lineSoft:"line-soft",accent:"teal",accentBright:"teal-hi",warning:"amber",muted:"steel",body:"body",heroText:"hero-text",heroMuted:"hero-muted",diagramLine:"diagram-line"};
  return { ...Object.fromEntries(Object.entries(names).map(([key, token]) => [`--${token}`, design.theme[key as keyof typeof names]])), "--flow-duration": `${design.diagram.speed}s`, "--editorial-size": `${design.fontSize}px`, "--editorial-font": design.fontFamily === "serif" ? '"Noto Serif JP", "Yu Mincho", serif' : '"Noto Sans JP", "Yu Gothic", Meiryo, sans-serif' } as CSSProperties;
}
