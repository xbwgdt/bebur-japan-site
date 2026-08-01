import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = ["about.json", "applications.json", "insights.json", "products.json", "pages.json"];
const findOriginalMarkers = (value: unknown, path = "$"): string[] => {
  if (typeof value === "string") return value.includes("原文") ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((item, index) => findOriginalMarkers(item, `${path}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => findOriginalMarkers(item, `${path}.${key}`));
  return [];
};

describe("public Japanese copy", () => {
  it("does not expose source-note wording", async () => {
    const findings: string[] = [];
    for (const file of files) {
      const json = JSON.parse(await readFile(join(process.cwd(), "content", "ja", file), "utf8"));
      findings.push(...findOriginalMarkers(json).map((entry) => `${file}:${entry}`));
    }
    expect(findings).toEqual([]);
  });
});
