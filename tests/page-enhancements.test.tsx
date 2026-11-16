// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ProductCategoryPage from "@/app/products/[category]/page";
import ApplicationDetailPage from "@/app/applications/[slug]/page";
import { resolveApplicationProducts, resolveCategoryHero } from "@/lib/page-enhancements";

const getPageBySlug = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sanity/queries", async original => ({
  ...(await original<typeof import("@/lib/sanity/queries")>()), getPageBySlug,
}));
afterEach(() => { cleanup(); getPageBySlug.mockReset(); });

describe("approved dosing hero and chemical product links", () => {
  it("shows the manufacturer banner without losing seven products or search", async () => {
    getPageBySlug.mockResolvedValue(null);
    const { container } = render(await ProductCategoryPage({params:Promise.resolve({category:"dosing"})}));
    expect(container.querySelector(".category-banner img")?.getAttribute("src")).toContain("1762147356906250");
    expect(screen.getByRole("heading",{name:"薬注制御装置",level:1})).toBeTruthy();
    expect(container.querySelectorAll(".product-card")).toHaveLength(7);
    expect(screen.getByRole("searchbox")).toBeTruthy();
  });
  it("connects chemical monitoring to eight products in two groups", async () => {
    getPageBySlug.mockResolvedValue(null);
    const { container } = render(await ApplicationDetailPage({params:Promise.resolve({slug:"chemical-industry"})}));
    expect(container.querySelectorAll(".application-products .product-card")).toHaveLength(8);
    expect(screen.getByRole("heading",{name:"ガス検知・臭気監視",level:3})).toBeTruthy();
    expect(screen.getByRole("heading",{name:"プロセス水・排水の水質監視",level:3})).toBeTruthy();
    for(const href of ["/products/gas-detection","/products/water-quality"]) expect(container.querySelector(`.application-products a[href="${href}"]`)).toBeTruthy();
    expect(container.querySelector('a[href="tel:08051898663"]') ?? container.querySelector('a[href="tel:080-5189-8663"]')).toBeTruthy();
  });
  it("reads only dedicated fields and preserves the canonical design", async () => {
    getPageBySlug.mockResolvedValue({_id:"page--dosing",slug:"dosing",blocks:[{_type:"richText",title:"Legacy replacement"}],categoryHero:{title:"薬注の自動制御",summary:"工程に合わせた薬注制御をご提案します。",image:{asset:{url:"https://cdn.sanity.io/images/gbzt89e5/production/reviewed.jpg"},alt:"水処理のイメージ"},fontFamily:"serif",color:"light"}});
    const {container} = render(await ProductCategoryPage({params:Promise.resolve({category:"dosing"})}));
    expect(screen.getByRole("heading",{name:"薬注の自動制御",level:1})).toBeTruthy();
    expect(container.querySelector(".category-banner--light.category-banner--serif")).toBeTruthy();
    expect(container.querySelector(".category-banner img")?.getAttribute("src")).toContain("reviewed.jpg");
    expect(screen.queryByText("Legacy replacement")).toBeNull();
  });
  it("rejects unsafe hero values without losing the reviewed fallback", () => {
    const fallback=resolveCategoryHero("dosing")!;
    expect(resolveCategoryHero("cleanliness")).toBeUndefined();
    expect(resolveCategoryHero("dosing",{title:"<script>",fontSize:"999px",color:"red",image:{asset:{url:"https://evil.test/image.jpg"}}})).toEqual(fallback);
  });
  it("honors CMS group ordering and explicit removal, but skips unknown or mismatched products", async () => {
    const fallback=resolveApplicationProducts("chemical-industry")!;
    const selection={...fallback,groups:[{...fallback.groups[1],productSlugs:["bt6308-do","missing","as-300-toxic","bt6308-do","bt6308-ph"]}]};
    getPageBySlug.mockResolvedValue({blocks:[{_type:"hero"}],applicationProducts:selection});
    const {container}=render(await ApplicationDetailPage({params:Promise.resolve({slug:"chemical-industry"})}));
    expect([...container.querySelectorAll(".application-products .product-card h3")].map(node=>node.textContent)).toEqual(["BT6308-DO オンライン溶存酸素分析計","BT6308-pH オンラインpH分析計"]);
    expect(resolveApplicationProducts("chemical-industry",{groups:[]})?.groups).toEqual([]);
    expect(resolveApplicationProducts("chemical-industry",{groups:[null]})?.groups).toEqual(fallback.groups);
    expect(resolveApplicationProducts("chemical-industry",{groups:[{category:"gas-detection",productSlugs:[null]}]})?.groups).toEqual(fallback.groups);
    expect(resolveApplicationProducts("food-industry")).toBeUndefined();
  });
  it("keeps reviewed product cards when a nonempty CMS selection has no usable products", async () => {
    getPageBySlug.mockResolvedValue({blocks:[{_type:"hero"}],applicationProducts:{groups:[{category:"gas-detection",productSlugs:["unknown-model","bt6308-ph"]}]}});
    const {container}=render(await ApplicationDetailPage({params:Promise.resolve({slug:"chemical-industry"})}));
    expect(container.querySelectorAll(".application-products .product-card")).toHaveLength(8);
  });
});
