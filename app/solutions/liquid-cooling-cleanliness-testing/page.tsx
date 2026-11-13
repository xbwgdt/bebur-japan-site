import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { PageBlockRenderer } from "@/components/page-block-renderer";
import { getLiquidCoolingSolution, solutionRoute, solutionSections } from "@/lib/liquid-cooling";
import { normalizePageTitle, socialTitle } from "@/lib/metadata";
import { canonicalUrl } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLiquidCoolingSolution();
  const image = page.blocks.find((block) => block._type === "hero")?.image;
  return {
    title: normalizePageTitle(page.seoTitle || page.title),
    description: page.seoDescription,
    alternates: { canonical: canonicalUrl(solutionRoute) },
    openGraph: { title: socialTitle(page.seoTitle || page.title), description: page.seoDescription, url: canonicalUrl(solutionRoute), locale: "ja_JP", images: image?.asset?.url ? [{ url: image.asset.url, alt: image.alt }] : undefined },
  };
}

export default async function LiquidCoolingSolutionPage() {
  const page = await getLiquidCoolingSolution();
  const sections = solutionSections(page.blocks);
  const hero = sections.filter(({ block }) => block._type === "hero");
  const content = sections.filter(({ block }) => block._type !== "hero");
  return (
    <article className="solution-page">
      <div className="site-container solution-page__breadcrumbs"><Breadcrumbs items={[{ label: "導入分野・事例", href: "/applications" }, { label: page.title }]} /></div>
      <div className="site-container solution-page__hero"><PageBlockRenderer blocks={hero.map(({ block }) => block)} /></div>
      <div className="site-container solution-page__layout">
        <aside className="solution-page__toc"><nav aria-label="このページの目次"><h2>このページの目次</h2><ul>{content.map(({ block, id }) => block.title ? <li key={id}><a href={`#${id}`}>{block.title}</a></li> : null)}</ul></nav></aside>
        <div className="solution-page__content">{content.map(({ block, id }) => <div className="solution-page__chapter" id={id} key={id}><PageBlockRenderer blocks={[block]} /></div>)}</div>
      </div>
      <div className="site-container solution-page__contact"><ContactCta compact subject={page.title} /></div>
    </article>
  );
}
