import { createElement, type CSSProperties } from "react";
import { PageBlockRenderer } from "@/components/page-block-renderer";
import { LoopDiagram } from "./loop-diagram";
import { liquidCoolingStyle, resolveLiquidCoolingDesign } from "@/lib/liquid-cooling-design";
import { solutionSections } from "@/lib/liquid-cooling";
import { publicSiteSettings } from "@/lib/site-settings";
import type { SanityPage } from "@/lib/sanity/queries";
import type { PageBlock, RichTextPageBlock, PortableTextBlock, DataTablePageBlock, HeroPageBlock } from "@/lib/page-blocks";

const entryText = (entry: PortableTextBlock) => entry.children?.map(child=>child.text??"").join("")??"";
const safeHref = (href?:string) => href && /^(?:\/(?!\/)|https?:\/\/|mailto:|tel:|#[a-z][a-z0-9-]*$)/.test(href) ? href : undefined;

function Prose({content=[]}:{content?:PortableTextBlock[]}) {
  const nodes: React.ReactNode[]=[];
  for(let index=0;index<content.length;index++) {
    const item=content[index];
    if(item.listItem==="bullet"||item.listItem==="number") {
      const items=[]; const kind=item.listItem;
      while(content[index]?.listItem===kind) {items.push(<li key={index}>{entryText(content[index])}</li>);index++;}
      index--; nodes.push(createElement(kind==="number"?"ol":"ul",{key:`list${index}`},items));
    } else nodes.push(createElement(/^h[2-6]$/.test(item.style??"")?item.style!:"p",{key:index},entryText(item)));
  }
  return <>{nodes}</>;
}

function groups(content:PortableTextBlock[]=[]) {
  const result:Array<{title:string;content:PortableTextBlock[]}>=[]; const intro:PortableTextBlock[]=[];
  for(const entry of content) {
    if(entry.style==="h3") result.push({title:entryText(entry),content:[]});
    else if(result.length) result[result.length-1].content.push(entry);
    else intro.push(entry);
  }
  return {intro,items:result};
}

function Table({block}:{block:DataTablePageBlock}) {
  return <div className="table-wrap" tabIndex={0} role="region" aria-label={block.title}><table><caption>{block.title}</caption><thead><tr>{block.columns?.map((col,i)=><th scope="col" key={i}>{col}</th>)}</tr></thead><tbody>{block.rows?.map((row,i)=><tr key={i}>{block.columns?.map((_,j)=><td key={j}>{row.cells?.[j]}</td>)}</tr>)}</tbody></table></div>;
}

function BodyBlock({block,id,detailsLabel}:{block:PageBlock;id:string;detailsLabel:string}) {
  if(block._type==="hero") return <section className="sec extra-hero" id={id}><h2>{block.title}</h2><p>{block.summary}</p>{block.image?.asset?.url&&<img src={block.image.asset.url} alt={block.image.alt||block.title||""} />}</section>;
  if(block._type==="dataTable") {
    const particleValues=(block.rows??[]).map(row=>Number(row.cells?.[0]?.match(/\d+(?:\.\d+)?/)?.[0]??0));
    const particleMaximum=Math.max(10,...particleValues);
    if(id.startsWith("specs-")) return <section className="sec sensor-spec" id={id}><details><summary>{block.title} — {detailsLabel}</summary><Table block={block}/></details></section>;
    if(id==="particle-scales") return <section className="sec" id={id}><h2>{block.title}</h2><div className="scale" aria-label={block.title}>{block.rows?.map((row,i)=><div className="scale-row" key={i}><div className="v">{row.cells?.[0]}</div><div className="bar"><i className={particleValues[i]>=50?"warn":undefined} data-particle-size={particleValues[i]} style={{width:`${Math.round(Math.log10(Math.max(1,particleValues[i]))/Math.log10(particleMaximum)*10000)/100}%`}}/></div><div className="d">{row.cells?.slice(1).join(" — ")}</div></div>)}</div></section>;
    return <section className="sec" id={id}><Table block={block}/></section>;
  }
  if(block._type==="richText") {
    const split=groups(block.content);
    if(id==="faq") return <section className="sec" id={id}><h2>{block.title}</h2><Prose content={split.intro}/><div className="faq-wrap">{split.items.map((item,i)=><details className="faq" key={i}><summary>{item.title}</summary><Prose content={item.content}/></details>)}</div></section>;
    if(id==="stages") return <section className="sec" id={id}><h2>{block.title}</h2><Prose content={split.intro}/><div className="timeline">{split.items.map((item,i)=><article className="tl-item" key={i}><div className="tl-num">{String(i+1).padStart(2,"0")}</div><div className="tl-axis" aria-hidden="true"/><div className="tl-body"><h3>{item.title}</h3><Prose content={item.content}/></div></article>)}</div></section>;
    if(id==="field-notes") return <section className="sec" id={id}><h2>{block.title}</h2><Prose content={split.intro}/><div className="points">{split.items.map((item,i)=><article className="point" key={i}><h3>{item.title}</h3><Prose content={item.content}/></article>)}</div></section>;
    return <section className={`sec${id==="case"?" case-study":""}`} id={id}><h2>{block.title}</h2><Prose content={block.content}/></section>;
  }
  if(block._type==="cardGrid") {
    return <section className={id==="references"?"sec docmeta":"sec"} id={id}><h2>{block.title}</h2><div className={id==="references"?"refs":"products"}>{block.cards?.map((card,i)=><article className={id==="references"||!card.image?.asset?.url?"reference":"prod"} key={i}>{card.image?.asset?.url&&<figure><img src={card.image.asset.url} alt={card.image.alt||card.title||""} loading="lazy" width="220" height="190" /></figure>}<div><div className="prod-head"><h3>{card.title}</h3></div><p>{card.summary}</p>{safeHref(card.href)&&<a className="text-link" href={safeHref(card.href)}>{card.linkLabel} <span aria-hidden="true">→</span></a>}</div></article>)}</div></section>;
  }
  if(block._type==="cta") return <section className="sec editorial-cta" id={id}><h2>{block.title}</h2><p>{block.summary}</p><div className="inquiry-actions">{safeHref(block.href)&&<a href={safeHref(block.href)}>{block.label} →</a>}<a href={`tel:${publicSiteSettings.phone}`}>{publicSiteSettings.phone}</a><a href={`mailto:${publicSiteSettings.inquiryEmail}`}>{publicSiteSettings.inquiryEmail}</a></div><p className="japan-contact">{publicSiteSettings.distributorName}｜{publicSiteSettings.companyName}<br/>〒{publicSiteSettings.postalCode} {publicSiteSettings.address}</p></section>;
  return <section className="sec" id={id}><PageBlockRenderer blocks={[block]}/></section>;
}

function blockStyle(block:PageBlock):CSSProperties {
  return {fontSize:({sm:".9em",md:"1em",lg:"1.1em",xl:"1.2em"} as const)[block.fontSize??"md"],textAlign:block.alignment??"left",paddingBlock:block.spacing==="compact"?".5rem":block.spacing==="spacious"?"2rem":undefined};
}

export function LiquidCoolingEditorialPage({page}:{page:SanityPage}) {
  const design=resolveLiquidCoolingDesign(page.liquidCoolingDesign);
  const sections=solutionSections(page.blocks);
  const heroSection=sections.find(({block})=>block._type==="hero");
  const hero=heroSection?.block as HeroPageBlock|undefined;
  const summary=sections.find(({block,id})=>id==="summary"&&block._type==="richText");
  const summaryBlock=summary?.block as RichTextPageBlock|undefined;
  const summaryTail=summaryBlock?.content?.slice(1)??[];
  const structuredSummary=summaryTail.some(entry=>entry.listItem==="number");
  const summaryPoints=structuredSummary?summaryTail.filter(entry=>entry.listItem==="number"):summaryTail;
  const summaryNotes=structuredSummary?summaryTail.filter(entry=>entry.listItem!=="number"):[];
  const nav=design.navigation.filter(item=>sections.some(s=>s.id===item.anchor));
  const mainSections=sections.filter(s=>s!==heroSection&&s!==summary);
  const params=mainSections.findIndex(s=>s.id==="parameters");
  const actions=design.heroActions.filter(item=>sections.some(s=>s.id===item.anchor)).map(item=>({...item,label:hero?.ctaHref===`#${item.anchor}`&&hero.ctaLabel?hero.ctaLabel:item.label}));
  const extraHeroAction=hero?.ctaLabel&&safeHref(hero.ctaHref)&&!actions.some(item=>hero.ctaHref===`#${item.anchor}`);
  const heroStyle={textAlign:hero?.alignment??"left","--hero-scale":({sm:.85,md:1,lg:1.14,xl:1.28})[hero?.fontSize??"md"],"--hero-mobile-padding":hero?.spacing==="compact"?"1.5rem":hero?.spacing==="spacious"?"3.5rem":"2.2rem","--hero-padding":hero?.spacing==="compact"?"2rem":hero?.spacing==="spacious"?"5rem":"3.5rem"} as CSSProperties;
  return <article className="lc-editorial" style={liquidCoolingStyle(design)}>
    <div className="site-head"><div className="head-in"><a className="brand" href={`#${heroSection?.id??"overview"}`}>{design.navigationTitle}</a><nav className="head-nav" aria-label={design.tocTitle}>{nav.filter(n=>["parameters","stages","standards","instruments","faq"].includes(n.anchor)).map(item=><a key={item._key} href={`#${item.anchor}`}>{item.label}</a>)}</nav></div></div>
    <section className="lc-hero" data-color={hero?.color??"blue"} style={heroStyle} id={heroSection?.id??"overview"}><div className="hero-in"><div className="hero-eyebrow"><span/>{design.eyebrow}</div><div className="hero-grid"><div><h1 data-title-wrap={hero?.desktopTitleWrap??"wrap"}>{hero?.title??page.title}</h1><p className="deck">{hero?.summary}</p><div className="hero-meta">{design.metadata.map(item=><span key={item._key}><b>{item.label}</b> {item.value}</span>)}</div><div className="hero-cta">{actions.map(item=><a href={`#${item.anchor}`} key={item._key}>{item.label}</a>)}{extraHeroAction&&<a href={safeHref(hero.ctaHref)}>{hero.ctaLabel}</a>}</div></div><LoopDiagram diagram={design.diagram}/></div><div className="specs">{design.metrics.map(item=><div className="spec" key={item._key}><div className="k">{item.label}</div><div className="v">{item.value}<small>{item.note}</small></div></div>)}</div><p className="specs-note">{design.metricNote}</p></div></section>
    {summaryBlock&&<section className={`tldr tldr--${summaryBlock.color??"neutral"}`} style={{...blockStyle(summaryBlock),"--summary-padding":summaryBlock.spacing==="compact"?"1.25rem":summaryBlock.spacing==="spacious"?"3.5rem":"2.5rem"} as CSSProperties} id={summary!.id}><div className="tldr-in"><h2>{summaryBlock.title}</h2><p className="tldr-answer">{summaryBlock.content?.[0]&&entryText(summaryBlock.content[0])}</p><ol className="tldr-list">{summaryPoints.map((entry,i)=><li key={i}><span className="n">{String(i+1).padStart(2,"0")}</span><span>{entryText(entry)}</span></li>)}</ol>{summaryNotes.map((entry,i)=><p className="tldr-fit" key={`note-${i}`}>{entryText(entry)}</p>)}</div></section>}
    <div className="doc"><div className="doc-grid"><div className="col-main">{mainSections.map(({block,id},index)=><div key={id} className={`editorial-block editorial-block--${block.color??"neutral"}`} style={blockStyle(block)}>{index===params&&<div className="params">{design.parameters.map(item=><div className="param" key={item._key}><div className="row"><b>{item.title}</b><span>{item.topic}</span></div><div className="val">{item.value}<small>{item.note}</small></div><p>{item.summary}</p></div>)}</div>}<BodyBlock block={block} id={id} detailsLabel={design.detailsLabel}/></div>)}</div><aside className="toc" aria-label={design.tocTitle}><h2>{design.tocTitle}</h2>{nav.map(item=><a key={item._key} href={`#${item.anchor}`}>{item.label}</a>)}</aside></div></div>
  </article>;
}
