import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactPagePanels } from "@/components/contact-page-panels";
import { PageBlockRenderer } from "@/components/page-block-renderer";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { canonicalUrl } from "@/lib/routes";
import { getPublishedPageForRoute } from "@/lib/cms-pages";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Bebur製品に関する日本国内のお問い合わせ先です。",
  alternates: {
    canonical: canonicalUrl("/contact"),
  },
};

export default async function ContactPage(): Promise<React.ReactElement> {
  const cmsPage = await getPublishedPageForRoute("contact");

  if (cmsPage) {
    return (
      <SourceShell>
        <main className="section source-section site-container">
          <PageBlockRenderer blocks={cmsPage.blocks} />
          <ContactPagePanels />
        </main>
      </SourceShell>
    );
  }

  return (
    <SourceShell>
      <SourceHero
        eyebrow="CONTACT"
        image="/source-media/1761894549371214-8c42894cc39f462b.jpg"
        summary="日本国内の製品選定、仕様確認、お見積もり、アフターサービスのご相談を承ります。"
        title="お問い合わせ"
      />

      <div className="source-breadcrumb-band">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "お問い合わせ" }]} />
        </div>
      </div>

      <section className="section source-section contact-page">
        <div className="site-container">
          <ContactPagePanels />
        </div>
      </section>
    </SourceShell>
  );
}
