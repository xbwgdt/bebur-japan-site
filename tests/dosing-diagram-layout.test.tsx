// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductDetailPage from "@/app/products/[category]/[slug]/page";
import * as content from "@/lib/content";

afterEach(cleanup);

describe("dosing diagram detail layout", () => {
  it.each(["bt-9000c", "bt-9000l", "bt-9000s"])("preserves the complete diagram aspect ratio for %s", async slug => {
    const { container } = render(await ProductDetailPage({ params: Promise.resolve({ category: "dosing", slug }) }));
    expect(container.querySelector(".product-detail__media--diagram img")?.getAttribute("alt")).toContain("構成例");
    const css=readFileSync("app/globals.css", "utf8");
    expect(css.match(/\.product-detail__media--diagram\s*\{([^}]+)\}/)?.[1]).toMatch(/aspect-ratio:\s*auto/);
    expect(css.match(/\.product-detail__media--diagram img\s*\{([^}]+)\}/)?.[1]).toMatch(/height:\s*auto/);
  });

  it("leaves normal product photos on their existing layout", async () => {
    const { container } = render(await ProductDetailPage({ params: Promise.resolve({ category: "water-quality", slug: "bt-7000" }) }));
    expect(container.querySelector(".product-detail__media")).not.toBeNull();
    expect(container.querySelector(".product-detail__media--diagram")).toBeNull();
    expect(readFileSync("app/globals.css", "utf8").match(/\.product-detail__media\s*\{([^}]+)\}/)?.[1]).toMatch(/aspect-ratio:\s*4\s*\/\s*3/);
  });

  it("does not apply diagram layout to a replacement photo on an approved dosing model", async () => {
    const product=content.getProduct("dosing","bt-9000c")!;
    product.images[0].alt="BT-9000C 製品写真";
    const lookup=vi.spyOn(content,"getProduct").mockReturnValue(product);
    try {
      const { container } = render(await ProductDetailPage({ params: Promise.resolve({ category: "dosing", slug: "bt-9000c" }) }));
      expect(container.querySelector(".product-detail__media--diagram")).toBeNull();
    } finally { lookup.mockRestore(); }
  });
});
