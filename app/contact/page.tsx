import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { buildMailto, siteConfig } from "@/lib/constants";
import { canonicalUrl } from "@/lib/routes";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Bebur製品に関する日本国内のお問い合わせ先です。",
  alternates: {
    canonical: canonicalUrl("/contact"),
  },
};

const inquiryMailto = buildMailto("Bebur 製品");

export default function ContactPage(): React.ReactElement {
  return (
    <>
      <header className="page-hero contact-hero">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "お問い合わせ" }]} />
          <p className="page-hero__eyebrow">CONTACT</p>
          <h1>お問い合わせ</h1>
          <p>
            日本国内の製品選定、仕様確認、お見積もり、アフターサービスのご相談を承ります。
          </p>
        </div>
      </header>

      <section className="section contact-page">
        <div className="site-container contact-page__grid">
          <article
            className="contact-panel surface"
            aria-labelledby="contact-company-title"
          >
            <p className="contact-panel__label">Bebur 日本総代理店</p>
            <h2 id="contact-company-title">{siteConfig.company}</h2>
            <address>
              <span>{siteConfig.postalCode}</span>
              <span>{siteConfig.address}</span>
              <a href={`tel:${siteConfig.phone}`}>
                <Phone aria-hidden="true" size={20} strokeWidth={1.8} />
                {siteConfig.phone}
              </a>
              <a href={inquiryMailto}>
                <Mail aria-hidden="true" size={20} strokeWidth={1.8} />
                {siteConfig.email}
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
                オンライン留言（メール）
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
    </>
  );
}
