import type { Metadata } from "next";

import "./globals.css";
import { MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteConfig } from "@/lib/constants";
import {
  publicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

function socialImage(settings: PublicSiteSettings) {
  const image = {
    url: settings.defaultOgImage.src,
    alt: settings.defaultOgImage.alt,
  };

  return settings.defaultOgImage.src === "/opengraph-image"
    ? { ...image, width: 1200, height: 630 }
    : image;
}

export function buildRootMetadata(
  settings: PublicSiteSettings,
): Metadata {
  const image = socialImage(settings);

  return {
    metadataBase: new URL(siteConfig.origin),
    title: {
      default: settings.defaultSeoTitle,
      template: "%s｜Bebur Japan",
    },
    description: settings.defaultSeoDescription,
    openGraph: {
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      url: siteConfig.origin,
      siteName: siteConfig.name,
      locale: "ja_JP",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      images: [image],
    },
  };
}

export const metadata = buildRootMetadata(publicSiteSettings);

export function buildOrganizationJsonLd(settings: PublicSiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    alternateName: settings.distributorName,
    description: settings.distributorName,
    url: siteConfig.origin,
    email: settings.inquiryEmail,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      postalCode: settings.postalCode,
      addressRegion: "埼玉県",
      addressLocality: "草加市",
      streetAddress: "草加2－13－21－7",
      addressCountry: "JP",
    },
  } as const;
}

export const organizationJsonLd =
  buildOrganizationJsonLd(publicSiteSettings);

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
        <Header settings={publicSiteSettings} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer settings={publicSiteSettings} />
        <MobileContactBar settings={publicSiteSettings} />
      </body>
    </html>
  );
}
