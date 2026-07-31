import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { PublishedPage } from "@/components/published-page";
import { ProductExplorer } from "@/components/product-explorer";
import { getProducts } from "@/lib/content";
import { canonicalUrl, productCategoryLabels } from "@/lib/routes";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
import type { ProductCategory } from "@/lib/types";

type CategoryPageContent = {
  category: ProductCategory;
  description: string;
  label: string;
};

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

const categoryDescriptions: Record<ProductCategory, string> = {
  cleanliness:
    "液冷設備や品質管理工程に向け、液中粒子の個数・粒径と清浄度をオンラインまたは携帯型で監視します。",
  dosing:
    "ストリーミング電流と粒子電荷分析を活用し、凝集剤や消毒剤の薬注量を工程条件に合わせて最適化します。",
  "water-quality":
    "消毒、プロセス水、飲料水、排水、製薬用水に向けた各種水質項目をオンラインで分析します。",
  "gas-detection":
    "固定式・携帯式のガス検知器と警報システムで、可燃性・有毒・臭気ガスなどを監視します。",
  "flow-level":
    "導電性液体の電磁流量測定と、超音波による液位・レベル測定に対応します。",
};

export function resolveProductCategory(
  category: string,
): ProductCategory | undefined {
  if (
    Object.prototype.hasOwnProperty.call(productCategoryLabels, category)
  ) {
    return category as ProductCategory;
  }

  return undefined;
}

export function generateStaticParams(): Array<{ category: ProductCategory }> {
  return (Object.keys(productCategoryLabels) as ProductCategory[]).map(
    (category) => ({ category }),
  );
}

function getCategoryPageContent(
  categoryValue: string,
): CategoryPageContent | undefined {
  const category = resolveProductCategory(categoryValue);
  if (!category) {
    return undefined;
  }

  return {
    category,
    description: categoryDescriptions[category],
    label: productCategoryLabels[category],
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categoryValue } = await params;
  const content = getCategoryPageContent(categoryValue);

  if (!content) {
    notFound();
  }

  const route = `/products/${content.category}`;

  return {
    title: content.label,
    description: content.description,
    alternates: {
      canonical: canonicalUrl(route),
    },
  };
}

export default async function ProductCategoryPage({
  params,
}: CategoryPageProps): Promise<React.ReactElement> {
  const { category: categoryValue } = await params;
  const content = getCategoryPageContent(categoryValue);

  if (!content) {
    notFound();
  }

  const cmsPage = await getPublishedPageForRoute(content.category);
  if (cmsPage) {
    return <PublishedPage page={cmsPage} />;
  }

  const categoryProducts = getProducts(content.category);

  return (
    <>
      <header className="page-hero page-hero--compact">
        <div className="site-container">
          <Breadcrumbs
            items={[
              { label: "製品情報", href: "/products" },
              { label: content.label },
            ]}
          />
          <p className="page-hero__eyebrow">PRODUCT CATEGORY</p>
          <h1>{content.label}</h1>
          <p>{content.description}</p>
          <p className="page-hero__count">{categoryProducts.length}製品</p>
        </div>
      </header>

      <section className="section product-index">
        <div className="site-container">
          <ProductExplorer
            initialCategory={content.category}
            products={getProducts()}
          />
        </div>
      </section>

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject={`${content.label} 製品`} />
        </div>
      </section>
    </>
  );
}
