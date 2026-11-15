import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { getProducts, createContentSnapshot, getAllRoutes } from "@/lib/content";
import { SolutionPromotion } from "@/components/solution-promotion";
import { localPublicSiteSettings, resolvePublicSiteSettings } from "@/lib/site-settings";
import { getLiquidCoolingSolution, localSolutionPage, solutionSections } from "@/lib/liquid-cooling";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
import type { DataTablePageBlock } from "@/lib/page-blocks";
import ProductDetailPage from "@/app/products/[category]/[slug]/page";

vi.mock("@/lib/cms-pages", () => ({ getPublishedPageForRoute: vi.fn(async () => null) }));

describe("liquid cooling release", () => {
  it("exposes all four approved routes and local sensor assets", () => {
    const sensors = getProducts("water-quality").filter(({ slug }) => slug.startsWith("bs-"));
    expect(sensors.map(({ model }) => model).toSorted()).toEqual(["BS-EC350", "BS-PHS276", "BS-TURB113"]);
    expect(getAllRoutes()).toContain("/solutions/liquid-cooling-cleanliness-testing");
    for (const product of sensors) for (const image of product.images) expect(existsSync(path.join(process.cwd(), "public", image.src))).toBe(true);
  });
  it("keeps all 6 Japan/US references and 5 measurement locations as editable table rows", () => {
    const standards = localSolutionPage.blocks.find(({ anchorId }) => anchorId === "standards-table") as DataTablePageBlock;
    const points = localSolutionPage.blocks.find(({ anchorId }) => anchorId === "measurement-points") as DataTablePageBlock;
    expect(standards.rows).toHaveLength(6);
    expect(points.rows).toHaveLength(5);
  });
  it("uses a published CMS solution in preference to bundled copy", async () => {
    const page = { ...localSolutionPage, title: "更新された液冷ソリューション" };
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce(page);
    expect((await getLiquidCoolingSolution()).title).toBe(page.title);
    expect((await getLiquidCoolingSolution()).title).toBe(localSolutionPage.title);
  });
  it("applies CMS product titles, specifications and body to the new sensors", () => {
    const snapshot = createContentSnapshot({ sanityConfigured: true, sanityNews: [], sanityProducts: [{
      _id: "product--water-quality--bs-phs276", category: "water-quality", model: "BS-PHS276", slug: "bs-phs276", title: "編集したpHセンサー", summary: "后台で変更した日文説明です。", body: [{ _type: "block", style: "normal", children: [{ text: "公開された計測内容です。" }] }], features: [], applications: [], specifications: [{ label: "電源", value: "9～36 VDC" }], seoTitle: "pHセンサーの製品情報", seoDescription: "日文の製品情報です。",
    }] });
    const product = snapshot.products.find(({ slug }) => slug === "bs-phs276");
    expect(product?.title).toBe("編集したpHセンサー");
    expect(product?.sections[0].paragraphs).toContain("公開された計測内容です。");
    expect(product?.specifications).toEqual([{ label: "電源", value: "9～36 VDC" }]);
  });
  it("renders the CMS promotion text, image and style", () => {
    const settings = resolvePublicSiteSettings({ homeSolution: { title: "液冷管理のご案内", summary: "計測についての最新情報です。", image: { alt: "編集したシステム図", asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/example.svg" } }, action: { label: "詳細を確認", href: "/solutions/liquid-cooling-cleanliness-testing" }, style: { color: "light", fontSize: "lg", fontFamily: "sans" } } });
    const html = renderToStaticMarkup(<SolutionPromotion settings={settings} />);
    expect(html).toContain("液冷管理のご案内"); expect(html).toContain("編集したシステム図"); expect(html).toContain("contact-card--size-lg");
    expect(localPublicSiteSettings.phone).toBe("080-5189-8663");
  });
  it("normalizes duplicate or unsafe chapter anchors for working table-of-contents links", () => {
    const sections = solutionSections([{ _type: "richText", anchorId: "same" }, { _type: "richText", anchorId: "same" }, { _type: "richText", anchorId: "bad value" }]);
    expect(sections.map(({ id }) => id)).toEqual(["same", "same-next", "section-3"]);
  });
  it("renders sensor dimension images from the editable gallery", async () => {
    const html = renderToStaticMarkup(await ProductDetailPage({ params: Promise.resolve({ category: "water-quality", slug: "bs-phs276" }) }));
    expect(html).toContain("bs-phs276-dimensions.jpg");
    expect(html).toContain("BS-PHS276の外形寸法図");
  });
});
