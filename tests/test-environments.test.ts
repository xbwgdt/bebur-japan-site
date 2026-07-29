import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("Vitest environment isolation", () => {
  it("keeps Node as the default and opts render tests into JSDOM", async () => {
    const jsdomDirective = ["// @vitest-environment", "jsdom"].join(" ");
    const [config, contactTest, componentTest] = await Promise.all([
      readFile("vitest.config.ts", "utf8"),
      readFile("tests/contact.test.ts", "utf8"),
      readFile("tests/components.test.ts", "utf8"),
    ]);

    expect(typeof document).toBe("undefined");
    expect(config).not.toMatch(/environment:\s*["']jsdom["']/);
    expect(contactTest.startsWith(jsdomDirective)).toBe(true);
    expect(componentTest.startsWith(jsdomDirective)).toBe(true);
  });
});
