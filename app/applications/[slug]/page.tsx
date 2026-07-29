import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ContentSections } from "@/components/content-sections";
import { ProductCard } from "@/components/product-card";
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
    <>
      <article className="content-detail">
        <header className="content-detail__hero">
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
            <p className="page-hero__eyebrow">APPLICATION</p>
            <h1>{application.title}</h1>
            <p className="content-detail__description">
              {application.description}
            </p>
            {application.publishedAt && (
              <time dateTime={application.publishedAt}>
                {formatJapaneseDate(application.publishedAt)}
              </time>
            )}
          </div>
        </header>

        <div className="section site-container content-detail__body">
          {application.images.length > 0 && (
            <div
              className="content-detail__media-grid"
              aria-label={`${application.title} 掲載画像`}
            >
              {application.images.map((image, index) => (
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
            </div>
          )}

          <ContentSections sections={application.sections} />
        </div>
      </article>

      {recommendedProducts.length > 0 && (
        <section className="section related-products">
          <div className="site-container">
            <h2>推奨製品</h2>
            <p className="related-products__description">
              原文で関連付けられた製品情報です。
            </p>
            <div className="product-grid">
              {recommendedProducts.map((product) => (
                <ProductCard
                  key={`${product.category}-${product.slug}`}
                  product={product}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject={application.title} />
        </div>
      </section>
    </>
  );
}
