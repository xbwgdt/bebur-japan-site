import { describe, expect, it } from "vitest";

import {
  getAboutPage,
  getAllRoutes,
  getApplication,
  getArticle,
  getProduct,
  getStaticPages,
} from "../lib/content";
import {
  canonicalUrl,
  productCategoryLabels,
  productRoute,
} from "../lib/routes";

describe("Japanese content lookups", () => {
  it("finds expected fixtures and returns undefined for unknown slugs", () => {
    expect(getProduct("cleanliness", "bt8500")?.model).toBe("BT8500");
    expect(getApplication("electric-power-industry")?.kind).toBe("application");
    expect(getArticle("ozone-monitoring-equipment")?.kind).toBe("article");
    expect(getAboutPage("company-profile")?.kind).toBe("about");

    expect(getProduct("cleanliness", "unknown")).toBeUndefined();
    expect(getApplication("unknown")).toBeUndefined();
    expect(getArticle("unknown")).toBeUndefined();
    expect(getAboutPage("unknown")).toBeUndefined();
  });

  it("returns only unique absolute-path canonical routes", () => {
    const routes = getAllRoutes();

    expect(new Set(routes).size).toBe(routes.length);
    for (const route of routes) {
      expect(route).toMatch(/^\//);
      expect(route).not.toMatch(/^\/\//);
      expect(route).not.toContain("?");
    }
    expect(getStaticPages().some(({ route }) => route === "/")).toBe(true);
    expect(getStaticPages().some(({ route }) => route === "/contact")).toBe(
      true,
    );
  });
});

describe("route helpers", () => {
  it("builds product routes from category and slug", () => {
    expect(productRoute({ category: "cleanliness", slug: "bt8500" })).toBe(
      "/products/cleanliness/bt8500",
    );

    for (const category of Object.keys(productCategoryLabels)) {
      const route = productRoute({
        category: category as keyof typeof productCategoryLabels,
        slug: "fixture",
      });
      expect(route).toBe(`/products/${category}/fixture`);
    }
  });

  it("builds canonical URLs on the approved origin", () => {
    expect(canonicalUrl("/")).toBe("https://www.bebur-jp.com/");
    expect(canonicalUrl("/contact")).toBe(
      "https://www.bebur-jp.com/contact",
    );
    expect(canonicalUrl("contact")).toBe(
      "https://www.bebur-jp.com/contact",
    );
    expect(canonicalUrl("//example.com")).toBe(
      "https://www.bebur-jp.com/example.com",
    );
  });

  it("uses the exact approved Japanese product category labels", () => {
    expect(productCategoryLabels).toEqual({
      cleanliness: "清浄度測定装置",
      dosing: "薬注制御装置",
      "water-quality": "水質分析計",
      "gas-detection": "ガス検知器",
      "flow-level": "流量計・液位計",
    });
  });
});
