// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import path from "node:path";
import ProductCategoryPage from "@/app/products/[category]/page";
import ApplicationCasesPage from "@/app/applications/cases/page";
import InsightsPage from "@/app/insights/page";
import { getProducts } from "@/lib/content";
import { resolveCategoryHero } from "@/lib/page-enhancements";
import { categoryHeroField } from "@/sanity/schemaTypes/page-enhancements";

const getPageBySlug = vi.hoisted(() => vi.fn());
vi.mock("sanity", () => ({ defineField: (value: unknown) => value, defineArrayMember: (value: unknown) => value }));
vi.mock("@/lib/sanity/queries", async original => ({ ...(await original<typeof import("@/lib/sanity/queries")>()), getPageBySlug }));
afterEach(() => { cleanup(); getPageBySlug.mockReset(); });

const routes = [
  ...["cleanliness", "water-quality", "gas-detection", "flow-level"].map(slug => ({ slug, image: "1762147356906250-b3ac3b47b4049a96.jpg", render: () => ProductCategoryPage({ params: Promise.resolve({ category: slug }) }) })),
  { slug: "application-case-index", image: "1762161234430121-ff7959b79637fe02.jpg", render: ApplicationCasesPage },
  { slug: "insight-index", image: "1762133644310526-d4cf5bd0feadf444.jpg", render: InsightsPage },
];

describe("six category and list manufacturer heroes", () => {
  it.each(routes)("renders the approved $slug hero and retains route controls", async route => {
    getPageBySlug.mockResolvedValue(null);
    const { container } = render(await route.render());
    const hero = resolveCategoryHero(route.slug);
    expect(hero?.image.src).toBe(`/source-media/${route.image}`);
    expect(existsSync(path.join(process.cwd(), "public", hero!.image.src))).toBe(true);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: hero!.title, level: 1 })).toBeTruthy();
    expect(container.querySelector('[data-testid="source-hero"] img')?.getAttribute("src")).toContain(route.image);
    expect(container.querySelector('[data-testid="source-hero"] img')?.getAttribute("alt")).toBe(hero!.image.alt);
    expect(container.querySelector("nav[aria-label]")).toBeTruthy();
    expect(getPageBySlug).toHaveBeenCalledWith(route.slug);
    expect(container.querySelector('a[href="tel:080-5189-8663"]')).toBeTruthy();
    expect(container.querySelector('a[href^="mailto:info@newtree-i.com"]')).toBeTruthy();
    if (route.slug === "application-case-index") {
      expect(screen.getByRole("link", { name: "産業別用途へ戻る" }).getAttribute("href")).toBe("/applications");
      expect(screen.getByRole("link", { name: "関連する製品情報を見る" }).getAttribute("href")).toBe("/products");
      expect(container.querySelectorAll(".application-card").length).toBeGreaterThan(20);
    } else if (route.slug === "insight-index") {
      expect(container.querySelector("time[datetime]")).toBeTruthy();
      expect(container.querySelectorAll(".insight-card").length).toBeGreaterThan(0);
    } else {
      expect(screen.getByRole("searchbox")).toBeTruthy();
      const count = getProducts().filter(product => product.category === route.slug).length;
      expect(container.querySelectorAll(".product-card")).toHaveLength(count);
      expect(container.querySelector(".category-banner__breadcrumb")?.textContent).toContain(`${count}製品`);
    }
  });

  it.each(routes)("applies dedicated CMS controls to $slug, ignoring generic blocks", async route => {
    getPageBySlug.mockResolvedValue({ blocks: [{ _type: "richText", title: "Legacy replacement" }], categoryHero: {
      title: "計測機器のご案内", summary: "用途に合わせて製品をご確認ください。", eyebrow: "BEBUR",
      image: { asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/reviewed.jpg" }, alt: "計測機器のイメージ" },
      color: "light", fontFamily: "serif", fontSize: "lg",
    } });
    const { container } = render(await route.render());
    expect(screen.getByRole("heading", { name: "計測機器のご案内", level: 1 })).toBeTruthy();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector(".category-banner--light.category-banner--serif.category-banner--lg img")?.getAttribute("src")).toContain("reviewed.jpg");
    expect(screen.queryByText("Legacy replacement")).toBeNull();
  });

  it.each(routes)("falls back safely and exposes editing controls only for approved $slug", async route => {
    const fallback = resolveCategoryHero(route.slug);
    expect(fallback).toBeDefined();
    for (const url of ["https://evil.test/a.jpg", "javascript:alert(1)", "https://cdn.sanity.io/images/other/production/a.jpg", "https://user@cdn.sanity.io/images/gbzt89e5/production/a.jpg"]) {
      expect(resolveCategoryHero(route.slug, { title: "<script>", color: "red", image: { asset: { url } } })).toEqual(fallback);
    }
    const hidden = categoryHeroField.hidden as unknown as (context: { document: { slug: { current: string } } }) => boolean;
    expect(hidden({ document: { slug: { current: route.slug } } })).toBe(false);
    expect(hidden({ document: { slug: { current: "contact" } } })).toBe(true);
    getPageBySlug.mockRejectedValue(new Error("CMS unavailable"));
    const { container } = render(await route.render());
    expect(container.querySelector('[data-testid="source-hero"] img')?.getAttribute("src")).toContain(route.image);
  });
});
