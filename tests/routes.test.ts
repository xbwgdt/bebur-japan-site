import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  contentType as iconContentType,
  dynamic as iconDynamic,
  size as iconSize,
} from "../app/icon";
import RootLayout, {
  metadata as globalMetadata,
  organizationJsonLd,
} from "../app/layout";
import {
  alt as openGraphAlt,
  contentType as openGraphContentType,
  default as OpenGraphImage,
  dynamic as openGraphDynamic,
  openGraphBackgroundPath,
  openGraphImageText,
  size as openGraphSize,
} from "../app/opengraph-image";
import robots, { dynamic as robotsDynamic } from "../app/robots";
import sitemap, { dynamic as sitemapDynamic } from "../app/sitemap";
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
import { siteConfig } from "../lib/constants";
import { auditSeoOutputs } from "../lib/seo-output-audit";
import {
  canonicalUrl,
  productCategoryLabels,
  productRoute,
} from "../lib/routes";

const execFileAsync = promisify(execFile);

type SanityImportDocument = {
  _id: string;
  _type: string;
  coverImage?: {
    _type?: string;
    _sanityAsset?: string;
    alt?: string;
  };
  defaultOgImage?: {
    _type?: string;
    _sanityAsset?: string;
    alt?: string;
  };
};

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

  it("preserves 110 canonical routes across the 112 approved rendered source pages", async () => {
    const sourceManifest = JSON.parse(
      await readFile(
        join(process.cwd(), "content", "source", "source-manifest.json"),
        "utf8",
      ),
    ) as unknown[];

    expect(getAllRoutes()).toHaveLength(110);
    expect(sourceManifest).toHaveLength(112);
  });

  it("exports a stable import with every product, insight, and site setting", async () => {
    const script = join(process.cwd(), "scripts", "export-sanity-import.mjs");
    const destination = join(
      process.cwd(),
      "sanity",
      "import",
      "initial.ndjson",
    );

    await execFileAsync(process.execPath, [script]);
    const firstOutput = await readFile(destination, "utf8");
    await execFileAsync(process.execPath, [script]);
    const secondOutput = await readFile(destination, "utf8");
    const documents = firstOutput
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as SanityImportDocument);

    expect(secondOutput).toBe(firstOutput);
    expect(documents).toHaveLength(63);
    expect(documents.filter(({ _type }) => _type === "product")).toHaveLength(
      45,
    );
    expect(documents.filter(({ _type }) => _type === "news")).toHaveLength(17);
    for (const document of documents.filter(
      ({ _type }) => _type === "product" || _type === "news",
    )) {
      expect(document.coverImage).toMatchObject({
        _type: "image",
        _sanityAsset: expect.stringMatching(/^image@file:\/\//),
      });
      expect(document.coverImage?.alt).toMatch(
        /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
      );
    }
    expect(documents.filter(({ _type }) => _type === "siteSettings")).toMatchObject([
      {
        _id: "siteSettings",
        _type: "siteSettings",
        companyName: "新樹産業株式会社",
        postalCode: "340-0043",
        address: "埼玉県草加市草加2－13－21－7",
        phone: "080-5189-8663",
        inquiryEmail: "info@newtree-i.com",
        defaultOgImage: {
          _type: "image",
          _sanityAsset: expect.stringMatching(/^image@file:\/\//),
        },
      },
    ]);
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

describe("production SEO metadata routes", () => {
  it("publishes every canonical content route exactly once in the sitemap", () => {
    const entries = sitemap();
    const urls = entries.map(({ url }) => url);
    const expectedUrls = getAllRoutes().map(canonicalUrl);

    expect(entries).toHaveLength(110);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.toSorted()).toEqual(expectedUrls.toSorted());
    expect(
      urls.every((url) => url.startsWith("https://www.bebur-jp.com/")),
    ).toBe(true);
  });

  it("allows public crawling and references the exact canonical sitemap", () => {
    const policy = robots();
    const rules = Array.isArray(policy.rules)
      ? policy.rules
      : [policy.rules];

    expect(rules).toEqual([{ userAgent: "*", allow: "/" }]);
    expect(rules.every((rule) => !("disallow" in rule))).toBe(true);
    expect(policy.sitemap).toBe(
      "https://www.bebur-jp.com/sitemap.xml",
    );
    expect(robotsDynamic).toBe("force-static");
    expect(sitemapDynamic).toBe("force-static");
  });

  it("rejects broken live sitemap and robots output in the release audit", () => {
    const validInput = {
      canonicalOrigin: siteConfig.origin,
      canonicalRoutes: getAllRoutes(),
      sitemapEntries: sitemap(),
      robotsPolicy: robots(),
      siteConfig,
      organizationJsonLd,
    };

    expect(auditSeoOutputs(validInput)).toEqual([]);
    expect(
      auditSeoOutputs({
        ...validInput,
        sitemapEntries: [],
        robotsPolicy: {
          rules: { userAgent: "*", disallow: "/" },
          sitemap: "https://wrong.example/sitemap.xml",
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("sitemap route coverage"),
        expect.stringContaining("robots rules"),
        expect.stringContaining("robots sitemap"),
      ]),
    );
    expect(
      auditSeoOutputs({
        ...validInput,
        siteConfig: {
          ...siteConfig,
          email: "sales@example.invalid",
        },
        organizationJsonLd: {
          ...organizationJsonLd,
          alternateName: "Global manufacturer",
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("site config email"),
        expect.stringContaining("organization JSON-LD"),
      ]),
    );
  });

  it("uses the approved origin and complete Japanese share metadata", () => {
    expect(globalMetadata.metadataBase?.toString()).toBe(
      "https://www.bebur-jp.com/",
    );
    expect(globalMetadata.title).toEqual({
      default: "Bebur Japan｜水質分析・ガス検知の精密計測",
      template: "%s｜Bebur Japan",
    });
    expect(globalMetadata.openGraph).toMatchObject({
      title: "Bebur Japan｜水質分析・ガス検知の精密計測",
      description:
        "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
      locale: "ja_JP",
      siteName: "Bebur Japan",
      type: "website",
      url: "https://www.bebur-jp.com",
    });
    expect(globalMetadata.openGraph?.images).toEqual([
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
      },
    ]);
    expect(globalMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Bebur Japan｜水質分析・ガス検知の精密計測",
      description:
        "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
    });
    expect(globalMetadata.twitter?.images).toEqual([
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
      },
    ]);
  });

  it("identifies New Tree Industries only as the Japanese exclusive distributor", () => {
    expect(organizationJsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "新樹産業株式会社",
      alternateName: "Bebur 日本総代理店",
      description: "Bebur 日本総代理店",
      url: "https://www.bebur-jp.com",
      email: "info@newtree-i.com",
      telephone: "080-5189-8663",
      address: {
        "@type": "PostalAddress",
        postalCode: "340-0043",
        addressRegion: "埼玉県",
        addressLocality: "草加市",
        streetAddress: "草加2－13－21－7",
        addressCountry: "JP",
      },
    });
    expect(organizationJsonLd.name).toBe(siteConfig.company);
    expect(JSON.stringify(organizationJsonLd)).not.toMatch(
      /manufacturer|headquarters|global manufacturer|製造元|世界本社/i,
    );

    const layout = RootLayout({ children: "fixture" });
    const body = layout.props.children;
    const children = Array.isArray(body.props.children)
      ? body.props.children
      : [body.props.children];
    const jsonLdScript = children.find(
      (child) => child?.type === "script",
    );

    expect(jsonLdScript?.props.type).toBe("application/ld+json");
    expect(jsonLdScript?.props.dangerouslySetInnerHTML).toEqual({
      __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
    });
  });

  it("exports deterministic branded social and icon image metadata", () => {
    expect(openGraphSize).toEqual({ width: 1200, height: 630 });
    expect(openGraphContentType).toBe("image/png");
    expect(openGraphAlt).toBe(
      "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
    );
    expect(openGraphImageText).toEqual({
      brand: "Bebur Japan",
      message: "水質分析・ガス検知の精密ソリューション",
      distributor: "日本総代理店 新樹産業株式会社",
    });

    expect(iconSize).toEqual({ width: 64, height: 64 });
    expect(iconContentType).toBe("image/png");
    expect(iconDynamic).toBe("force-static");
    expect(openGraphDynamic).toBe("force-static");
  });

  it(
    "renders the committed background through a real PNG ImageResponse",
    async () => {
      expect(openGraphBackgroundPath).toEqual([
        "public",
        "media",
        "brand",
        "bebur-og-background.png",
      ]);

      const background = await readFile(
        join(process.cwd(), ...openGraphBackgroundPath),
      );
      expect([...background.subarray(0, 8)]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(background.byteLength).toBeGreaterThan(1_000_000);

      const response = await OpenGraphImage();
      const rendered = new Uint8Array(await response.arrayBuffer());

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect([...rendered.subarray(0, 8)]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(rendered.byteLength).toBeGreaterThan(500_000);
      expect(rendered.byteLength).not.toBe(background.byteLength);
    },
    120_000,
  );
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
