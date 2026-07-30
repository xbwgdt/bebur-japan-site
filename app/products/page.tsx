import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta } from "@/components/contact-cta";
import { ProductExplorer } from "@/components/product-explorer";
import { SourceCardGrid } from "@/components/source-faithful/source-card-grid";
import { SourceHero } from "@/components/source-faithful/source-hero";
import { SourceShell } from "@/components/source-faithful/source-shell";
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
    <SourceShell>
      <SourceHero
        eyebrow="PRODUCTS"
        image="/source-media/1762147356906250-b3ac3b47b4049a96.jpg"
        summary="清浄度測定、薬注制御、水質分析、ガス検知、流量・液位測定の5つの製品群からお選びいただけます。"
        title="製品情報"
      />

      <div className="source-breadcrumb-band">
        <div className="site-container">
          <Breadcrumbs items={[{ label: "製品情報" }]} />
        </div>
      </div>

      <section className="section source-section product-index">
        <div className="site-container">
          <SourceCardGrid
            ariaLabel="製品一覧"
            variant="products"
            cards={
              <div className="source-card-grid__catalog">
                <ProductExplorer products={products} />
              </div>
            }
          />
        </div>
      </section>

      <section className="section source-section page-contact">
        <div className="site-container">
          <ContactCta compact subject="Bebur 製品選定" />
        </div>
      </section>
    </SourceShell>
  );
}
