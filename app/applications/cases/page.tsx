import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationCard } from "@/components/application-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
import { resolveCategoryHero } from "@/lib/page-enhancements";
import { getApplications, getStaticPages } from "@/lib/content";
import { canonicalUrl } from "@/lib/routes";

export const applicationCaseSlugs = [
  "liquid-cooling-cases",
  "plate-heat-exchanger-cleanliness",
  "manifold-cleanliness",
  "bt8200-cold-plate-liquid-cooling",
  "bt8200-liquid-cooling",
  "liquid-cooled-plate-cleanliness",
  "municipal-water-cases",
  "online-disinfectant-analyzer-waterworks",
  "bt8200-jiangnan-water-plant",
  "scm520-waterworks",
  "chemical-cases",
  "msf8100-metallurgical-industry",
  "medical-pharmaceutical-cases",
  "liquid-particle-counter-pharmaceutical",
  "hydraulic-cases",
  "environmental-protection-cases",
  "gt-3280-ou-landfill",
  "food-beverage-cases",
  "water-ozone-analyzer-beverage",
  "power-industry-cases",
  "scm530-power-plant-dosing",
  "scm530-jiangsu-power-plant",
] as const;

const pageContent = getStaticPages().find(
  ({ route }) => route === "/applications/cases",
);
const caseSlugSet = new Set<string>(applicationCaseSlugs);
const pageDescription =
  pageContent?.description ??
  "Bebur製品の産業別の導入・適用事例をご紹介します。";

export const metadata: Metadata = {
  title: pageContent?.title ?? "導入事例",
  description: pageDescription,
  alternates: {
    canonical: canonicalUrl("/applications/cases"),
  },
};

export default async function ApplicationCasesPage(): Promise<React.ReactElement> {
  const page = await getPublishedPageForRoute("application-case-index");
  const hero = resolveCategoryHero("application-case-index", page?.categoryHero)!;
  const cases = getApplications().filter(({ slug }) =>
    caseSlugSet.has(slug),
  );

  return (
    <SourceShell>
      <SourceHero
        className={`category-banner category-banner--${hero.color} category-banner--${hero.fontFamily} category-banner--${hero.fontSize}`}
        image={resolveSourceMediaPath(hero.image.src)} imageAlt={hero.image.alt}
        eyebrow={hero.eyebrow} title={hero.title} summary={hero.summary}
        actions={<>
          <Link className="button button--secondary" href="/applications">産業別用途へ戻る</Link>
          <Link className="button button--primary" href="/products">関連する製品情報を見る</Link>
        </>}
      />
      <div className="source-breadcrumb-band">
        <div className="site-container">
          <Breadcrumbs
            items={[
              { label: "産業別用途・導入事例", href: "/applications" },
              { label: "導入事例" },
            ]}
          />
        </div>
      </div>

      <section className="section application-group application-group--overview">
        <div className="site-container">
          <div className="application-grid">
            {cases.map((application) => (
              <ApplicationCard
                application={application}
                key={application.slug}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject="Bebur 導入事例" />
        </div>
      </section>
    </SourceShell>
  );
}
