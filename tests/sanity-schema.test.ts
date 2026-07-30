import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { siteSettingsQuery } from "../lib/sanity/queries";
import { readStudioEnvironment } from "../sanity/environment";
import product from "../sanity/schemaTypes/product";
import { validateJapaneseText } from "../sanity/schemaTypes/validation";
import {
  filterSingletonActions,
  filterSingletonCreationOptions,
  filterSingletonTemplates,
} from "../sanity/singletons";

describe("Sanity Studio environment", () => {
  it("reads the browser-exposed SANITY_STUDIO variables", () => {
    expect(
      readStudioEnvironment({
        SANITY_STUDIO_PROJECT_ID: "studio-project",
        SANITY_STUDIO_DATASET: "staging",
        SANITY_STUDIO_API_VERSION: "2026-07-30",
      }),
    ).toEqual({
      projectId: "studio-project",
      dataset: "staging",
      apiVersion: "2026-07-30",
    });
  });

  it("does not accept a Next public project ID for Studio configuration", () => {
    expect(() =>
      readStudioEnvironment({
        NEXT_PUBLIC_SANITY_PROJECT_ID: "next-project",
      }),
    ).toThrow("SANITY_STUDIO_PROJECT_ID");
  });

  it("wires all Studio variables in the Studio config", () => {
    const configSource = readFileSync(
      resolve(process.cwd(), "sanity/sanity.config.ts"),
      "utf8",
    );

    expect(configSource).toContain("process.env.SANITY_STUDIO_PROJECT_ID");
    expect(configSource).toContain("process.env.SANITY_STUDIO_DATASET");
    expect(configSource).toContain("process.env.SANITY_STUDIO_API_VERSION");
    expect(configSource).not.toContain("process.env.NEXT_PUBLIC_SANITY");
  });
});

describe("Sanity product schema", () => {
  it("exposes the Chinese product editor with required public fields", () => {
    expect(product.title).toBe("产品");
    expect(product.fields?.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        "title",
        "slug",
        "coverImage",
        "specifications",
      ]),
    );
  });
});

describe("Japanese public-text validation", () => {
  it("rejects Chinese-only Han text", () => {
    expect(validateJapaneseText("纯中文产品标题")).toBe(
      "请输入至少包含一个日文平假名或片假名的内容",
    );
  });

  it("rejects Chinese-only Han text containing a Japanese middle dot", () => {
    expect(validateJapaneseText("纯中文・产品标题")).toBe(
      "请输入至少包含一个日文平假名或片假名的内容",
    );
  });

  it("rejects kana-block punctuation and iteration marks without letters", () => {
    expect(validateJapaneseText("・ーゝゞヽヾ")).toBe(
      "请输入至少包含一个日文平假名或片假名的内容",
    );
  });

  it("accepts Japanese text containing kana, Han, and model punctuation", () => {
    expect(validateJapaneseText("BT-8200 日本向けコールドプレート液冷装置")).toBe(
      true,
    );
  });
});

describe("Sanity singleton controls", () => {
  it("removes site settings from schema templates and new-document options", () => {
    expect(
      filterSingletonTemplates([
        { id: "siteSettings", schemaType: "siteSettings" },
        { id: "product", schemaType: "product" },
      ]),
    ).toEqual([{ id: "product", schemaType: "product" }]);

    expect(
      filterSingletonCreationOptions([
        { templateId: "siteSettings" },
        { templateId: "product" },
      ]),
    ).toEqual([{ templateId: "product" }]);
  });

  it("removes the duplicate action from site settings only", () => {
    const actions = [{ action: "publish" }, { action: "duplicate" }];

    expect(
      filterSingletonActions(actions, { schemaType: "siteSettings" }),
    ).toEqual([{ action: "publish" }]);
    expect(filterSingletonActions(actions, { schemaType: "product" })).toEqual(
      actions,
    );
  });

  it("queries site settings by its singleton document ID", () => {
    expect(siteSettingsQuery).toContain(
      '_type == "siteSettings" && _id == "siteSettings"',
    );
  });
});

describe("Sanity environment-file ignores", () => {
  it("ignores loaded environment files without hiding an example file", () => {
    const ignoreRules = new Set(
      readFileSync(resolve(process.cwd(), ".gitignore"), "utf8").split(/\r?\n/u),
    );

    expect(ignoreRules.has(".env.development")).toBe(true);
    expect(ignoreRules.has(".env.production")).toBe(true);
    expect(ignoreRules.has(".env.*.local")).toBe(true);
    expect(ignoreRules.has(".env.example")).toBe(false);
    expect(ignoreRules.has(".env.*")).toBe(false);
  });
});
