// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,render} from "@testing-library/react";
import ApplicationDetailPage from "@/app/applications/[slug]/page";
import {getApplication,getProducts} from "@/lib/content";
import {resolveApplicationProducts} from "@/lib/page-enhancements";

const getPageBySlug=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/sanity/queries",async original=>({...await original<typeof import("@/lib/sanity/queries")>(),getPageBySlug}));
afterEach(()=>{cleanup();getPageBySlug.mockReset();});
const counts={"electric-power-industry":17,"environmental-protection":12,"municipal-water-treatment":23,"liquid-cooling-industry":9,"industry-solutions":4,"plate-heat-exchanger-cleanliness":3,"manifold-cleanliness":3,"online-disinfectant-analyzer-waterworks":3};

describe("approved eight industry product pages",()=>{
  it.each(Object.entries(counts))("connects %s to %i products without replacing the canonical page",async(slug,count)=>{
    getPageBySlug.mockResolvedValue(null);
    const {container}=render(await ApplicationDetailPage({params:Promise.resolve({slug})}));
    const cards=[...container.querySelectorAll(".application-products .product-card")];
    expect(cards).toHaveLength(count);
    for(const card of cards){
      expect(card.querySelector("img")?.getAttribute("src")).toBeTruthy();
      expect(card.querySelector(".product-card__description")?.textContent?.trim()).toBeTruthy();
      expect(card.querySelector(".product-card__link")?.getAttribute("href")).toMatch(/^\/products\/[^/]+\/[^/]+$/);
    }
    for(const existing of getApplication(slug)!.recommendedProductSlugs)expect(cards.some(c=>c.querySelector("a")?.getAttribute("href")?.endsWith('/'+existing))).toBe(true);
    expect(container.querySelector('[data-testid="source-hero"]')).toBeTruthy();
    expect(container.querySelector('a[href="tel:080-5189-8663"]')).toBeTruthy();
  });
  it("provides eight industry links and a mixed-category overview group",async()=>{
    getPageBySlug.mockResolvedValue(null);
    const {container}=render(await ApplicationDetailPage({params:Promise.resolve({slug:"industry-solutions"})}));
    expect(container.querySelectorAll(".application-products__industries a")).toHaveLength(8);
    expect(container.querySelector('.application-products__more[href="/products"]')).toBeTruthy();
    expect(resolveApplicationProducts("industry-solutions")?.groups.flatMap(g=>g.productSlugs)).toEqual(["bt8200","bt-7000","scm530","as-300-combustible"]);
  });
  it("accepts dedicated CMS ordering and copy without showing legacy blocks",async()=>{
    getPageBySlug.mockResolvedValue({blocks:[{_type:"richText",title:"Legacy replacement"}],applicationProducts:{title:"現場に合わせた製品選定",summary:"測定課題に対応する関連製品です。",groups:[{category:"dosing",title:"凝集薬注の監視",summary:"水処理工程の薬注を支援します。",moreLabel:"薬注製品を見る",productSlugs:["scm530","unknown","scm520"]}]}});
    const {container}=render(await ApplicationDetailPage({params:Promise.resolve({slug:"municipal-water-treatment"})}));
    expect([...container.querySelectorAll('.application-products .product-card__model')].map(node=>node.textContent)).toEqual(["SCM530","SCM520"]);
    expect(container.textContent).toContain("現場に合わせた製品選定");
    expect(container.textContent).not.toContain("Legacy replacement");
  });
  it("restricts overview navigation to known industry pages and supports explicit removal",()=>{
    const base=resolveApplicationProducts("industry-solutions")!;
    const input={navigation:{title:"分野から選ぶ",items:[{slug:"javascript:alert(1)"},{slug:"chemical-industry",title:"化学分野",summary:"ガスと水質の監視"},{slug:"chemical-industry"},{slug:"contact"}]} };
    expect(resolveApplicationProducts("industry-solutions",input)?.navigation?.items).toEqual([{slug:"chemical-industry",title:"化学分野",summary:"ガスと水質の監視"}]);
    expect(resolveApplicationProducts("industry-solutions",{navigation:{items:[null]}})?.navigation?.items).toEqual(base.navigation?.items);
    expect(resolveApplicationProducts("industry-solutions",{navigation:{items:[]},groups:[]})?.navigation?.items).toEqual([]);
    expect(resolveApplicationProducts("electric-power-industry",input)?.navigation).toBeUndefined();
    expect(resolveApplicationProducts("food-industry",{})).toBeUndefined();
    const all=resolveApplicationProducts("industry-solutions",{groups:[{category:"all",productSlugs:["scm530","bt8200","unknown"]}]},getProducts());
    expect(all?.groups[0].productSlugs).toEqual(["scm530","bt8200"]);
  });
});
