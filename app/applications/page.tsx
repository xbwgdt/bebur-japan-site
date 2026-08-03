import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationCard } from "@/components/application-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { SectionHeading } from "@/components/section-heading";
import { getApplications, getStaticPages } from "@/lib/content";
import { canonicalUrl } from "@/lib/routes";
import { applicationCaseSlugs } from "./cases/page";

const pageContent = getStaticPages().find(
  ({ route }) => route === "/applications",
);

export const metadata: Metadata = {
  title: "産業別用途・導入事例",
  description:
    pageContent?.description ??
    "Bebur製品の産業別ソリューションと導入事例をご紹介します。",
  alternates: {
    canonical: canonicalUrl("/applications"),
  },
};

const industries = [
  {
    label: "液冷",
    description: "冷却液の水質と粒子清浄度",
    target: "liquid-cooling-industry",
  },
  {
    label: "上下水道・水処理",
    description: "水源から給水末端までの連続監視",
    target: "municipal-water-treatment",
  },
  {
    label: "化学",
    description: "工程水質とガス漏えいの監視",
    target: "chemical-industry",
  },
  {
    label: "医療・製薬",
    description: "水質と不溶性微粒子の管理",
    target: "medical-pharmaceutical",
  },
  {
    label: "油圧",
    description: "作動油の粒子清浄度管理",
    target: "hydraulic-industry",
  },
  {
    label: "環境",
    description: "水質・ガス・悪臭のオンライン監視",
    target: "environmental-protection",
  },
  {
    label: "食品・飲料",
    description: "消毒工程と水質の確認",
    target: "food-industry",
  },
  {
    label: "電力",
    description: "水処理、凝集、ガス、清浄度管理",
    target: "electric-power-industry",
  },
] as const;

const caseSlugSet = new Set<string>(applicationCaseSlugs);

export default async function ApplicationsPage(): Promise<React.ReactElement> {
  const applications = getApplications();
  const overviewApplications = applications.filter(
    ({ slug }) => !caseSlugSet.has(slug),
  );
  const caseApplications = applications.filter(({ slug }) =>
    caseSlugSet.has(slug),
  );

  return (
    <>
      <header className="page-hero">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "産業別用途・導入事例" }]} />
          <p className="page-hero__eyebrow">APPLICATIONS</p>
          <h1>産業別用途・導入事例</h1>
          <p>
            製品は、測定課題と現場条件に応じて選定します。対象物、測定範囲、設置環境、連続監視の要否から、適した計測構成をご確認ください。
          </p>
        </div>
      </header>

      <section className="section application-industries">
        <div className="site-container">
          <SectionHeading
            eyebrow="INDUSTRIES"
            title="測定分野から探す"
            description="8つの産業分野から、関連するソリューションへ移動できます。"
          />
          <nav aria-label="産業分野">
            <ul className="industry-anchor-grid">
              {industries.map((industry, index) => (
                <li key={industry.label}>
                  <a href={`#${industry.target}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{industry.label}</strong>
                    <small>{industry.description}</small>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section
        className="section application-group application-group--overview"
        aria-labelledby="application-overview-title"
      >
        <div className="site-container">
          <SectionHeading
            eyebrow="SOLUTIONS"
            title="産業別用途"
            titleId="application-overview-title"
            description="業界ごとの測定課題と、関連する水質・ガス・清浄度・薬注制御の構成をご紹介します。"
          />
          <div className="application-grid">
            {overviewApplications.map((application) => (
              <div id={application.slug} key={application.slug}>
                <ApplicationCard application={application} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section application-group"
        aria-labelledby="application-cases-title"
      >
        <div className="site-container">
          <div className="application-group__heading">
            <SectionHeading
              eyebrow="CASES"
              title="導入事例"
              titleId="application-cases-title"
              description="設備、組織、機器の導入・適用事例をご紹介します。"
            />
            <Link className="button button--secondary" href="/applications/cases">
              導入事例一覧を見る
            </Link>
          </div>
          <div className="application-grid">
            {caseApplications.map((application) => (
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
          <ContactCta compact subject="産業別用途・導入事例" />
        </div>
      </section>
    </>
  );
}
