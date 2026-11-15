import Link from "next/link";
import type { CSSProperties } from "react";
import { LoopDiagram } from "./liquid-cooling/loop-diagram";
import { publicSiteSettings, resolveContactPanelStyle, type PublicSiteSettings } from "@/lib/site-settings";

export const liquidCoolingSolutionRoute = "/solutions/liquid-cooling-cleanliness-testing";

export function SolutionPromotion({ settings = publicSiteSettings, animated = false }: { settings?: PublicSiteSettings; animated?: boolean }) {
  const item = settings.homeSolution;
  const diagramStyle = {
    ...Object.fromEntries(Object.entries(item.diagramColors).map(([key, value]) => [`--home-diagram-${key}`, value])),
    "--flow-duration": `${item.diagram.speed}s`,
  } as CSSProperties;
  const image = animated && item.diagram.image.asset.url
    ? { src: item.diagram.image.asset.url, alt: item.diagram.image.alt }
    : item.image;
  return (
    <section className={`solution-promotion section${animated ? " solution-promotion--animated" : ""}`} aria-label={item.title}>
      <div className="site-container">
        <div className={`solution-promotion__card ${resolveContactPanelStyle(item.style)}`}>
          <div>
            <p className="solution-promotion__eyebrow">{item.eyebrow}</p>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <Link className="solution-promotion__action" href={item.action.href}>{item.action.label}<span aria-hidden="true"> →</span></Link>
          </div>
          {animated && item.diagram.mode === "animation" ? (
            <div className="solution-promotion__diagram lc-editorial" style={diagramStyle}>
              <LoopDiagram diagram={item.diagram} compact />
            </div>
          ) : <img src={image.src} alt={image.alt} width="820" height="500" loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

export function RelatedSolutionLink() {
  return <aside className="related-solution"><p>液冷システムの粒子・水質管理をまとめて確認する</p><Link href={liquidCoolingSolutionRoute}>{publicSiteSettings.homeSolution.title} →</Link></aside>;
}
