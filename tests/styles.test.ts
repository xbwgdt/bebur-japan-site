import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const palette = {
  blue700: "#0866b3",
  ice100: "#eaf6fb",
  navy950: "#071c33",
  paper: "#ffffff",
} as const;

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

describe("global focus indicator", () => {
  it("uses a paper inner ring and blue outer outline for mixed surfaces", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const focusRule = css.match(/:focus-visible\s*\{([^}]+)\}/)?.[1];

    expect(focusRule).toContain("outline: 3px solid var(--blue-700);");
    expect(focusRule).toContain("outline-offset: 3px;");
    expect(focusRule).toContain(
      "box-shadow: 0 0 0 3px var(--paper);",
    );
    expect(focusRule).not.toContain("var(--cyan-400)");
  });

  it("provides a three-to-one boundary on light, ice, and navy surfaces", () => {
    expect(contrastRatio(palette.blue700, palette.paper)).toBeGreaterThanOrEqual(
      3,
    );
    expect(contrastRatio(palette.blue700, palette.ice100)).toBeGreaterThanOrEqual(
      3,
    );
    expect(contrastRatio(palette.paper, palette.navy950)).toBeGreaterThanOrEqual(
      3,
    );
  });
});
