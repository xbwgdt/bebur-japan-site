import { Mail, Phone } from "lucide-react";
import type React from "react";

import { buildMailto } from "@/lib/constants";
import {
  publicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

type ContactCtaProps = {
  subject?: string;
  compact?: boolean;
  settings?: PublicSiteSettings;
};

export function ContactCta({
  subject = "Bebur 製品",
  compact = false,
  settings = publicSiteSettings,
}: ContactCtaProps): React.ReactElement {
  return (
    <section
      className={`contact-cta${compact ? " contact-cta--compact" : ""}`}
      aria-labelledby={compact ? undefined : "contact-cta-title"}
    >
      <div className="contact-cta__content">
        <p className="contact-cta__eyebrow">CONTACT</p>
        <h2 id={compact ? undefined : "contact-cta-title"}>
          製品について相談する
        </h2>
        {!compact && (
          <p>
            製品選定、仕様の確認、お見積もりまで、Bebur
            日本総代理店の担当者がご相談を承ります。
          </p>
        )}
      </div>
      <div className="contact-cta__actions">
        <a className="button button--light" href={`tel:${settings.phone}`}>
          <Phone aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>電話で相談</span>
        </a>
        <a
          className="button button--accent"
          href={buildMailto(subject, settings.inquiryEmail)}
        >
          <Mail aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>メールで問い合わせ</span>
        </a>
      </div>
    </section>
  );
}

export function MobileContactBar({
  settings = publicSiteSettings,
}: {
  settings?: PublicSiteSettings;
} = {}): React.ReactElement {
  return (
    <aside className="mobile-contact-bar" aria-label="お問い合わせショートカット">
      <a href={`tel:${settings.phone}`}>
        <Phone aria-hidden="true" size={20} strokeWidth={1.8} />
        <span>電話で相談</span>
      </a>
      <a href={buildMailto("Bebur 製品", settings.inquiryEmail)}>
        <Mail aria-hidden="true" size={20} strokeWidth={1.8} />
        <span>メールで問い合わせ</span>
      </a>
    </aside>
  );
}
