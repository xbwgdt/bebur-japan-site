import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ContentSections } from "@/components/content-sections";
import { ProductCard } from "@/components/product-card";
import { SourceCardGrid } from "@/components/source-faithful/source-card-grid";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { getArticle, getArticles, getProducts } from "@/lib/content";
import { canonicalUrl, insightRoute } from "@/lib/routes";
import type { Article, Product } from "@/lib/types";

type InsightRouteParams = {
  slug: string;
};

const japaneseDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatJapaneseDate(date: string): string {
  return japaneseDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function resolveArticleForRoute(slug: string): Article | undefined {
  return getArticle(slug);
}

export function resolveRelatedProducts(slugs: string[]): Product[] {
  const products = getProducts();

  return slugs.flatMap((slug) => {
    const product = products.find((candidate) => candidate.slug === slug);
    return product ? [product] : [];
  });
}

export function generateStaticParams(): Array<{ slug: string }> {
  return getArticles()
    .map(({ slug }) => ({ slug }))
    .toSorted((left, right) => left.slug.localeCompare(right.slug));
}

export function buildInsightMetadata(article: Article): Metadata {
  const canonical = canonicalUrl(insightRoute(article.slug));
  const image = article.images[0];
  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.description;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: article.publishedAt,
      images: image
        ? [{ url: resolveSourceMediaPath(image.src), alt: image.alt }]
        : undefined,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<InsightRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = resolveArticleForRoute(slug);

  if (!article) {
    notFound();
  }

  return buildInsightMetadata(article);
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<InsightRouteParams>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const article = resolveArticleForRoute(slug);

  if (!article) {
    notFound();
  }

  const relatedProducts = resolveRelatedProducts(
    article.relatedProductSlugs,
  );

  return (
    <SourceShell>
      <article className="content-detail insight-detail">
        <SourceHero
          eyebrow="INSIGHT"
          image="/source-media/1762133644310526-d4cf5bd0feadf444.jpg"
          summary={article.description}
          title={article.title}
        />

        <div className="source-breadcrumb-band">
          <div className="site-container">
            <Breadcrumbs
              items={[
                {
                  label: "ニュース・技術情報",
                  href: "/insights",
                },
                { label: article.title },
              ]}
            />
            {article.publishedAt && (
              <time dateTime={article.publishedAt}>
                {formatJapaneseDate(article.publishedAt)}
              </time>
            )}
          </div>
        </div>

        <div className="section source-section site-container content-detail__body">
          {article.images.length > 0 && (
            <SourceCardGrid
              ariaLabel={`${article.title} 掲載画像`}
              variant="media"
              cards={article.images.map((image, index) => (
                <figure key={`${image.src}-${index}`}>
                  <Image
                    alt={image.alt}
                    height={720}
                    priority={index === 0}
                    sizes="(min-width: 64rem) 68rem, 100vw"
                    src={resolveSourceMediaPath(image.src)}
                    width={1120}
                  />
                </figure>
              ))}
            />
          )}

          <ContentSections sections={article.sections} />
        </div>
      </article>

      {relatedProducts.length > 0 && (
        <section className="section source-section related-products">
          <div className="site-container">
            <h2>関連製品</h2>
            <SourceCardGrid
              ariaLabel="関連製品"
              variant="products"
              cards={relatedProducts.map((product) => (
                <ProductCard
                  key={`${product.category}-${product.slug}`}
                  product={product}
                />
              ))}
            />
          </div>
        </section>
      )}

      <section className="section source-section page-contact">
        <div className="site-container">
          <ContactCta compact subject={article.title} />
        </div>
      </section>
    </SourceShell>
  );
}
