// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const stylesheet = postcss.parse(readFileSync("app/globals.css", "utf8"));
const layoutProperties = new Set([
  "position", "inset", "width", "height", "object-fit", "aspect-ratio", "overflow",
]);

// Resolve matching rules by importance, specificity and source order rather
// than checking just the first declaration block or its whitespace formatting.
// Matching selectors here are simple type/class selectors (no :is/:where).
function effectiveDeclarations(element: Element): Record<string, string> {
  const winners = new Map<string, { rank: number[]; value: string }>();
  let order = 0;

  stylesheet.walkRules((rule) => {
    for (const selector of rule.selectors) {
      if (!element.matches(selector)) continue;

      const ids = selector.match(/#[\w-]+/g)?.length ?? 0;
      const classes = selector.match(/\.[\w-]+/g)?.length ?? 0;
      const types = selector.match(/(?:^|[\s>+~])([a-z][\w-]*)/gi)?.length ?? 0;

      rule.walkDecls((declaration) => {
        if (!layoutProperties.has(declaration.prop)) return;
        // The thumbnail layout rules are unconditional. A future conditional
        // override must get viewport-aware resolution instead of being ignored.
        expect(rule.parent?.type, selector).not.toBe("atrule");
        const rank = [Number(Boolean(declaration.important)), ids, classes, types, order++];
        const previous = winners.get(declaration.prop);
        const difference = previous
          ? rank.map((value, index) => value - previous.rank[index]).find((value) => value !== 0)
          : 1;

        if (difference !== undefined && difference > 0) {
          winners.set(declaration.prop, { rank, value: declaration.value.replace(/\s+/g, " ").trim() });
        }
      });
    }
  });

  return Object.fromEntries([...winners].map(([property, winner]) => [property, winner.value]));
}

function thumbnail(card: string, sourceShell: boolean) {
  const shell = document.createElement("div");
  if (sourceShell) shell.className = "source-shell";
  shell.innerHTML = `<article class="card ${card}"><div class="${card}__media"><img alt="Portrait thumbnail" /></div></article>`;
  return {
    frame: effectiveDeclarations(shell.querySelector(`.${card}__media`)!),
    image: effectiveDeclarations(shell.querySelector("img")!),
  };
}

describe.each([false, true])("listing thumbnail containment (source-shell: %s)", (sourceShell) => {
  it.each(["application-card", "insight-card"])("positions the %s frame without changing its aspect ratio", (card) => {
    const { frame } = thumbnail(card, sourceShell);

    expect(frame.position).toBe("relative");
    expect(frame["aspect-ratio"].replace(/\s/g, "")).toBe(card === "application-card" && sourceShell ? "16/10" : "4/3");
    expect(frame.overflow).toBe("hidden");
  });

  it.each(["application-card", "insight-card"])("fits the entire %s image inside the frame", (card) => {
    const { image } = thumbnail(card, sourceShell);

    expect(image).toMatchObject({
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      "object-fit": "contain",
    });
  });

  it("leaves product-card image positioning unchanged", () => {
    const { frame, image } = thumbnail("product-card", sourceShell);

    expect(frame.position).toBeUndefined();
    expect(frame["aspect-ratio"].replace(/\s/g, "")).toBe("4/3");
    expect(image.position).toBeUndefined();
    expect(image.inset).toBeUndefined();
    expect(image["object-fit"]).toBe("contain");
  });
});
