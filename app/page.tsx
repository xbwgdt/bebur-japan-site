import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationCard } from "@/components/application-card";
import { ContactCta } from "@/components/contact-cta";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { SourceCardGrid } from "@/components/source-faithful/source-card-grid";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import { SourceShell } from "@/components/source-faithful/source-shell";
import {
  getApplication,
  getArticles,
  getProduct,
  getProducts,
} from "@/lib/content";
import { siteConfig } from "@/lib/constants";
import { canonicalUrl, productCategoryLabels } from "@/lib/routes";
import { publicSiteSettings, resolveHomeHeroStyle } from "@/lib/site-settings";
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

const featuredArticles = getArticles()
  .toSorted((left, right) => {
    const dateOrder = (right.publishedAt ?? "").localeCompare(
      left.publishedAt ?? "",
    );
    return dateOrder || left.route.localeCompare(right.route, "ja");
  })
  .slice(0, 3);

const japaneseDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatJapaneseDate(date: string): string {
  return japaneseDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export default async function HomePage(): Promise<React.ReactElement> {
  const homeHero = publicSiteSettings.homeHero;

  return (
    <SourceShell>
      <div className={resolveHomeHeroStyle(homeHero.style)}>
        <SourceHero
          eyebrow={homeHero.eyebrow}
          image={homeHero.backgroundImage.src as import("@/components/source-faithful/source-media").ContentMediaPath}
          imageAlt={homeHero.backgroundImage.alt}
          summary={homeHero.summary}
          title={homeHero.title}
          actions={
            <>
              <Link className="button button--accent" href={homeHero.primaryAction.href}>
                {homeHero.primaryAction.label}
              </Link>
              <Link className="button button--light" href={homeHero.secondaryAction.href}>
                {homeHero.secondaryAction.label}
              </Link>
            </>
          }
          identity={siteConfig.distributorLabel}
        />
      </div>

      <section
        className="section source-section home-categories"
        aria-labelledby="home-product-categories-title"
      >
        <div className="site-container">
          <SectionHeading
            eyebrow="PRODUCT CENTER"
            title="計測課題から選べる製品ラインアップ"
            titleId="home-product-categories-title"
            description="5つの製品カテゴリーから、測定対象と現場の課題に合う製品をご覧いただけます。"
          />
          <SourceCardGrid
            ariaLabel="製品カテゴリー"
            variant="categories"
            cards={categoryOrder.map((category, index) => {
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
          />
          <div className="source-home-featured">
            <h3>カテゴリーを代表する製品</h3>
            <p>各カテゴリーから代表的な5製品をご覧いただけます。</p>
            <SourceCardGrid
              ariaLabel="代表製品"
              variant="products"
              cards={representativeProducts.map((product, index) => (
                <ProductCard
                  key={`${product.category}-${product.slug}`}
                  priority={index < 3}
                  product={product}
                />
              ))}
            />
          </div>
        </div>
      </section>

      <section
        className="section source-section source-home-about"
        aria-labelledby="home-about-title"
      >
        <div className="site-container source-home-about__layout">
          <div className="source-home-about__media">
            <Image
              alt="Beburの水質分析・ガス検知技術"
              height={760}
              sizes="(min-width: 64rem) 48vw, 100vw"
              src="/source-media/index-16-016907b8f93a0b2b.jpg"
              width={1120}
            />
          </div>
          <div className="source-home-about__content">
            <SectionHeading
              eyebrow="ABOUT US"
              title="Beburについて"
              titleId="home-about-title"
              description="水質分析、ガス検知、清浄度測定の技術を磨き、産業現場の品質管理と安全を支える計測機器メーカーです。"
            />
            <p>
              製品開発から各国の販売ネットワークまで、現場で継続して使える計測ソリューションを届けています。
            </p>
            <Link className="source-home-about__link" href="/about/overview">
              企業情報を見る
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section source-section technology-section">
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

      <section className="section source-section">
        <div className="site-container">
          <SectionHeading
            eyebrow="INDUSTRY APPLICATIONS"
            title="多様な産業で、品質と安全を支える"
            description="液冷、上水処理、医療・製薬、電力の各現場に向けた計測構成をご紹介します。"
          />
          <SourceCardGrid
            ariaLabel="産業別用途"
            variant="applications"
            cards={featuredApplications.map((application) => (
              <ApplicationCard
                application={application}
                key={application.slug}
              />
            ))}
          />
        </div>
      </section>

      <section
        className="section source-section source-home-news"
        aria-labelledby="home-news-title"
      >
        <div className="site-container">
          <SectionHeading
            eyebrow="NEWS CENTER"
            title="ニュース・技術情報"
            titleId="home-news-title"
            description="計測方式の解説、製品情報、現場での活用に役立つ最新記事をご紹介します。"
          />
          <div className="source-home-news__grid">
            {featuredArticles.map((article) => {
              const image = article.images[0];

              return (
                <article className="insight-card card" key={article.slug}>
                  {image && (
                    <div className="insight-card__media">
                      <Image
                        alt={image.alt}
                        height={420}
                        sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                        src={resolveSourceMediaPath(image.src)}
                        width={640}
                      />
                    </div>
                  )}
                  <div className="insight-card__body">
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt}>
                        {formatJapaneseDate(article.publishedAt)}
                      </time>
                    )}
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <Link
                      className="insight-card__link"
                      href={article.route}
                    >
                      記事を読む
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section source-section home-contact">
        <div className="site-container">
          <ContactCta />
        </div>
      </section>
    </SourceShell>
  );
}
