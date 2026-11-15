import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { existsSync } from "node:fs";
import AboutDetailPage, { generateMetadata } from "@/app/about/[slug]/page";
import { getPublishedPageForRoute } from "@/lib/cms-pages";
import { pageProjection } from "@/lib/sanity/queries";
import { overviewHref, overviewImage, resolveCompanyOverviewStyle } from "@/lib/company-overview";

vi.mock("@/lib/cms-pages", () => ({ getPublishedPageForRoute: vi.fn(async () => null) }));
const renderOverview = async () => load(renderToStaticMarkup(await AboutDetailPage({params:Promise.resolve({slug:"overview"})})));

describe("complete editable company overview", () => {
  it("fills the empty route with the reference's complete Japanese presentation", async () => {
    const $=await renderOverview();
    expect($("h1")).toHaveLength(1);
    for(const id of ["company-profile","key-figures","company-culture","company-history","company-certificates","company-exhibitions"]) expect($("#"+id)).toHaveLength(1);
    expect($("#key-figures article")).toHaveLength(4);
    expect($("#company-culture article")).toHaveLength(3);
    expect($("#company-history article")).toHaveLength(5);
    expect($("#company-certificates article")).toHaveLength(6);
    expect($("#company-exhibitions article")).toHaveLength(7);
    expect($("#company-profile").text()).toContain("電気化学");
    expect($("#company-history").text()).toContain("2002");
    expect($(".company-overview").text()).toContain("新樹産業株式会社");
    expect($("a[href^='tel:']").first().attr("href")?.replace(/\D/g,"")).toBe("08051898663");
    expect($("a[href^='mailto:']").first().attr("href")).toContain("info@newtree-i.com");
    expect($(".company-overview").text()).not.toMatch(/原文|原資料|世界No\.1|日本認証取得/);
    expect($(".company-overview").text()).not.toContain("sales@bebur-tech.com");
  });
  it("renders published CMS edits instead of silently ignoring the overview body", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ _id:"page--overview",slug:"overview",title:"編集した企業概要",seoTitle:"編集した企業概要",seoDescription:"編集した説明です。",companyOverviewStyle:{fontFamily:"serif",primary:"#225588"},blocks:[{_type:"hero",title:"編集した企業概要",summary:"編集した首屏です。"},{_type:"cardGrid",anchorId:"company-culture",title:"編集した企業文化",cards:[{title:"編集した理念",summary:"公開された最新の理念です。"}]}]} as never);
    const $=await renderOverview();
    expect($("h1").text()).toBe("編集した企業概要");
    expect($("#company-culture").text()).toContain("公開された最新の理念です。");
    expect($(".company-overview").attr("style")).toContain("--overview-primary:#225588");
    expect($(".company-overview").attr("data-font")).toBe("serif");
  });
  it("does not let the existing hero-only CMS record produce another empty page", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({_id:"page--overview",slug:"overview",title:"旧ページ",blocks:[{_type:"hero",title:"旧ページ",summary:"旧説明"}],seoTitle:"旧ページ",seoDescription:"旧説明"} as never);
    const $=await renderOverview();
    expect($("#company-exhibitions article")).toHaveLength(7);
    expect($("#company-profile").text()).toContain("Bebur");
  });
  it("keeps certificate originals accessible and all page navigation anchors present", async () => {
    const $=await renderOverview();
    $(".company-overview__nav a").each((_,e)=>{const href=$(e).attr("href")!;expect($(href)).toHaveLength(1);});
    $("#company-certificates article").each((_,e)=>{expect($(e).find("img").attr("alt")).toBeTruthy();expect($(e).find("a").attr("href")).toMatch(/^\/media\/company-overview\//);});
    expect($("#company-certificates a[target='_blank']").first().attr("rel")).toContain("noopener");
  });
  it("projects the overview-only style settings and uses distinct overview metadata", async () => {
    expect(pageProjection).toContain("companyOverviewStyle");
    const metadata=await generateMetadata({params:Promise.resolve({slug:"overview"})});
    expect(metadata.title).not.toBe("Beburについて");
    expect(String(metadata.alternates?.canonical)).toBe("https://www.bebur-jp.com/about/overview");
  });
  it("does not change the existing company profile into the new overview", async () => {
    const $=load(renderToStaticMarkup(await AboutDetailPage({params:Promise.resolve({slug:"company-profile"})})));
    expect($(".company-overview")).toHaveLength(0);
    expect($(".about-detail").text()).toContain("会社概要");
  });
  it("has an optimized thumbnail and original for every bundled image", async () => {
    const $=await renderOverview();
    $(".company-overview img").each((_,e)=>{const src=$(e).attr("src")!;const file=new URL(src,"https://local.test").searchParams.get("url")??src;expect(existsSync("public"+file)).toBe(true);});
    $("#company-certificates a").each((_,e)=>expect(existsSync("public"+$(e).attr("href"))).toBe(true));
  });
  it("rejects unsafe links and CSS while allowing uploaded Sanity images", () => {
    expect(overviewHref("javascript:alert(1)")).toBeNull();
    expect(overviewHref("/\\invalid.example")).toBeNull();
    expect(overviewHref("//invalid.example")).toBeNull();
    expect(overviewHref("/about/culture")).toBe("/about/culture");
    expect(overviewImage("javascript:alert(1)")).toBeNull();
    expect(overviewImage("https://cdn.sanity.io/images/gbzt89e5/production/test.jpg")).toContain("w=1000");
    expect(resolveCompanyOverviewStyle({primary:"red;background:url(https://invalid.test)"}).primary).toBe("#2458A0");
  });
  it("filters malformed nested CMS values without dropping valid edited content", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({_id:"page--overview",slug:"overview",title:"更新された企業情報",seoTitle:"更新された企業情報",seoDescription:"更新された企業情報です。",blocks:[{_type:"hero",title:"更新された企業情報",summary:"最新の内容です。"},{_type:"cardGrid",anchorId:"company-profile",title:"企業紹介",cards:[{title:"正常な内容",summary:"残す本文です。"},null,{title:"不正な型",summary:123}]},{_type:"richText",title:"追加情報",content:[null,{style:"normal",children:[null,{text:"安全な追加本文です。"}]}]},{_type:"gallery",title:"資料",images:[null,{asset:{url:"javascript:alert(1)"}}]}]} as never);
    const rendering = renderOverview();
    await expect(rendering).resolves.toBeDefined();
    const $=await rendering;
    expect($(".company-overview").text()).toContain("残す本文です。");
    expect($(".company-overview").text()).toContain("安全な追加本文です。");
    expect($(".company-overview").html()).not.toContain("javascript:");
  });
  it("accepts a genuine table body and normalizes edited SEO string types", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({_id:"page--overview",slug:"overview",title:"表形式の企業情報",seoTitle:123,seoDescription:456,blocks:[{_type:"hero",title:"表形式の企業情報",summary:"更新です。"},{_type:"dataTable",anchorId:"facts",title:"企業データ",columns:["項目","内容"],rows:[{cells:["事業","水質分析"]}]}]} as never);
    const $=await renderOverview();
    expect($("table").text()).toContain("水質分析");
    expect($("h1").text()).toBe("表形式の企業情報");
  });
});
