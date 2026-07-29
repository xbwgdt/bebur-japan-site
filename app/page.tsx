import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationCard } from "@/components/application-card";
import { ContactCta } from "@/components/contact-cta";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getApplication, getProduct, getProducts } from "@/lib/content";
import { canonicalUrl, productCategoryLabels } from "@/lib/routes";
import type { Application, Product, ProductCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "水質分析・ガス検知の精密計測",
  description:
    "水質分析、ガス検知、清浄度測定、薬注制御、流量・液位測定を支えるBebur製品と産業別ソリューションをご案内します。",
  alternates: {
    canonical: canonicalUrl("/"),
  },
};

const categoryOrder = Object.keys(
  productCategoryLabels,
) as ProductCategory[];

const categoryDescriptions: Record<ProductCategory, string> = {
  cleanliness: "液中粒子と清浄度を連続・携帯測定",
  dosing: "凝集・消毒工程の薬注を最適化",
  "water-quality": "水処理工程を支えるオンライン分析",
  "gas-detection": "固定式・携帯式のガス監視と警報",
  "flow-level": "電磁流量と超音波レベルを測定",
};

const technologyFacts = [
  {
    value: "20年の経験",
    description: "計測技術と製品開発を積み重ねてきた経験",
  },
  {
    value: "電気化学・光学技術",
    description: "測定対象に応じた複数の検出原理",
  },
  {
    value: "横断する製品群",
    description: "水質、ガス、清浄度、薬注制御を横断する製品群",
  },
  {
    value: "50か国以上",
    description: "50か国以上に広がる販売ネットワーク",
  },
] as const;

const featuredApplications = [
  "liquid-cooling-industry",
  "municipal-water-treatment",
  "medical-pharmaceutical",
  "electric-power-industry",
]
  .map(getApplication)
  .filter(
    (application): application is Application => application !== undefined,
  );

const representativeProducts = [
  getProduct("cleanliness", "bt8500"),
  getProduct("dosing", "scm530"),
  getProduct("water-quality", "bt-7000"),
  getProduct("gas-detection", "gt-3280-ou"),
  getProduct("flow-level", "msf8100"),
].filter((product): product is Product => product !== undefined);

export default function HomePage(): React.ReactElement {
  return (
    <>
      <Hero />

      <section
        className="section home-categories"
        aria-labelledby="home-product-categories-title"
      >
        <div className="site-container">
          <SectionHeading
            eyebrow="PRODUCTS"
            title="計測課題から選べる製品ラインアップ"
            titleId="home-product-categories-title"
            description="5つの製品カテゴリーから、測定対象と現場の課題に合う製品をご覧いただけます。"
          />
          <div className="category-grid">
            {categoryOrder.map((category, index) => {
              const count = getProducts(category).length;

              return (
                <Link
                  className="category-card"
                  href={`/products/${category}`}
                  key={category}
                >
                  <span className="category-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{productCategoryLabels[category]}</h3>
                  <p>{categoryDescriptions[category]}</p>
                  <span className="category-card__count">{count}製品</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section technology-section">
        <div className="site-container">
          <SectionHeading
            eyebrow="TECHNOLOGY"
            title="現場に応える、確かな計測技術"
            description="測定原理と製品設計の蓄積を、工程監視と品質管理に生かします。"
          />
          <ul className="technology-grid">
            {technologyFacts.map((fact, index) => (
              <li key={fact.value}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{fact.value}</strong>
                <p>{fact.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="site-container">
          <SectionHeading
            eyebrow="APPLICATIONS"
            title="多様な産業で、品質と安全を支える"
            description="液冷、上水処理、医療・製薬、電力の各現場に向けた計測構成をご紹介します。"
          />
          <div className="application-grid">
            {featuredApplications.map((application) => (
              <ApplicationCard
                application={application}
                key={application.slug}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section representative-products">
        <div className="site-container">
          <SectionHeading
            eyebrow="SELECTED PRODUCTS"
            title="カテゴリーを代表する製品"
            description="各カテゴリーから代表的な5製品をご覧いただけます。"
          />
          <div className="product-grid">
            {representativeProducts.map((product, index) => (
              <ProductCard
                key={`${product.category}-${product.slug}`}
                priority={index < 3}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section home-contact">
        <div className="site-container">
          <ContactCta />
        </div>
      </section>
    </>
  );
}
