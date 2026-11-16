import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { getApplication, getArticle, getProduct } from "../lib/content";

function expectRelation(svg: string, from: string, to: string, relation: string) {
  const $=load(svg,{xml:true});
  const edge=$(`path[data-from="${from}"][data-to="${to}"][data-relation="${relation}"]`);
  expect(edge).toHaveLength(1);
  const sourceY=Number($(`g[data-node="${from}"] rect`).attr("y"));
  const targetY=Number($(`g[data-node="${to}"] rect`).attr("y"));
  const geometry=edge.attr("d")!;
  if(geometry.includes("H")) {
    const coordinates=geometry.match(/^M(110|610) (\d+)H\d+V(\d+)H(100|620)$/);
    expect(coordinates, "side loop joins the actual source and target boxes").not.toBeNull();
    expect(Number(coordinates![2])).toBeGreaterThan(sourceY);
    expect(Number(coordinates![2])).toBeLessThan(sourceY+130);
    expect(Number(coordinates![3])).toBeGreaterThan(targetY);
    expect(Number(coordinates![3])).toBeLessThan(targetY+130);
  } else expect(geometry).toBe(`M360 ${sourceY+130}V${targetY-15}`);
  expect(edge.attr("marker-end")).toBeTruthy();
}

describe("approved image remediation", () => {
  it("gives each industry its own Japanese measurement configuration rather than a generic scene", () => {
    for (const slug of ["industry-solutions", "liquid-cooling-industry", "municipal-water-treatment", "electric-power-industry", "medical-pharmaceutical", "chemical-industry", "environmental-protection", "food-industry", "hydraulic-industry"]) {
      const image = getApplication(slug)!.images[0];
      expect(image.src).toBe(`/media/industry/${slug}.svg`);
      expect(image.alt).toContain("構成例");
    }
  });

  it("retains the actual LabSense photo and removes broad generic article illustrations", () => {
    const paper = getArticle("particle-charge-analyzer-papermaking")!;
    expect(paper.images).toHaveLength(1);
    expect(paper.images[0].alt).toContain("粒子電荷分析計");
    expect(getArticle("residual-chlorine-detector-brands-2026-april")!.images).toHaveLength(1);
  });

  it("localizes the three dosing diagrams and distinguishes UV absorption from oxidation-based TOC measurement", () => {
    for (const slug of ["bt-9000c", "bt-9000l", "bt-9000s"]) {
      expect(getProduct("dosing", slug)!.images[0].src).toBe(`/media/dosing/${slug}.svg`);
    }
    expect(getArticle("toc-analyzer-brands-2026")!.images[0].alt).toContain("UV吸収方式");
  });

  it("keeps product-only case photos honest and adds contextual sampling diagrams", () => {
    for (const slug of ["bt8200-liquid-cooling", "liquid-particle-counter-pharmaceutical", "medical-pharmaceutical-cases", "plate-heat-exchanger-cleanliness", "scm530-power-plant-dosing"]) {
      const application=getApplication(slug)!;
      expect(application.images[0].alt).toMatch(/製品写真|参考画像|構成例/);
      expect(application.images.some(image=>image.src.startsWith("/media/industry/"))).toBe(true);
    }
  });

  it("samples treated water after coagulant mixing and closes the SCM530 control loop", () => {
    const svg=fs.readFileSync("public/media/industry/scm530-power-plant-dosing.svg", "utf8");
    expect(svg).toContain("凝集剤注入・混合");
    expect(svg).toContain("処理後水を採水");
    expect(svg).not.toContain("原水をサンプリング");
    for (const edge of ['data-from="mix" data-to="sample" data-relation="treated-water"', 'data-from="sample" data-to="scm" data-relation="sample"', 'data-from="scm" data-to="control" data-relation="feedback"', 'data-from="control" data-to="mix" data-relation="dosing-control"']) expect(svg).toContain(edge);
    for (const [from,to,relation] of [["mix","sample","treated-water"],["sample","scm","sample"],["scm","control","feedback"],["control","mix","dosing-control"]]) expectRelation(svg,from,to,relation);
  });

  it.each([
    ["bt-9000c", ["入口で消毒剤を注入", "消毒池の出口で採水", "流量測定"], [["outlet", "residual", "sample"], ["residual", "control", "feedback"], ["flow", "control", "flow-input"], ["control", "inlet", "dosing-control"]]],
    ["bt-9000l", ["原水の濁度・有機物", "凝集剤注入・混合", "凝集後の流動電流", "沈殿後の濁度"], [["raw", "control", "feedforward"], ["streaming", "control", "feedback"], ["settled", "control", "reference"], ["mix", "streaming", "sample"], ["control", "mix", "dosing-control"]]],
    ["bt-9000s", ["管内ミキサー", "混合後に採水", "ストリーミング電流"], [["mix", "sample", "post-mixer-sample"], ["sample", "streaming", "sample"], ["streaming", "control", "feedback"], ["control", "mix", "dosing-control"]]],
  ])("preserves manufacturer control relationships for %s", (slug, labels, edges) => {
    const svg=fs.readFileSync(`public/media/dosing/${slug}.svg`, "utf8");
    for (const label of labels) expect(svg).toContain(label);
    for (const [from,to,relation] of edges) expectRelation(svg,from,to,relation);
    expect(svg).toContain("構成例");
  });

  it("separates incoming raw-water feedforward from the outgoing L dosing-control signal", () => {
    const $=load(fs.readFileSync("public/media/dosing/bt-9000l.svg", "utf8"),{xml:true});
    const incoming=$('path[data-from="raw"][data-to="control"]').attr("d")!.match(/V(\d+)H/)!;
    const outgoing=$('path[data-from="control"][data-to="mix"]').attr("d")!.match(/^M\d+ (\d+)H/)!;
    expect(incoming[1]).not.toBe(outgoing[1]);
  });

  it("labels UVSense as a UV correlation estimate, not direct oxidation measurement", () => {
    const alt=getArticle("toc-analyzer-brands-2026")!.images[0].alt;
    expect(alt).toContain("相関に基づく推定");
    expect(alt).toContain("酸化法による直接測定とは異なります");
  });

  it("keeps heat exchanger reference labeling and generator output idempotent", () => {
    expect(getApplication("plate-heat-exchanger-cleanliness")!.images[0].alt).toBe("熱交換器の参考画像");
    const fixture=fs.mkdtempSync(path.join(os.tmpdir(),"bebur-image-test-"));
    try {
      fs.mkdirSync(path.join(fixture,"content/ja"),{recursive:true});
      fs.mkdirSync(path.join(fixture,"content/source"),{recursive:true});
      for (const name of ["applications","products","insights"]) fs.copyFileSync(`content/ja/${name}.json`,path.join(fixture,`content/ja/${name}.json`));
      const generator=path.resolve("scripts/prepare-image-remediation.mjs");
      execFileSync(process.execPath,[generator],{cwd:fixture});
      const first=fs.readFileSync(path.join(fixture,"content/ja/applications.json"),"utf8");
      execFileSync(process.execPath,[generator],{cwd:fixture});
      expect(fs.readFileSync(path.join(fixture,"content/ja/applications.json"),"utf8")).toBe(first);
      expect(JSON.parse(first).find((row: {slug:string})=>row.slug==="plate-heat-exchanger-cleanliness").images[0].alt).toBe("熱交換器の参考画像");
    } finally { fs.rmSync(fixture,{recursive:true,force:true}); }
  });

  it("uses legible native diagrams with Japanese titles, not unsupported technical specifications", () => {
    const svg=fs.readFileSync("public/media/dosing/bt-9000s.svg", "utf8");
    expect(svg).toContain("ストリーミング電流");
    expect(svg).toContain("構成例");
    expect(svg).not.toMatch(/FLOC BASIN|SEDIMENTATION|FILTRATION/);
  });
});
