import type { Product, ProductCategory } from "./types";

const CANONICAL_ORIGIN = "https://www.bebur-jp.com";

export const productCategoryLabels: Record<ProductCategory, string> = {
  cleanliness: "清浄度測定装置",
  dosing: "薬注制御装置",
  "water-quality": "水質分析計",
  "gas-detection": "ガス検知器",
  "flow-level": "流量計・液位計",
};

export function productRoute(
  product: Pick<Product, "category" | "slug">,
): string {
  return `/products/${product.category}/${product.slug}`;
}

export function canonicalUrl(route: string): string {
  const absolutePath = `/${route.replace(/^\/+/, "")}`;
  return new URL(absolutePath, `${CANONICAL_ORIGIN}/`).toString();
}
