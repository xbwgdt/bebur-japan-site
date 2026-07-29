import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ProductCard } from "@/components/product-card";
import { getProduct, getProducts } from "@/lib/content";
import {
  canonicalUrl,
  productCategoryLabels,
  productRoute,
} from "@/lib/routes";
import type {
  ContentSection,
  Product,
  ProductCategory,
} from "@/lib/types";

type ProductRouteParams = {
  category: string;
  slug: string;
};

export function resolveProductForRoute(
  category: string,
  slug: string,
): Product | undefined {
  if (
    !Object.prototype.hasOwnProperty.call(productCategoryLabels, category)
  ) {
    return undefined;
  }

  return getProduct(category as ProductCategory, slug);
}

export function generateStaticParams(): Array<{
  category: ProductCategory;
  slug: string;
}> {
  return getProducts().map(({ category, slug }) => ({ category, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductRouteParams>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = resolveProductForRoute(category, slug);

  if (!product) {
    notFound();
  }

  const route = productRoute(product);
  const canonical = canonicalUrl(route);
  const image = product.images[0];

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: product.title,
      description: product.description,
      type: "website",
      url: canonical,
      images: image
        ? [
            {
              url: image.src,
              alt: image.alt,
            },
          ]
        : undefined,
    },
  };
}

function arraysMatch(
  first: readonly string[] | undefined,
  second: readonly string[],
): boolean {
  return (
    first !== undefined &&
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function additionalContentSections(product: Product): ContentSection[] {
  return product.sections.flatMap((section) => {
    const paragraphs = section.paragraphs.filter(
      (paragraph) => paragraph !== product.description,
    );
    const bullets = arraysMatch(section.bullets, product.features)
      ? []
      : (section.bullets ?? []);

    if (paragraphs.length === 0 && bullets.length === 0) {
      return [];
    }

    return [{ ...section, paragraphs, bullets }];
  });
}

function relatedProducts(product: Product): Product[] {
  const allProducts = getProducts();
  const explicitRelated = product.relatedSlugs.flatMap((slug) => {
    const match = allProducts.find(
      (candidate) =>
        candidate.slug === slug &&
        !(
          candidate.category === product.category &&
          candidate.slug === product.slug
        ),
    );
    return match ? [match] : [];
  });

  const candidates =
    explicitRelated.length > 0
      ? explicitRelated
      : allProducts.filter(
          (candidate) =>
            candidate.category === product.category &&
            candidate.slug !== product.slug,
        );

  return candidates.slice(0, 3);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<ProductRouteParams>;
}): Promise<React.ReactElement> {
  const { category, slug } = await params;
  const product = resolveProductForRoute(category, slug);

  if (!product) {
    notFound();
  }

  const image = product.images[0];
  const sections = additionalContentSections(product);
  const related = relatedProducts(product);

  return (
    <>
      <article className="product-detail">
        <div className="product-detail__breadcrumb site-container">
          <Breadcrumbs
            items={[
              { label: "製品情報", href: "/products" },
              {
                label: productCategoryLabels[product.category],
                href: `/products/${product.category}`,
              },
              { label: product.title },
            ]}
          />
        </div>

        <header className="product-detail__hero">
          <div className="site-container product-detail__hero-grid">
            <div className="product-detail__intro">
              <p className="product-detail__category">
                {productCategoryLabels[product.category]}
              </p>
              <p className="product-detail__model">{product.model}</p>
              <h1>{product.title}</h1>
              <p className="product-detail__description">
                {product.description}
              </p>
            </div>

            <div className="product-detail__media">
              {image ? (
                <Image
                  alt={image.alt}
                  height={620}
                  priority
                  sizes="(min-width: 64rem) 42vw, 100vw"
                  src={image.src}
                  width={760}
                />
              ) : (
                <div
                  className="product-detail__fallback"
                  role="img"
                  aria-label={`${product.model} 製品画像`}
                >
                  <span>BEBUR</span>
                  <strong>{product.model}</strong>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="section site-container product-detail__content">
          {product.principle && (
            <section className="product-detail__principle">
              <p>MEASUREMENT PRINCIPLE</p>
              <h2>測定原理</h2>
              <div>{product.principle}</div>
            </section>
          )}

          {sections.map((section, index) => (
            <section
              className="product-detail__section"
              key={`${section.heading}-${index}`}
            >
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul>
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={`${bullet.slice(0, 24)}-${bulletIndex}`}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="product-detail__lists">
            {product.features.length > 0 && (
              <section className="product-detail__list-panel">
                <h2>主な特長</h2>
                <ul>
                  {product.features.map((feature, index) => (
                    <li key={`${feature.slice(0, 24)}-${index}`}>{feature}</li>
                  ))}
                </ul>
              </section>
            )}

            {product.applications.length > 0 && (
              <section className="product-detail__list-panel">
                <h2>用途・適用分野</h2>
                <ul>
                  {product.applications.map((application, index) => (
                    <li key={`${application.slice(0, 24)}-${index}`}>
                      {application}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {product.specifications.length > 0 && (
            <section className="product-detail__specifications">
              <h2>主な仕様</h2>
              <div
                className="specification-table__scroller"
                tabIndex={0}
                aria-label={`${product.model} 仕様表を横にスクロール`}
              >
                <table>
                  <caption>{product.model} 主な仕様</caption>
                  <tbody>
                    {product.specifications.map((specification, index) => (
                      <tr key={`${specification.label}-${index}`}>
                        <th scope="row">{specification.label}</th>
                        <td>{specification.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="section related-products">
          <div className="site-container">
            <h2>関連製品</h2>
            <div className="product-grid">
              {related.map((relatedProduct) => (
                <ProductCard
                  key={`${relatedProduct.category}-${relatedProduct.slug}`}
                  product={relatedProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta
            compact
            subject={`${product.model} ${product.title}`}
          />
        </div>
      </section>
    </>
  );
}
