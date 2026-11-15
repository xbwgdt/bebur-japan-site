import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSanityImportDocuments } from "../scripts/validate-sanity-import.mjs";

describe("offline import validation runtime", () => {
  it("does not load the complete Studio UI for an offline validation", () => {
    const source = readFileSync("scripts/validate-sanity-import.mjs", "utf8");
    expect(source).not.toMatch(/from ["']sanity["']/);
    expect(source).toContain("@sanity/validation");
    expect(source).toContain("@sanity/schema");
    expect(source).toContain("@sanity/types");
    expect(source).toMatch(/watch:\s*null/);
    expect(readFileSync("scripts/audit-content.mjs", "utf8")).toMatch(/watch:\s*null/);
  });

  it("still rejects missing public fields, unknown references and substituted Japan contacts", async () => {
    const documents = readFileSync("sanity/import/initial.ndjson", "utf8").trim().split("\n").map(line => JSON.parse(line));
    const product = structuredClone(documents.find(document => document._type === "product"));
    const settings = structuredClone(documents.find(document => document._type === "siteSettings"));
    delete product.title;
    product.coverImage.alt = "";
    product.relatedProducts = [{ _type: "reference", _key: "invalid", _ref: "missing-product" }];
    settings.phone = "03-0000-0000";
    const errors = await validateSanityImportDocuments([product, settings], {
      existingDocumentIds: documents.map(document => document._id),
    });
    const paths = errors.map(error => error.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["title", "coverImage", "relatedProducts", "phone"]));
    expect(Object.hasOwn(globalThis, "window")).toBe(false);
    expect(Object.hasOwn(globalThis, "document")).toBe(false);
  });

  it("accepts a valid existing cross-document reference without requesting live data", async () => {
    const documents = readFileSync("sanity/import/initial.ndjson", "utf8").trim().split("\n").map(line => JSON.parse(line));
    const products = documents.filter(document => document._type === "product");
    const product = structuredClone(products[0]);
    product.relatedProducts = [{ _type: "reference", _key: "existing", _ref: products[1]._id }];
    await expect(validateSanityImportDocuments([product], {
      existingDocumentIds: documents.map(document => document._id),
    })).resolves.toEqual([]);
  });
});
