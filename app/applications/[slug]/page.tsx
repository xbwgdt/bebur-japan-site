import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ContentSections } from "@/components/content-sections";
import { ProductCard } from "@/components/product-card";
import { SourceCardGrid } from "@/components/source-faithful/source-card-grid";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { getApplication, getApplications, getProducts } from "@/lib/content";
import { canonicalUrl } from "@/lib/routes";
import type { Application, Product } from "@/lib/types";

type ApplicationRouteParams = {
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

export function resolveApplicationForRoute(
  slug: string,
): Application | undefined {
  return getApplication(slug);
}

export function resolveRecommendedProducts(slugs: string[]): Product[] {
  const products = getProducts();

  return slugs.flatMap((slug) => {
    const product = products.find((candidate) => candidate.slug === slug);
    return product ? [product] : [];
  });
}

export function generateStaticParams(): Array<{ slug: string }> {
  return getApplications()
    .map(({ slug }) => ({ slug }))
    .toSorted((left, right) => left.slug.localeCompare(right.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ApplicationRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const application = resolveApplicationForRoute(slug);

  if (!application) {
    notFound();
  }

  const canonical = canonicalUrl(application.route);
  const image = application.images[0];

  return {
    title: application.title,
    description: application.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: application.title,
      description: application.description,
      type: "website",
      url: canonical,
      images: image
        ? [{ url: image.src, alt: image.alt }]
        : undefined,
    },
  };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<ApplicationRouteParams>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const application = resolveApplicationForRoute(slug);

  if (!application) {
    notFound();
  }

  const recommendedProducts = resolveRecommendedProducts(
    application.recommendedProductSlugs,
  );

  return (
    <SourceShell>
      <article className="content-detail">
        <SourceHero
          eyebrow="APPLICATION"
          image="/source-media/1762161234430121-ff7959b79637fe02.jpg"
          summary={application.description}
          title={application.title}
        />

        <div className="source-breadcrumb-band">
          <div className="site-container">
            <Breadcrumbs
              items={[
                {
                  label: "産業別用途・導入事例",
                  href: "/applications",
                },
                { label: application.title },
              ]}
            />
            {application.publishedAt && (
              <time dateTime={application.publishedAt}>
                {formatJapaneseDate(application.publishedAt)}
              </time>
            )}
          </div>
        </div>

        <div className="section source-section site-container content-detail__body">
          {application.images.length > 0 && (
            <SourceCardGrid
              variant="media"
              cards={application.images.map((image, index) => (
                <figure key={`${image.src}-${index}`}>
                  <Image
                    alt={image.alt}
                    height={720}
                    priority={index === 0}
                    sizes="(min-width: 64rem) 68rem, 100vw"
                    src={image.src}
                    width={1120}
                  />
                </figure>
              ))}
            />
          )}

          <ContentSections sections={application.sections} />
        </div>
      </article>

      {recommendedProducts.length > 0 && (
        <section className="section source-section related-products">
          <div className="site-container">
            <h2>推奨製品</h2>
            <p className="related-products__description">
              原文で関連付けられた製品情報です。
            </p>
            <SourceCardGrid
              variant="products"
              cards={recommendedProducts.map((product) => (
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
          <ContactCta compact subject={application.title} />
        </div>
      </section>
    </SourceShell>
  );
}
