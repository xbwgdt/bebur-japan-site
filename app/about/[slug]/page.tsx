import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ContentSections } from "@/components/content-sections";
import { getAboutPage, getAboutPages } from "@/lib/content";
import { siteConfig } from "@/lib/constants";
import { canonicalUrl } from "@/lib/routes";
import type { AboutPage } from "@/lib/types";

type AboutRouteParams = {
  slug: string;
};

export function resolveAboutPageForRoute(
  slug: string,
): AboutPage | undefined {
  return getAboutPage(slug);
}

export function generateStaticParams(): Array<{ slug: string }> {
  return getAboutPages()
    .map(({ slug }) => ({ slug }))
    .toSorted((left, right) => left.slug.localeCompare(right.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<AboutRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const aboutPage = resolveAboutPageForRoute(slug);

  if (!aboutPage) {
    notFound();
  }

  const canonical = canonicalUrl(aboutPage.route);
  const image = aboutPage.images[0];

  return {
    title: aboutPage.title,
    description: aboutPage.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: aboutPage.title,
      description: aboutPage.description,
      type: "website",
      url: canonical,
      images: image
        ? [{ url: image.src, alt: image.alt }]
        : undefined,
    },
  };
}

export default async function AboutDetailPage({
  params,
}: {
  params: Promise<AboutRouteParams>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const aboutPage = resolveAboutPageForRoute(slug);

  if (!aboutPage) {
    notFound();
  }

  return (
    <>
      <article className="content-detail about-detail">
        <header className="content-detail__hero">
          <div className="site-container">
            <Breadcrumbs
              items={[
                { label: "企業情報", href: "/about/overview" },
                { label: aboutPage.title },
              ]}
            />
            <p className="page-hero__eyebrow">ABOUT BEBUR</p>
            <h1>{aboutPage.title}</h1>
            <p className="content-detail__description">
              {aboutPage.description}
            </p>
          </div>
        </header>

        <div className="section site-container about-detail__layout">
          <section
            className="about-detail__brand"
            aria-labelledby="about-brand-title"
          >
            <h2 id="about-brand-title">Beburブランド・企業情報</h2>
            <p className="about-detail__scope-note">
              以下は、Beburの原文に掲載されたブランド・企業情報です。
            </p>

            {aboutPage.images.length > 0 && (
              <div
                className="content-detail__media-grid"
                aria-label={`${aboutPage.title} 掲載画像`}
              >
                {aboutPage.images.map((image, index) => (
                  <figure key={`${image.src}-${index}`}>
                    <Image
                      alt={image.alt}
                      height={720}
                      priority={index === 0}
                      sizes="(min-width: 64rem) 46rem, 100vw"
                      src={image.src}
                      width={1120}
                    />
                  </figure>
                ))}
              </div>
            )}

            <ContentSections sections={aboutPage.sections} />
          </section>

          <aside
            className="distributor-panel"
            aria-labelledby="japan-distributor-title"
          >
            <p>JAPAN DISTRIBUTOR</p>
            <h2 id="japan-distributor-title">
              日本国内の販売・お問い合わせ
            </h2>
            <strong>{siteConfig.distributorLabel}</strong>
            <p>
              日本国内の製品選定、仕様確認、お見積もり、アフターサービスのご相談は、新樹産業株式会社が承ります。
            </p>
          </aside>
        </div>
      </article>

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject={aboutPage.title} />
        </div>
      </section>
    </>
  );
}
