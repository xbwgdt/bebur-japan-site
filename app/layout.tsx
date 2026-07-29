import type { Metadata } from "next";

import "./globals.css";
import { MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteConfig } from "@/lib/constants";

const defaultTitle = "Bebur Japan｜水質分析・ガス検知の精密計測";
const defaultDescription =
  "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。";
const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: defaultTitle,
    template: "%s｜Bebur Japan",
  },
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: siteConfig.origin,
    siteName: siteConfig.name,
    locale: "ja_JP",
    type: "website",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [socialImage],
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.company,
  alternateName: "Bebur 日本総代理店",
  description: "Bebur 日本総代理店",
  url: siteConfig.origin,
  email: siteConfig.email,
  telephone: siteConfig.phone,
  address: {
    "@type": "PostalAddress",
    postalCode: siteConfig.postalCode.replace("〒", ""),
    addressRegion: "埼玉県",
    addressLocality: "草加市",
    streetAddress: "草加2－13－21－7",
    addressCountry: "JP",
  },
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serializedOrganization = JSON.stringify(organizationJsonLd).replace(
    /</g,
    "\\u003c",
  );

  return (
    <html lang="ja">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: serializedOrganization }}
          type="application/ld+json"
        />
        <a className="skip-link" href="#main-content">
          本文へ移動
        </a>
        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <MobileContactBar />
      </body>
    </html>
  );
}
