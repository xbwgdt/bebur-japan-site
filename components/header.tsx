import Link from "next/link";

import {
  publicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

function navigationItems(settings: PublicSiteSettings) {
  const labels = settings.navigationLabels;

  return [
    { href: "/", label: labels.home },
    { href: "/about/company-profile", label: labels.company },
    { href: "/products", label: labels.products },
    { href: "/applications", label: labels.applications },
    { href: "/insights", label: labels.news },
    { href: "/contact", label: labels.contact },
  ];
}

function NavigationLinks({
  settings,
  mobile = false,
}: {
  settings: PublicSiteSettings;
  mobile?: boolean;
}) {
  return (
    <ul className={mobile ? "mobile-nav__list" : "desktop-nav__list"}>
      {navigationItems(settings).map((item) => (
        <li key={item.href}>
          <Link href={item.href}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

export function Header({
  settings = publicSiteSettings,
}: {
  settings?: PublicSiteSettings;
} = {}): React.ReactElement {
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
              {settings.footerText}
            </p>
          </div>

          <nav className="desktop-nav" aria-label="メインナビゲーション">
            <NavigationLinks settings={settings} />
          </nav>

          <details className="mobile-nav">
            <summary>メニュー</summary>
            <div className="mobile-nav__panel">
              <nav aria-label="モバイルナビゲーション">
                <NavigationLinks mobile settings={settings} />
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
