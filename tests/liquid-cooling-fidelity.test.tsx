import { describe, expect, it } from "vitest";
import { localSolutionPage } from "@/lib/liquid-cooling";
import sensors from "@/content/ja/liquid-cooling-sensors.json";

const blocks = localSolutionPage.blocks as Array<Record<string, unknown>>;
const block = (key: string) => {
  const result = blocks.find((entry) => entry._key === key);
  expect(result, `missing block ${key}`).toBeDefined();
  return result!;
};
const copy = (key: string) => {
  const item = block(key);
  return [item.title, item.summary, ...(item.content as Array<{ children?: Array<{ text?: string }> }> ?? []).map((line) => line.children?.map((span) => span.text).join("")), ...(item.rows as Array<{ cells?: string[] }> ?? []).flatMap((row) => row.cells ?? []), ...(item.cards as Array<{ title?: string; summary?: string; href?: string }> ?? []).flatMap((card) => [card.title, card.summary, card.href])].filter(Boolean).join(" ");
};

describe("Chinese liquid-cooling source fidelity in editable Japanese data", () => {
  it("keeps internal manufacturer-reconciliation notes out of public EC350 content without changing specifications", () => {
    const table=block("specs-bs-ec350");
    expect(table.title).toBe("BS-EC350 仕様（型式・構成別）");
    expect((table.rows as Array<{_key:string;cells:string[]}>).some(row=>row._key==="manufacturer-confirmation")).toBe(false);
    const product=sensors.find(sensor=>sensor.model==="BS-EC350")!;
    expect(product.specifications.some(row=>row.label==="仕様の確認について")).toBe(false);
    expect(JSON.stringify([table,product])).not.toMatch(/掲載値は現在|メーカーへの確認が必要|メーカーの中国語版|メーカー確認が必要/);
    expect(product.specifications.filter(row=>row.label.includes("測定範囲")).map(row=>row.value)).toEqual(["0～20 μS/cm","0～200 μS/cm","0～1000 μS/cm","0～2000 μS/cm","2～20000 μS/cm"]);
  });
  it("keeps the reviewed conclusion and the original page identity", () => {
    expect(copy("summary")).toContain("清浄度報告書が差し戻される最も多い原因");
    expect(copy("hero-liquid-cooling")).toContain("腐食");
    expect(JSON.stringify(localSolutionPage)).toContain("新樹産業株式会社");
  });

  it("restores the particle scale explanation and distinct failure mechanisms", () => {
    expect(copy("contamination")).toContain("50 µm以上");
    expect(copy("contamination")).toContain("シール材の老化");
    expect(copy("contamination")).toContain("清掃費用");
    expect(copy("particle-scale-caption")).toContain("対数目盛");
    expect(copy("particle-scale-caption")).toContain("線形比例ではありません");
  });

  it("keeps all four parameter-specific arguments and the concrete 1 NTU counterexample", () => {
    expect(copy("parameter-intro")).toContain("測定項目を取り違え");
    expect(copy("parameter-overview")).toContain("16/14/11");
    expect(copy("parameters-note")).toContain("100 µm");
    expect(copy("parameters-note")).toContain("高出力密度");
  });

  it("preserves all five stages and the operational consequences", () => {
    const stages = copy("stages");
    for (const phrase of ["5工程", "イオン負荷が飽和", "再現できません", "作業時間だけ", "二段階", "±0.5", "配管を洗浄する前", "フィルタ前後の差圧"]) expect(stages).toContain(phrase);
  });

  it("retains the three standards roles, priority rule and report columns", () => {
    const standards = copy("standards-intro") + copy("standards-use") + copy("report-layers");
    for (const phrase of ["国家規格", "業界規格", "団体規格", "契約・技術協定を優先", "専用規格を一般規格より優先", "同じ階層では厳しい", "ブランク値", "判定欄", "比較欄"]) expect(standards).toContain(phrase);
  });

  it("restores four named integration principles and two hard installation constraints", () => {
    const integration = copy("integration");
    for (const phrase of ["時刻の同期", "警報の二段階", "生データ", "運転中に取り外して", "直管の乱流域", "低所の排液口", "背圧"]) expect(integration).toContain(phrase);
  });

  it("retains original selection examples and full particle-counter specs", () => {
    const selection = copy("instrument-selection");
    for (const phrase of ["0～20 µS/cm", "PG25", "0～200 µS/cm", "0～1000 µS/cm", "0～10 NTU", "0～100 NTU", "50／100 µm"]) expect(selection).toContain(phrase);
    const specs = copy("particle-counter-specs");
    for (const phrase of ["1～200", "2～400", "2～750", "8チャネル", "16／24／32", "7インチ", "RS485", "4–20 mA", "1分未満", "ISO 4406", "NAS 1638"]) expect(specs).toContain(phrase);
  });

  it("keeps the operating tips, attributed case effect and all eight FAQs", () => {
    const tips = copy("field-notes");
    for (const phrase of ["数倍", "2桁", "PT1000", "3 mol/L", "飽和KCl"]) expect(tips).toContain(phrase);
    const caseText = copy("application-case");
    expect(caseText).toContain("不良率が改善");
    expect(caseText).toContain("Bebur");
    const faq = block("faq").content as Array<{ _key: string; children: Array<{ text: string }> }>;
    expect(faq.filter((line) => /^faq-\dq$/.test(line._key))).toHaveLength(8);
    expect(faq.filter((line) => /^faq-\da$/.test(line._key))).toHaveLength(8);
    expect(faq.find((line) => line._key === "faq-6a")?.children[0].text).toContain("同じ判定欄");
  });

  it("restores author, revision, original boundary and related readings", () => {
    const closing = copy("closing") + copy("source-authorship") + copy("source-related-readings");
    for (const phrase of ["Bebur（巴倍尔）液冷アプリケーションエンジニアリングチーム", "2026-11-11", "初版", "規格本文", "契約・技術協定", "フィードバック"]) expect(closing).toContain(phrase);
    expect(copy("source-related-readings")).toContain("https://www.bebur.net/fuwu/manifold-cleanliness-test.html");
    for (const model of ["BT8500", "BT8200", "BTP8300"]) expect(copy("source-related-readings")).toContain(model);
    expect(JSON.stringify(localSolutionPage)).not.toMatch(/原文では|出典ページでは|当サイトが独立に/);
  });
});
