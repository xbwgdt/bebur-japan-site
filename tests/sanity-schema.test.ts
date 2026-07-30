import { describe, expect, it } from "vitest";

import product from "../sanity/schemaTypes/product";

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
