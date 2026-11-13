import Link from "next/link";
import { publicSiteSettings, resolveContactPanelStyle, type PublicSiteSettings } from "@/lib/site-settings";

export const liquidCoolingSolutionRoute = "/solutions/liquid-cooling-cleanliness-testing";

export function SolutionPromotion({ settings = publicSiteSettings }: { settings?: PublicSiteSettings }) {
  const item = settings.homeSolution;
  return (
    <section className="solution-promotion section" aria-label={item.title}>
      <div className="site-container">
        <div className={`solution-promotion__card ${resolveContactPanelStyle(item.style)}`}>
          <div>
            <p className="solution-promotion__eyebrow">{item.eyebrow}</p>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <Link className="solution-promotion__action" href={item.action.href}>{item.action.label}<span aria-hidden="true"> →</span></Link>
          </div>
          <img src={item.image.src} alt={item.image.alt} width="820" height="500" loading="lazy" />
        </div>
      </div>
    </section>
  );
}

export function RelatedSolutionLink() {
  return <aside className="related-solution"><p>液冷システムの粒子・水質管理をまとめて確認する</p><Link href={liquidCoolingSolutionRoute}>{publicSiteSettings.homeSolution.title} →</Link></aside>;
}
