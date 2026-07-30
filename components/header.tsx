import Link from "next/link";

import { siteConfig } from "@/lib/constants";

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/about/company-profile", label: "企業情報" },
  { href: "/products", label: "製品情報" },
  { href: "/applications", label: "導入分野・事例" },
  { href: "/insights", label: "ニュース・技術情報" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <ul className={mobile ? "mobile-nav__list" : "desktop-nav__list"}>
      {navigationItems.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Header(): React.ReactElement {
  return (
    <header
      className="site-header source-header"
      data-testid="source-header"
    >
      <div className="site-header__main">
        <div className="site-container site-header__inner">
          <div className="site-header__brand">
            <Link className="wordmark" href="/" aria-label="BEBUR JAPAN">
              <span className="wordmark__name">Bebur</span>
              <span className="wordmark__region">JAPAN</span>
            </Link>
            <p className="site-header__distributor">
              {siteConfig.distributorLabel}
            </p>
          </div>

          <nav className="desktop-nav" aria-label="メインナビゲーション">
            <NavigationLinks />
          </nav>

          <details className="mobile-nav">
            <summary>メニュー</summary>
            <div className="mobile-nav__panel">
              <nav aria-label="モバイルナビゲーション">
                <NavigationLinks mobile />
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
