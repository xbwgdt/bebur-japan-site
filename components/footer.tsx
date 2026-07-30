import Link from "next/link";

import {
  publicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

function footerGroups(settings: PublicSiteSettings) {
  return [
    {
      title: "クイックリンク",
      links: [
        {
          href: "/about/company-profile",
          label: settings.navigationLabels.company,
        },
        { href: "/products", label: settings.navigationLabels.products },
        {
          href: "/applications",
          label: settings.navigationLabels.applications,
        },
        { href: "/insights", label: settings.navigationLabels.news },
        { href: "/contact", label: settings.navigationLabels.contact },
      ],
    },
    {
      title: "製品情報",
      links: [
        { href: "/products/cleanliness", label: "清浄度測定装置" },
        { href: "/products/dosing", label: "薬注制御装置" },
        { href: "/products/water-quality", label: "水質分析計" },
        { href: "/products/gas-detection", label: "ガス検知器" },
        { href: "/products/flow-level", label: "流量計・液位計" },
      ],
    },
  ];
}

export function Footer({
  settings = publicSiteSettings,
}: {
  settings?: PublicSiteSettings;
} = {}): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const inquiryHref = `mailto:${settings.inquiryEmail}?subject=${encodeURIComponent("Bebur 製品お問い合わせ")}`;

  return (
    <footer
      className="site-footer source-footer"
      data-testid="source-footer"
    >
      <div className="site-container site-footer__grid">
        <nav className="site-footer__navigation" aria-label="フッターナビゲーション">
          {footerGroups(settings).map((group) => (
            <div className="site-footer__group" key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="site-footer__identity">
          <Link
            className="wordmark wordmark--footer"
            href="/"
            aria-label="BEBUR JAPAN"
          >
            <span className="wordmark__name">Bebur</span>
            <span className="wordmark__region">JAPAN</span>
          </Link>
          <p className="site-footer__distributor">
            {settings.footerText}
          </p>
          <address className="site-footer__address">
            <span>〒{settings.postalCode}</span>
            <span>{settings.address}</span>
            <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            <a href={inquiryHref}>{settings.inquiryEmail}</a>
          </address>
        </div>
      </div>

      <div className="site-footer__legal">
        <div className="site-container">
          <small>
            © {currentYear} {settings.companyName}. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
}
