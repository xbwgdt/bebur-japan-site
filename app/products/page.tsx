import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ProductExplorer } from "@/components/product-explorer";
import { getProducts } from "@/lib/content";
import { canonicalUrl } from "@/lib/routes";

export const metadata: Metadata = {
  title: "製品情報",
  description:
    "清浄度測定、薬注制御、水質分析、ガス検知、流量・液位測定の5カテゴリーからBebur製品を検索できます。",
  alternates: {
    canonical: canonicalUrl("/products"),
  },
};

export default function ProductsPage(): React.ReactElement {
  const products = getProducts();

  return (
    <>
      <header className="page-hero page-hero--compact">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "製品情報" }]} />
          <p className="page-hero__eyebrow">PRODUCTS</p>
          <h1>製品情報</h1>
          <p>
            清浄度測定、薬注制御、水質分析、ガス検知、流量・液位測定の5つの製品群から、測定対象や型式で製品をお探しいただけます。
          </p>
        </div>
      </header>

      <section className="section product-index">
        <div className="site-container">
          <ProductExplorer products={products} />
        </div>
      </section>

      <section className="section page-contact">
        <div className="site-container">
          <ContactCta compact subject="Bebur 製品選定" />
        </div>
      </section>
    </>
  );
}
