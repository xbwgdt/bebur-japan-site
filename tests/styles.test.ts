import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const palette = {
  blue700: "#0866b3",
  ice100: "#eaf6fb",
  navy900: "#0a2746",
  navy950: "#071c33",
  paper: "#ffffff",
} as const;

const focusedSkipLinkRules = [
  { selector: ":focus-visible", specificity: 1 },
  { selector: ".skip-link", specificity: 1 },
  { selector: ".skip-link:focus-visible", specificity: 2 },
] as const;

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

function ruleBlock(css: string, selector: string): {
  declarations: string;
  index: number;
} | null {
  const ruleStart = css.indexOf(`${selector} {`);
  if (ruleStart === -1) {
    return null;
  }

  const declarationsStart = css.indexOf("{", ruleStart) + 1;
  const declarationsEnd = css.indexOf("}", declarationsStart);

  return {
    declarations: css.slice(declarationsStart, declarationsEnd),
    index: ruleStart,
  };
}

function declarationValue(declarations: string, property: string): string | null {
  const declaration = declarations
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${property}:`));

  return declaration?.slice(property.length + 1).trim() ?? null;
}

function mediaBlock(css: string, condition: string): string | null {
  const mediaStart = css.lastIndexOf(`@media (${condition}) {`);
  if (mediaStart === -1) {
    return null;
  }

  const declarationsStart = css.indexOf("{", mediaStart);
  let depth = 0;

  for (let index = declarationsStart; index < css.length; index += 1) {
    if (css[index] === "{") {
      depth += 1;
    } else if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(declarationsStart + 1, index);
      }
    }
  }

  return null;
}

function resolvedFocusedSkipLinkProperty(
  css: string,
  property: string,
): string | null {
  const candidates = focusedSkipLinkRules.flatMap((rule) => {
    const block = ruleBlock(css, rule.selector);
    if (!block) {
      return [];
    }

    const value = declarationValue(block.declarations, property);
    return value
      ? [{ index: block.index, specificity: rule.specificity, value }]
      : [];
  });

  candidates.sort(
    (first, second) =>
      first.specificity - second.specificity || first.index - second.index,
  );

  return candidates.at(-1)?.value ?? null;
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

  it("preserves the layered indicator in the focused skip-link cascade", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const skipLinkRule = ruleBlock(css, ".skip-link");
    const skipLinkFocusRule = ruleBlock(css, ".skip-link:focus-visible");

    expect(skipLinkRule).not.toBeNull();
    expect(skipLinkFocusRule).not.toBeNull();
    expect(skipLinkFocusRule!.index).toBeGreaterThan(skipLinkRule!.index);
    expect(resolvedFocusedSkipLinkProperty(css, "outline")).toBe(
      "3px solid var(--blue-700)",
    );
    expect(resolvedFocusedSkipLinkProperty(css, "outline-offset")).toBe("3px");
    expect(resolvedFocusedSkipLinkProperty(css, "box-shadow")).toBe(
      "0 0 0 3px var(--paper)",
    );
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
    expect(contrastRatio(palette.paper, palette.navy900)).toBeGreaterThanOrEqual(
      3,
    );
  });
});

describe("home hero desktop title", () => {
  it("applies nowrap only through the approved desktop preset class", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const desktopStyles = mediaBlock(css, "min-width: 64rem");
    const nowrapRule = desktopStyles
      ? ruleBlock(
          desktopStyles,
          ".source-home-hero.source-home-hero--title-nowrap .source-hero h1",
        )
      : null;

    expect(nowrapRule).not.toBeNull();
    expect(declarationValue(nowrapRule!.declarations, "white-space")).toBe(
      "nowrap",
    );
  });

  it("keeps the default title preset on one line at desktop widths", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const desktopStyles = mediaBlock(css, "min-width: 64rem");
    const desktopRule = desktopStyles
      ? ruleBlock(
          desktopStyles,
          ".source-home-hero.source-home-hero--title-nowrap .source-hero h1",
        )
      : null;

    expect(desktopRule).not.toBeNull();
    expect(declarationValue(desktopRule!.declarations, "max-width")).toBe("none");
    expect(declarationValue(desktopRule!.declarations, "white-space")).toBe(
      "nowrap",
    );
  });
});
