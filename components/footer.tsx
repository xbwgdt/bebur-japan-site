import Link from "next/link";

import { siteConfig } from "@/lib/constants";

const defaultInquiryHref =
  "mailto:info@newtree-i.com?subject=Bebur%20%E8%A3%BD%E5%93%81%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B";

const footerGroups = [
  {
    title: "クイックリンク",
    links: [
      { href: "/about/company-profile", label: "企業情報" },
      { href: "/products", label: "製品一覧" },
      { href: "/applications", label: "導入分野・事例" },
      { href: "/insights", label: "ニュース・技術情報" },
      { href: "/contact", label: "お問い合わせ" },
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
] as const;

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="site-footer source-footer"
      data-testid="source-footer"
    >
      <div className="site-container site-footer__grid">
        <nav className="site-footer__navigation" aria-label="フッターナビゲーション">
          {footerGroups.map((group) => (
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
            {siteConfig.distributorLabel}
          </p>
          <address className="site-footer__address">
            <span>{siteConfig.postalCode}</span>
            <span>{siteConfig.address}</span>
            <a href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a>
            <a href={defaultInquiryHref}>{siteConfig.email}</a>
          </address>
        </div>
      </div>

      <div className="site-footer__legal">
        <div className="site-container">
          <small>
            © {currentYear} {siteConfig.company}. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
}
