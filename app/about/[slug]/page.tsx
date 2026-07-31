import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ContentSections } from "@/components/content-sections";
import { PageBlockRenderer } from "@/components/page-block-renderer";
import { SourceCardGrid } from "@/components/source-faithful/source-card-grid";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { getAboutPage, getAboutPages } from "@/lib/content";
import { siteConfig } from "@/lib/constants";
import { canonicalUrl } from "@/lib/routes";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
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

  const cmsPage = await getPublishedPageForRoute(slug);

  const canonical = canonicalUrl(aboutPage.route);
  const image = aboutPage.images[0];

  return {
    title: cmsPage?.seoTitle || aboutPage.title,
    description: cmsPage?.seoDescription || aboutPage.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: cmsPage?.seoTitle || aboutPage.title,
      description: cmsPage?.seoDescription || aboutPage.description,
      type: "website",
      url: canonical,
      images: image
        ? [{ url: resolveSourceMediaPath(image.src), alt: image.alt }]
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

  const cmsPage = await getPublishedPageForRoute(slug);

  if (cmsPage) {
    return (
      <SourceShell>
        <main className="section source-section site-container">
          <PageBlockRenderer blocks={cmsPage.blocks} />
        </main>
      </SourceShell>
    );
  }

  return (
    <SourceShell>
      <article className="content-detail about-detail">
        <SourceHero
          eyebrow="ABOUT BEBUR"
          image="/source-media/1761830441866756-8fc7d7dafdaf5c8d.jpg"
          summary={aboutPage.description}
          title={aboutPage.title}
        />

        <div className="source-breadcrumb-band">
          <div className="site-container">
            <Breadcrumbs
              items={[
                { label: "企業情報", href: "/about/overview" },
                { label: aboutPage.title },
              ]}
            />
          </div>
        </div>

        <div className="section source-section site-container about-detail__layout">
          <section
            className="about-detail__brand"
            aria-labelledby="about-brand-title"
          >
            <h2 id="about-brand-title">Beburブランド・企業情報</h2>
            <p className="about-detail__scope-note">
              以下は、Beburの原文に掲載されたブランド・企業情報です。
            </p>

            {aboutPage.images.length > 0 && (
              <SourceCardGrid
                ariaLabel={`${aboutPage.title} 掲載画像`}
                variant="media"
                cards={aboutPage.images.map((image, index) => (
                  <figure key={`${image.src}-${index}`}>
                    <Image
                      alt={image.alt}
                      height={720}
                      priority={index === 0}
                      sizes="(min-width: 64rem) 46rem, 100vw"
                      src={resolveSourceMediaPath(image.src)}
                      width={1120}
                    />
                  </figure>
                ))}
              />
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

      <section className="section source-section page-contact">
        <div className="site-container">
          <ContactCta compact subject={aboutPage.title} />
        </div>
      </section>
    </SourceShell>
  );
}
