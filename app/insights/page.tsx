import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
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
  const articles = orderArticlesByDate(getArticles());

  return (
    <>
      <header className="page-hero">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "ニュース・技術情報" }]} />
          <p className="page-hero__eyebrow">INSIGHTS</p>
          <h1>ニュース・技術情報</h1>
          <p>{pageDescription}</p>
        </div>
      </header>

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
    </>
  );
}
