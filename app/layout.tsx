import type { Metadata } from "next";

import "./globals.css";
import { MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: "Bebur Japan｜水質分析・ガス検知の精密計測",
    template: "%s｜Bebur Japan",
  },
  description:
    "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
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
