import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { siteSettingsQuery } from "../lib/sanity/queries";
import { approvedContact } from "../lib/constants";
import { readStudioEnvironment } from "../sanity/environment";
import product from "../sanity/schemaTypes/product";
import siteSettings, {
  validateApprovedContactValue,
} from "../sanity/schemaTypes/siteSettings";
import {
  validateJapaneseProse,
  validateJapaneseText,
} from "../sanity/schemaTypes/validation";
import { validateSanityImportDocuments } from "../scripts/validate-sanity-import.mjs";
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
  it("accepts approved Kanji-only and technical Japanese values", () => {
    expect(validateJapaneseText("新樹産業株式会社")).toBe(true);
    expect(validateJapaneseText("埼玉県草加市草加2－13－21－7")).toBe(true);
    expect(validateJapaneseText("2-300μm³、0-50°C、±1%")).toBe(true);
  });

  it("rejects unsafe characters from generic Japanese fields", () => {
    expect(validateJapaneseText("日本語🙂")).not.toBe(true);
  });

  it("keeps kana-required validation for narrative prose", () => {
    expect(validateJapaneseProse("純中文產品標題")).not.toBe(true);
    expect(validateJapaneseProse("日本向けコールドプレート液冷装置")).toBe(
      true,
    );
  });

  it("validates every generated import document with the Studio schema", async () => {
    const documents = readFileSync(
      resolve(process.cwd(), "sanity/import/initial.ndjson"),
      "utf8",
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(documents).toHaveLength(63);
    await expect(validateSanityImportDocuments(documents)).resolves.toEqual([]);
  });
});

describe("approved site contact validation", () => {
  const substituteValues = {
    distributorName: "別の日本総代理店",
    companyName: "別会社株式会社",
    postalCode: "100-0001",
    address: "東京都千代田区1－1",
    phone: "03-1234-5678",
    inquiryEmail: "valid@example.com",
  } as const;

  it("accepts only the exact approved contact constants", () => {
    for (const field of Object.keys(
      approvedContact,
    ) as Array<keyof typeof approvedContact>) {
      expect(
        validateApprovedContactValue(field, approvedContact[field]),
      ).toBe(true);
      expect(
        validateApprovedContactValue(field, substituteValues[field]),
      ).not.toBe(true);
    }
  });

  it("attaches exact-value checks to every site settings contact field", () => {
    for (const fieldName of Object.keys(
      approvedContact,
    ) as Array<keyof typeof approvedContact>) {
      const field = siteSettings.fields?.find(
        ({ name }) => name === fieldName,
      );
      const customValidators: Array<(value: unknown) => true | string> = [];
      const rule = {
        required: () => rule,
        regex: () => rule,
        email: () => rule,
        custom: (validator: (value: unknown) => true | string) => {
          customValidators.push(validator);
          return rule;
        },
        error: () => rule,
      };

      expect(field).toBeDefined();
      const validation = field?.validation;
      expect(validation).toBeTypeOf("function");
      if (typeof validation !== "function") {
        throw new Error(`Missing validation callback for ${fieldName}`);
      }
      validation(rule as never);
      expect(customValidators).toHaveLength(1);
      expect(customValidators[0](substituteValues[fieldName])).not.toBe(
        true,
      );
    }
  });
});

describe("Sanity singleton controls", () => {
  it("assigns an ID to the root desk list", () => {
    const structureSource = readFileSync(
      resolve(process.cwd(), "sanity/structure.ts"),
      "utf8",
    );

    expect(structureSource).toContain('S.list().id("content")');
  });

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
