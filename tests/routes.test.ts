import { describe, expect, it } from "vitest";

import {
  generateMetadata as generateAboutMetadata,
  generateStaticParams as generateAboutStaticParams,
  resolveAboutPageForRoute,
} from "../app/about/[slug]/page";
import {
  generateMetadata as generateApplicationMetadata,
  generateStaticParams as generateApplicationStaticParams,
  resolveApplicationForRoute,
} from "../app/applications/[slug]/page";
import {
  generateMetadata as generateInsightMetadata,
  generateStaticParams as generateInsightStaticParams,
  resolveArticleForRoute,
} from "../app/insights/[slug]/page";
import {
  generateStaticParams as generateCategoryStaticParams,
  resolveProductCategory,
} from "../app/products/[category]/page";
import {
  generateMetadata as generateProductMetadata,
  generateStaticParams as generateProductStaticParams,
  resolveProductForRoute,
} from "../app/products/[category]/[slug]/page";
import {
  getAboutPage,
  getAboutPages,
  getAllRoutes,
  getApplication,
  getApplications,
  getArticle,
  getArticles,
  getProduct,
  getProducts,
  getStaticPages,
} from "../lib/content";
import {
  canonicalUrl,
  productCategoryLabels,
  productRoute,
} from "../lib/routes";

describe("route test environment", () => {
  it("runs without browser globals", () => {
    expect(typeof document).toBe("undefined");
  });
});

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

describe("product discovery route generation", () => {
  const expectedCategories = [
    "cleanliness",
    "dosing",
    "water-quality",
    "gas-detection",
    "flow-level",
  ];

  it("generates exactly the five reviewed category routes", () => {
    expect(generateCategoryStaticParams()).toEqual(
      expectedCategories.map((category) => ({ category })),
    );
  });

  it("generates exactly 45 unique reviewed product routes", () => {
    const params = generateProductStaticParams();
    const pairs = params.map(({ category, slug }) => `${category}/${slug}`);

    expect(params).toHaveLength(45);
    expect(new Set(pairs).size).toBe(45);
  });

  it("keeps every reviewed product route aligned with productRoute", () => {
    for (const product of getProducts()) {
      expect(product.route).toBe(productRoute(product));
    }
  });

  it("generates canonical metadata on the approved product origin", async () => {
    const metadata = await Promise.all(
      generateProductStaticParams().map((params) =>
        generateProductMetadata({ params: Promise.resolve(params) }),
      ),
    );

    for (const entry of metadata) {
      expect(String(entry.alternates?.canonical)).toMatch(
        /^https:\/\/www\.bebur-jp\.com\/products\//,
      );
    }
  });

  it("rejects unknown category and category/slug pairs through route helpers", () => {
    expect(resolveProductCategory("unknown")).toBeUndefined();
    expect(resolveProductForRoute("unknown", "bt8500")).toBeUndefined();
    expect(
      resolveProductForRoute("water-quality", "bt8500"),
    ).toBeUndefined();
    expect(resolveProductForRoute("cleanliness", "unknown")).toBeUndefined();
  });
});

describe("remaining Japanese content route generation", () => {
  it("generates exactly 31 unique application slugs", () => {
    const params = generateApplicationStaticParams();
    const slugs = params.map(({ slug }) => slug);

    expect(params).toHaveLength(31);
    expect(new Set(slugs).size).toBe(31);
    expect(slugs).toEqual(
      getApplications()
        .map(({ slug }) => slug)
        .toSorted(),
    );
  });

  it("generates exactly 6 unique company slugs", () => {
    const params = generateAboutStaticParams();
    const slugs = params.map(({ slug }) => slug);

    expect(params).toHaveLength(6);
    expect(new Set(slugs).size).toBe(6);
    expect(slugs).toEqual(
      getAboutPages()
        .map(({ slug }) => slug)
        .toSorted(),
    );
  });

  it("generates exactly 17 unique insight slugs", () => {
    const params = generateInsightStaticParams();
    const slugs = params.map(({ slug }) => slug);

    expect(params).toHaveLength(17);
    expect(new Set(slugs).size).toBe(17);
    expect(slugs).toEqual(
      getArticles()
        .map(({ slug }) => slug)
        .toSorted(),
    );
  });

  it("maps every canonical route to one implemented App Router family", () => {
    const implementedRoutes = new Set([
      "/",
      "/products",
      "/applications",
      "/applications/cases",
      "/insights",
      "/contact",
      ...generateCategoryStaticParams().map(
        ({ category }) => `/products/${category}`,
      ),
      ...generateProductStaticParams().map(
        ({ category, slug }) => `/products/${category}/${slug}`,
      ),
      ...generateApplicationStaticParams().map(
        ({ slug }) => `/applications/${slug}`,
      ),
      ...generateAboutStaticParams().map(({ slug }) => `/about/${slug}`),
      ...generateInsightStaticParams().map(
        ({ slug }) => `/insights/${slug}`,
      ),
    ]);

    expect(implementedRoutes.size).toBe(110);
    expect([...implementedRoutes].toSorted()).toEqual(getAllRoutes());
  });

  it("rejects unknown application, company, and insight slugs", () => {
    expect(resolveApplicationForRoute("unknown")).toBeUndefined();
    expect(resolveAboutPageForRoute("unknown")).toBeUndefined();
    expect(resolveArticleForRoute("unknown")).toBeUndefined();
  });

  it("uses the approved canonical origin for representative metadata", async () => {
    const [application, about, insight] = await Promise.all([
      generateApplicationMetadata({
        params: Promise.resolve({ slug: "liquid-cooling-industry" }),
      }),
      generateAboutMetadata({
        params: Promise.resolve({ slug: "company-profile" }),
      }),
      generateInsightMetadata({
        params: Promise.resolve({ slug: "ozone-monitoring-equipment" }),
      }),
    ]);

    expect(String(application.alternates?.canonical)).toBe(
      "https://www.bebur-jp.com/applications/liquid-cooling-industry",
    );
    expect(String(about.alternates?.canonical)).toBe(
      "https://www.bebur-jp.com/about/company-profile",
    );
    expect(String(insight.alternates?.canonical)).toBe(
      "https://www.bebur-jp.com/insights/ozone-monitoring-equipment",
    );
  });
});
