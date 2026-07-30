import { describe, expect, it } from "vitest";

import { buildInsightMetadata } from "@/app/insights/[slug]/page";
import { buildProductMetadata } from "@/app/products/[category]/[slug]/page";
import { getArticle, getProduct } from "@/lib/content";

describe("Sanity document SEO metadata", () => {
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
});
