import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { siteSettingsQuery } from "../lib/sanity/queries";
import { approvedContact } from "../lib/constants";
import { readStudioEnvironment } from "../sanity/environment";
import product from "../sanity/schemaTypes/product";
import page from "../sanity/schemaTypes/page";
import siteSettings, {
  validateApprovedContactValue,
} from "../sanity/schemaTypes/siteSettings";
import { pageBlocks } from "../sanity/schemaTypes/blocks";
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

describe("Sanity modular page schemas", () => {
  const expectedBlockNames = [
    "hero",
    "richText",
    "gallery",
    "cardGrid",
    "dataTable",
    "cta",
  ];

  const findField = (
    fields: Array<{ name: string; options?: { list?: unknown[] } }> | undefined,
    name: string,
  ) => fields?.find((field) => field.name === name);

  const imageAltValidator = (field: { validation?: unknown }) => {
    const validators: Array<(value: unknown) => true | string> = [];
    const rule = {
      required: () => rule,
      custom: (validator: (value: unknown) => true | string) => {
        validators.push(validator);
        return rule;
      },
      error: () => rule,
    };

    expect(field.validation).toBeTypeOf("function");
    if (typeof field.validation !== "function") {
      throw new Error("Image alt field is missing validation.");
    }
    field.validation(rule as never);
    expect(validators).toHaveLength(1);
    return validators[0];
  };

  it("defines a page document with modular content and controlled publishing", () => {
    expect(page.title).toBe("页面内容");
    expect(page.fields?.map((field) => field.name)).toEqual(
      expect.arrayContaining(["title", "slug", "blocks", "seoTitle", "seoDescription", "publishState"]),
    );
    expect(findField(page.fields, "blocks")?.type).toBe("array");
    expect(findField(page.fields, "publishState")?.options?.list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "draft" }),
        expect.objectContaining({ value: "published" }),
      ]),
    );
  });

  it("defines every required page block and rejects English-only image alt text", () => {
    expect(pageBlocks.map((block) => block.name)).toEqual(
      expect.arrayContaining(expectedBlockNames),
    );

    for (const block of pageBlocks) {
      expect(block.title).toMatch(/[\u4e00-\u9fff]/u);
    }

    const hero = pageBlocks.find((block) => block.name === "hero");
    const heroImage = findField(hero?.fields, "image");
    const heroAlt = findField(heroImage?.fields, "alt");

    const gallery = pageBlocks.find((block) => block.name === "gallery");
    const galleryImages = findField(gallery?.fields, "images");
    const galleryImage = galleryImages?.of?.[0];
    const galleryAlt = findField(galleryImage?.fields, "alt");

    const cardGrid = pageBlocks.find((block) => block.name === "cardGrid");
    const cards = findField(cardGrid?.fields, "cards");
    const card = cards?.of?.[0];
    const cardImage = findField(card?.fields, "image");
    const cardAlt = findField(cardImage?.fields, "alt");

    for (const altField of [heroAlt, galleryAlt, cardAlt]) {
      if (!altField) {
        throw new Error("Expected page-block image alt field.");
      }
      const validator = imageAltValidator(altField);
      expect(validator("工場内の流量計")).toBe(true);
      expect(validator("product image")).not.toBe(true);
    }
  });

  it("uses fixed lists for all page style controls", () => {
    const controlledFields = ["color", "fontSize", "alignment", "spacing", "desktopTitleWrap"];

    for (const block of pageBlocks) {
      for (const fieldName of controlledFields) {
        const field = findField(block.fields, fieldName);
        expect(field).toBeDefined();
        expect(field?.type).toBe("string");
        expect(field?.options?.list).toEqual(expect.any(Array));
        expect(field?.options?.list?.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every published-content entry point reachable from Studio navigation", () => {
    const structureSource = readFileSync(
      resolve(process.cwd(), "sanity/structure.ts"),
      "utf8",
    );

    expect(structureSource).toContain('documentTypeListItem("page").title("页面内容")');
    expect(structureSource).toContain('documentTypeListItem("product")');
    expect(structureSource).toContain('documentTypeListItem("news")');
    expect(structureSource).toContain('.schemaType("siteSettings")');
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
  }, 60_000);
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

describe("contact-page Sanity controls", () => {
  type SchemaField = {
    name: string;
    type?: string;
    fields?: SchemaField[];
    of?: SchemaField[];
    options?: { list?: Array<string | { value: string }>; layout?: string };
    validation?: (rule: never) => unknown;
  };

  const findField = (fields: SchemaField[] | undefined, name: string) =>
    fields?.find((field) => field.name === name);

  const optionValues = (field: SchemaField | undefined, name: string) => {
    const optionField = findField(field?.fields, name);
    return optionField?.options?.list?.map((option) =>
      typeof option === "string" ? option : option.value,
    );
  };

  it("exposes fixed panel and guide presentation controls", () => {
    const contactPage = findField(siteSettings.fields as SchemaField[], "contactPage");
    const panel = findField(contactPage?.fields, "panel");
    const guide = findField(contactPage?.fields, "guide");
    const panelStyle = findField(panel?.fields, "style");
    const guideStyle = findField(guide?.fields, "style");
    const guideSteps = findField(guide?.fields, "steps");

    expect(contactPage).toBeDefined();
    expect(panel).toBeDefined();
    expect(guide).toBeDefined();
    expect(guideSteps?.type).toBe("array");
    expect(guideSteps?.of?.[0]?.type).toBe("string");
    expect(optionValues(panelStyle, "color")).toEqual([
      "light",
      "deepBlue",
      "paleBlue",
    ]);
    expect(optionValues(panelStyle, "fontSize")).toEqual(["sm", "md", "lg", "xl"]);
    expect(optionValues(panelStyle, "fontFamily")).toEqual(["sans", "serif", "mono"]);
    expect(optionValues(guideStyle, "color")).toEqual([
      "light",
      "deepBlue",
      "paleBlue",
    ]);
    expect(optionValues(guideStyle, "fontSize")).toEqual(["sm", "md", "lg", "xl"]);
    expect(optionValues(guideStyle, "fontFamily")).toEqual(["sans", "serif", "mono"]);

    for (const style of [panelStyle, guideStyle]) {
      expect(style?.fields?.map((field) => field.name)).toEqual([
        "color",
        "fontSize",
        "fontFamily",
      ]);
      for (const field of style?.fields ?? []) {
        expect(field.type).toBe("string");
        expect(field.options?.layout).toBe("radio");
        expect(field.options?.list).toEqual(expect.any(Array));
      }
    }

    expect(siteSettingsQuery).toContain("contactPage");
  });

  it("keeps contact prose and guide-step limits aligned with the public resolver", () => {
    const contactPage = findField(siteSettings.fields as SchemaField[], "contactPage");
    const panel = findField(contactPage?.fields, "panel");
    const guide = findField(contactPage?.fields, "guide");
    const description = findField(panel?.fields, "description");
    const steps = findField(guide?.fields, "steps");
    const descriptionMaxValues: number[] = [];
    const descriptionValidators: Array<(value: unknown) => true | string> = [];
    const descriptionRule = {
      required: () => descriptionRule,
      max: (value: number) => {
        descriptionMaxValues.push(value);
        return descriptionRule;
      },
      custom: (validator: (value: unknown) => true | string) => {
        descriptionValidators.push(validator);
        return descriptionRule;
      },
      error: () => descriptionRule,
    };
    const stepMaxValues: number[] = [];
    const stepRule = {
      required: () => stepRule,
      min: () => stepRule,
      max: (value: number) => {
        stepMaxValues.push(value);
        return stepRule;
      },
    };

    expect(description?.validation).toBeTypeOf("function");
    expect(steps?.validation).toBeTypeOf("function");
    description?.validation?.(descriptionRule as never);
    steps?.validation?.(stepRule as never);

    expect(descriptionMaxValues).toEqual([240]);
    expect(
      descriptionValidators.some(
        (validator) => validator("お問い合わせ\n詳細") !== true,
      ),
    ).toBe(true);
    expect(stepMaxValues).toEqual([6]);
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
