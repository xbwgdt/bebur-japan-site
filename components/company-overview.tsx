import { SourceHero } from "./source-faithful/source-hero";
import { SourceShell } from "./source-faithful/source-shell";
import { Breadcrumbs } from "./breadcrumbs";
import { PageBlockRenderer } from "./page-block-renderer";
import { buildMailto, siteConfig } from "@/lib/constants";
import { publicSiteSettings } from "@/lib/site-settings";
import type { CardGridPageBlock, HeroPageBlock } from "@/lib/page-blocks";
import type { SanityPage } from "@/lib/sanity/queries";
import type { ContentMediaPath } from "./source-faithful/source-media";
import { companyOverviewStyle, localCompanyOverview, overviewBlockStyle, overviewHref, overviewImage, overviewSections, resolveCompanyOverviewStyle } from "@/lib/company-overview";

export function CompanyOverview({ page }: { page: SanityPage }) {
  const theme = resolveCompanyOverviewStyle(page.companyOverviewStyle);
  const fallbackHero = localCompanyOverview.blocks[0] as HeroPageBlock;
  const hero = page.blocks.find(block => block._type === "hero") as HeroPageBlock | undefined;
  const sections = overviewSections(page.blocks);
  const heroImage = overviewImage(hero?.image?.asset?.url, false) ?? fallbackHero.image!.asset!.url!;
  return <SourceShell><article className="company-overview" data-font={theme.fontFamily} style={companyOverviewStyle(page.companyOverviewStyle)}>
    <div className="company-overview__hero" data-spacing={hero?.spacing ?? "normal"} data-title-wrap={hero?.desktopTitleWrap === "nowrap" ? "nowrap" : "wrap"} style={overviewBlockStyle(hero ?? fallbackHero)}>
      <SourceHero image={heroImage as ContentMediaPath} imageAlt={hero?.image?.alt ?? fallbackHero.image?.alt} eyebrow={theme.eyebrow} title={hero?.title || page.title} summary={hero?.summary || fallbackHero.summary!} actions={hero?.ctaLabel && overviewHref(hero.ctaHref) ? <a className="company-overview__button" href={overviewHref(hero.ctaHref)!}>{hero.ctaLabel}</a> : undefined} />
    </div>
    <div className="source-breadcrumb-band"><div className="site-container"><Breadcrumbs items={[{ label: page.title }]} /></div></div>
    <nav className="company-overview__nav" aria-label={theme.navigationLabel}><div className="site-container">{sections.filter(({block})=>block.title).map(({id,block})=><a key={id} href={`#${id}`}>{block.title}</a>)}</div></nav>
    {sections.map(({id,block})=><section key={id} id={id} className="company-overview__section" data-section={block.anchorId} data-color={["brand","blue","red","neutral"].includes(block.color??"")?block.color:"neutral"} style={overviewBlockStyle(block)}>
      <div className="site-container">
        {block._type === "cardGrid" ? <><h2>{block.title}</h2><div className="company-overview__grid">{(block.cards??[]).filter(card=>card.title).map((card,index)=><OverviewCard key={index} card={card} certificate={block.anchorId==="company-certificates"} documentLabel={theme.documentActionLabel}/>)}</div></> : block._type === "cta" ? <div className="company-overview__contact"><h2>{block.title}</h2><p>{block.summary}</p><strong>{siteConfig.distributorLabel}</strong><div className="company-overview__contact-actions"><a href={`tel:${siteConfig.phone}`}>{publicSiteSettings.contactPage.panel.phoneActionLabel}<span>{siteConfig.phone}</span></a><a href={buildMailto(page.title)}>{block.label || publicSiteSettings.contactPage.panel.emailActionLabel}<span>{siteConfig.email}</span></a></div></div> : <PageBlockRenderer blocks={[block]}/>}
      </div>
    </section>)}
  </article></SourceShell>;
}

function OverviewCard({card,certificate,documentLabel}:{card:NonNullable<CardGridPageBlock["cards"]>[number];certificate:boolean;documentLabel:string}) {
  const image = overviewImage(card.image?.asset?.url);
  const original = overviewImage(card.image?.asset?.url,false);
  const href = overviewHref(card.href);
  const picture = image ? <img src={image} alt={card.image?.alt || card.title || "Beburの企業情報"} width={600} height={certificate?800:400} loading="lazy" /> : null;
  return <article>
    {picture && <figure>{certificate&&original?<a href={original} target="_blank" rel="noopener noreferrer" aria-label={`${card.title} ${documentLabel}`}>{picture}</a>:picture}</figure>}
    <div className="company-overview__card-body"><h3>{card.title}</h3>{card.summary?.split(/\n\n/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}
    {certificate&&original?<a className="company-overview__text-link" href={original} target="_blank" rel="noopener noreferrer">{documentLabel} <span aria-hidden="true">↗</span></a>:card.linkLabel&&href?<a className="company-overview__text-link" href={href}>{card.linkLabel} <span aria-hidden="true">→</span></a>:null}</div>
  </article>;
}
