import { describe, expect, it } from "vitest";

import { buildInsightMetadata } from "@/app/insights/[slug]/page";
import { buildProductMetadata } from "@/app/products/[category]/[slug]/page";
import { getArticle, getProduct } from "@/lib/content";
import {
  defaultSocialImage,
  normalizePageTitle,
  socialTitle,
} from "@/lib/metadata";

describe("Sanity document SEO metadata", () => {
  it("normalizes repeated site suffixes and supplies the approved share image", () => {
    expect(normalizePageTitle("BT8500｜Bebur Japan")).toBe("BT8500");
    expect(
      normalizePageTitle("BT8500｜Bebur Japan｜Bebur Japan"),
    ).toBe("BT8500");
    expect(socialTitle("BT8500｜Bebur Japan")).toBe(
      "BT8500｜Bebur Japan",
    );
    expect(defaultSocialImage()).toEqual({
      url: "/opengraph-image",
      alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
    });
  });

  it("prefers approved product SEO fields and falls back to local copy", () => {
    const product = getProduct("cleanliness", "bt8500");
    expect(product).toBeDefined();

    const cmsMetadata = buildProductMetadata({
      ...product!,
      seoTitle: "CMS 製品 SEO タイトル",
      seoDescription: "CMSで承認された製品ページの説明です。",
    });
    expect(cmsMetadata.title).toBe("CMS 製品 SEO タイトル");
    expect(cmsMetadata.description).toBe(
      "CMSで承認された製品ページの説明です。",
    );

    const fallbackMetadata = buildProductMetadata(product!);
    expect(fallbackMetadata.title).toBe(product!.title);
    expect(fallbackMetadata.description).toBe(product!.description);
  });

  it("keeps one product brand suffix and supplies a fallback share image", () => {
    const product = getProduct("cleanliness", "bt8500");
    expect(product).toBeDefined();

    const metadata = buildProductMetadata({
      ...product!,
      images: [],
      seoTitle: `${product!.title}｜Bebur Japan｜Bebur Japan`,
    });

    expect(metadata.title).toBe(product!.title);
    expect(metadata.openGraph?.title).toBe(
      `${product!.title}｜Bebur Japan`,
    );
    expect(metadata.openGraph?.images).toEqual([defaultSocialImage()]);
  });

  it("prefers approved news SEO fields and falls back to local copy", () => {
    const article = getArticle("ozone-monitoring-equipment");
    expect(article).toBeDefined();

    const cmsMetadata = buildInsightMetadata({
      ...article!,
      seoTitle: "CMS ニュース SEO タイトル",
      seoDescription: "CMSで承認された技術ニュースの説明です。",
    });
    expect(cmsMetadata.title).toBe("CMS ニュース SEO タイトル");
    expect(cmsMetadata.description).toBe(
      "CMSで承認された技術ニュースの説明です。",
    );

    const fallbackMetadata = buildInsightMetadata(article!);
    expect(fallbackMetadata.title).toBe(article!.title);
    expect(fallbackMetadata.description).toBe(article!.description);
  });

  it("keeps one news brand suffix and supplies a fallback share image", () => {
    const article = getArticle("ozone-monitoring-equipment");
    expect(article).toBeDefined();

    const metadata = buildInsightMetadata({
      ...article!,
      images: [],
      seoTitle: `${article!.title}｜Bebur Japan`,
    });

    expect(metadata.title).toBe(article!.title);
    expect(metadata.openGraph?.title).toBe(
      `${article!.title}｜Bebur Japan`,
    );
    expect(metadata.openGraph?.images).toEqual([defaultSocialImage()]);
  });
});
