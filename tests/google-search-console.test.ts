import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const verificationFile = "google68e5f8439f4ab1eb.html";

describe("Google Search Console verification", () => {
  it("publishes the requested ownership verification file at the site root", () => {
    const filePath = resolve(process.cwd(), "public", verificationFile);

    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, "utf8").trim()).toBe(
      `google-site-verification: ${verificationFile}`,
    );
  });
});
