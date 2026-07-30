import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { SourceShell } from "@/components/source-faithful/source-shell";
import { buildMailto } from "@/lib/constants";
import { canonicalUrl } from "@/lib/routes";
import { publicSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Bebur製品に関する日本国内のお問い合わせ先です。",
  alternates: {
    canonical: canonicalUrl("/contact"),
  },
};

const inquiryMailto = buildMailto(
  "Bebur 製品",
  publicSiteSettings.inquiryEmail,
);

export default function ContactPage(): React.ReactElement {
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
        <div className="site-container contact-page__grid">
          <article
            className="contact-panel surface"
            aria-labelledby="contact-company-title"
          >
            <p className="contact-panel__label">
              {publicSiteSettings.distributorName}
            </p>
            <h2 id="contact-company-title">
              {publicSiteSettings.companyName}
            </h2>
            <address>
              <span>〒{publicSiteSettings.postalCode}</span>
              <span>{publicSiteSettings.address}</span>
              <a href={`tel:${publicSiteSettings.phone}`}>
                <Phone aria-hidden="true" size={20} strokeWidth={1.8} />
                {publicSiteSettings.phone}
              </a>
              <a href={inquiryMailto}>
                <Mail aria-hidden="true" size={20} strokeWidth={1.8} />
                {publicSiteSettings.inquiryEmail}
              </a>
            </address>
            <p className="contact-panel__description">
              新樹産業株式会社が、日本国内の製品選定、仕様、お見積もり、アフターサービスに関するご相談を承ります。
            </p>
            <div className="contact-panel__actions">
              <a className="button button--primary" href={inquiryMailto}>
                オンライン相談（メール）
              </a>
              <a className="button button--secondary" href={inquiryMailto}>
                メールでお問い合わせ
              </a>
            </div>
          </article>

          <section
            className="inquiry-guide"
            aria-labelledby="inquiry-guide-title"
          >
            <p className="inquiry-guide__eyebrow">INQUIRY GUIDE</p>
            <h2 id="inquiry-guide-title">お問い合わせの流れ</h2>
            <ol>
              <li>製品・用途を確認</li>
              <li>電話またはメールで相談</li>
              <li>仕様・見積もりをご案内</li>
            </ol>
            <a className="inquiry-guide__link" href={inquiryMailto}>
              メールで問い合わせ
              <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>
      </section>
    </SourceShell>
  );
}
