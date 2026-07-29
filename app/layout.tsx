import type { Metadata } from "next";

import "./globals.css";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: "Bebur Japan | 水質分析機器",
    template: "%s | Bebur Japan",
  },
  description:
    "Bebur Japanは、水質分析機器の製品情報と導入に関するお問い合わせを承ります。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
