import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { localSolutionPage } from "@/lib/liquid-cooling";
import design from "@/content/ja/liquid-cooling-design.json";
import LiquidCoolingSolutionPage from "@/app/solutions/liquid-cooling-cleanliness-testing/page";
import { getPublishedPageForRoute } from "@/lib/cms-pages";

vi.mock("@/lib/cms-pages", () => ({ getPublishedPageForRoute: vi.fn(async () => null) }));
const copy = JSON.stringify([localSolutionPage, design]);

describe("Japan-first liquid cooling standards localization", () => {
  it("removes Chinese normative references from every editable public surface", () => {
    expect(copy).not.toMatch(/GB\/T|YD\/T|T\/CAEE|T\/CIEP|T\/DZJN|T\/GDSS|中国規格|中国国家規格|中国団体規格|15規格|15の参照/);
  });
  it("puts Japanese methods first and distinguishes US-origin guidance and fluid scopes", () => {
    const table = localSolutionPage.blocks.find(b => b._key === "standards-table") as any;
    expect(table.rows[0].cells.join(" ")).toContain("JIS K 0102-1:2021");
    expect(table.rows[1].cells.join(" ")).toContain("JIS B 9933:2023");
    for (const term of ["2023年追補", "油圧", "ASHRAE", "OCP", "水基", "プロピレングリコール", "強制規格ではありません", "施設側", "サーバー側"]) expect(copy).toContain(term);
  });
  it("does not retain inherited acceptance limits in hero and parameter cards", () => {
    const cards = JSON.stringify([design.metrics, design.parameters, design.metricNote]);
    expect(cards).not.toMatch(/16\/14\/11|50\s*\/\s*300|≤10|≤5\s*\/\s*≤20|8\.0[–～-]10\.0/);
    expect(cards).toContain("メーカー");
    expect(cards).toContain("冷却液");
    expect(design.navigation.find(x=>x.anchor==="standards")?.label).toBe("規格・技術指針");
  });
  it("renders the complete editable chapter structure, sources, animation and Japanese contacts", async () => {
    const $ = load(renderToStaticMarkup(await LiquidCoolingSolutionPage()));
    expect($("#standards-table tbody tr")).toHaveLength(6);
    expect($("#references a").length).toBeGreaterThanOrEqual(6);
    expect($(".faq")).toHaveLength(8);
    expect($(".tl-item")).toHaveLength(5);
    expect($(".flow")).toHaveLength(1);
    expect($(".lc-editorial a[href='tel:080-5189-8663']")).toHaveLength(1);
    expect($(".lc-editorial a[href='mailto:info@newtree-i.com']")).toHaveLength(1);
    expect($(".japan-contact").text()).toContain("新樹産業株式会社");
  });
  it("continues to use CMS text, colors, typography, metrics and navigation", async () => {
    vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({ ...localSolutionPage, liquidCoolingDesign: { ...design, fontFamily: "sans", fontSize: 18, theme: { ...design.theme, accent: "#123456" }, metrics: [{ ...design.metrics[0], value: "編集した管理条件" }], navigation: [{ _key:"standards",_type:"solutionNavItem",label:"編集した参照資料",anchor:"standards" }] } } as never);
    const html = renderToStaticMarkup(await LiquidCoolingSolutionPage());
    for (const term of ["編集した管理条件", "編集した参照資料", "--teal:#123456", "--editorial-size:18px", "Yu Gothic"]) expect(html).toContain(term);
  });
});
