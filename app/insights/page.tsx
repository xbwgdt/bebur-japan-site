import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
import { resolveCategoryHero } from "@/lib/page-enhancements";
import { getArticles, getStaticPages } from "@/lib/content";
import { canonicalUrl } from "@/lib/routes";
import type { Article } from "@/lib/types";

const pageContent = getStaticPages().find(
  ({ route }) => route === "/insights",
);
const pageDescription =
  pageContent?.description ??
  "Beburの水質分析、ガス検知、清浄度測定に関するニュースと技術情報です。";

export const metadata: Metadata = {
  title: "ニュース・技術情報",
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl("/insights"),
  },
};

const japaneseDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatJapaneseDate(date: string): string {
  return japaneseDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function orderArticlesByDate(articles: Article[]): Article[] {
  return articles.toSorted((left, right) => {
    if (left.publishedAt && right.publishedAt) {
      return (
        right.publishedAt.localeCompare(left.publishedAt) ||
        left.route.localeCompare(right.route, "ja")
      );
    }

    if (left.publishedAt) {
      return -1;
    }

    if (right.publishedAt) {
      return 1;
    }

    return left.route.localeCompare(right.route, "ja");
  });
}

export default async function InsightsPage(): Promise<React.ReactElement> {
  const page = await getPublishedPageForRoute("insight-index");
  const hero = resolveCategoryHero("insight-index", page?.categoryHero)!;
  const articles = orderArticlesByDate(getArticles());

  return (
    <SourceShell>
      <SourceHero
        className={`category-banner category-banner--${hero.color} category-banner--${hero.fontFamily} category-banner--${hero.fontSize}`}
        image={resolveSourceMediaPath(hero.image.src)} imageAlt={hero.image.alt}
        eyebrow={hero.eyebrow} title={hero.title} summary={hero.summary}
      />
      <div className="source-breadcrumb-band">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "ニュース・技術情報" }]} />
        </div>
      </div>

      <section className="section insights-index">
        <div className="site-container insight-grid">
          {articles.map((article) => {
            const image = article.images[0];

            return (
              <article className="insight-card card" key={article.slug}>
                <div className="insight-card__media">
                  {image ? (
                    <Image
                      alt={image.alt}
                      height={420}
                      sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                      src={image.src}
                      width={640}
                    />
                  ) : (
                    <div
                      className="insight-card__fallback"
                      role="img"
                      aria-label={`${article.title} 技術情報イメージ`}
                    >
                      <span>BEBUR</span>
                      <strong>TECHNICAL INSIGHT</strong>
                    </div>
                  )}
                </div>
                <div className="insight-card__body">
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt}>
                      {formatJapaneseDate(article.publishedAt)}
                    </time>
                  )}
                  <h2>{article.title}</h2>
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
      </section>

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject="Bebur ニュース・技術情報" />
        </div>
      </section>
    </SourceShell>
  );
}
