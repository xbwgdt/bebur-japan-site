import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateApprovedPageIdentities } from "../scripts/page-import-integrity.mjs";

type PageDocument = {
  _id: string;
  slug: { current: string };
};

async function readPageDocuments(): Promise<PageDocument[]> {
  const source = await readFile(
    join(process.cwd(), "sanity", "import", "pages.ndjson"),
    "utf8",
  );

  return source
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as PageDocument);
}

describe("page import integrity", () => {
  it("accepts the generated approved page identity set", async () => {
    expect(validateApprovedPageIdentities(await readPageDocuments())).toBeUndefined();
  });

  it("rejects an unapproved page ID before an import can proceed", async () => {
    const documents = await readPageDocuments();
    documents[0] = { ...documents[0], _id: "page--unapproved" };

    expect(() => validateApprovedPageIdentities(documents)).toThrow(
      /approved page IDs/i,
    );
  });

  it("rejects a page slug that no longer maps to its approved route", async () => {
    const documents = await readPageDocuments();
    documents[0] = {
      ...documents[0],
      slug: { current: "unapproved-route" },
    };

    expect(() => validateApprovedPageIdentities(documents)).toThrow(
      /approved page slugs/i,
    );
  });
});
