import { Mail, Phone } from "lucide-react";

import { buildMailto } from "@/lib/constants";
import {
  publicSiteSettings,
  resolveContactPanelStyle,
} from "@/lib/site-settings";

export function ContactPagePanels(): React.ReactElement {
  const { contactPage } = publicSiteSettings;
  const inquiryMailto = buildMailto(
    "Bebur 製品",
    publicSiteSettings.inquiryEmail,
  );

  return (
    <div className="contact-page__grid">
      <article
        className={`contact-panel surface ${resolveContactPanelStyle(contactPage.panel.style)}`}
        aria-labelledby="contact-company-title"
      >
        <p className="contact-panel__label">{contactPage.panel.label}</p>
        <h2 id="contact-company-title">{publicSiteSettings.companyName}</h2>
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
          {contactPage.panel.description}
        </p>
        <div className="contact-panel__actions">
          <a className="button button--primary" href={`tel:${publicSiteSettings.phone}`}>
            {contactPage.panel.phoneActionLabel}
          </a>
          <a className="button button--secondary" href={inquiryMailto}>
            {contactPage.panel.emailActionLabel}
          </a>
        </div>
      </article>

      <section
        className={`inquiry-guide ${resolveContactPanelStyle(contactPage.guide.style)}`}
        aria-labelledby="inquiry-guide-title"
      >
        <p className="inquiry-guide__eyebrow">{contactPage.guide.eyebrow}</p>
        <h2 id="inquiry-guide-title">{contactPage.guide.title}</h2>
        <ol>
          {contactPage.guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <a className="inquiry-guide__link" href={inquiryMailto}>
          {contactPage.guide.linkLabel}
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
