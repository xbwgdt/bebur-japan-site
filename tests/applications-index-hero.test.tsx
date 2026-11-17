// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ApplicationsPage from "@/app/applications/page";
import { resolveCategoryHero } from "@/lib/page-enhancements";
import { categoryHeroField } from "@/sanity/schemaTypes/page-enhancements";

const getPageBySlug = vi.hoisted(() => vi.fn());
vi.mock("sanity", () => ({ defineField: (value: unknown) => value, defineArrayMember: (value: unknown) => value }));
vi.mock("@/lib/sanity/queries", async original => ({
  ...(await original<typeof import("@/lib/sanity/queries")>()), getPageBySlug,
}));
afterEach(() => { cleanup(); getPageBySlug.mockReset(); });

describe("applications index manufacturer hero", () => {
  it("shows the reviewed banner and preserves promotion, industries, cases and Japanese contacts", async () => {
    getPageBySlug.mockResolvedValue(null);
    const { container } = render(await ApplicationsPage());
    expect(container.querySelector(".category-banner img")?.getAttribute("src")).toContain("1762161234430121");
    expect(screen.getByRole("heading", { name: "産業別用途・導入事例", level: 1 })).toBeTruthy();
    expect(container.querySelector(".solution-promotion")).toBeTruthy();
    expect(container.querySelectorAll(".industry-anchor-grid a")).toHaveLength(8);
    expect(container.querySelectorAll(".application-grid .application-card").length).toBeGreaterThan(20);
    expect(container.querySelector('a[href="tel:080-5189-8663"]')).toBeTruthy();
    expect(container.querySelector('a[href^="mailto:info@newtree-i.com"]')).toBeTruthy();
    expect(getPageBySlug).toHaveBeenCalledWith("application-index");
  });

  it("renders dedicated CMS image, text, color, font and size without rendering legacy blocks", async () => {
    getPageBySlug.mockResolvedValue({ blocks: [{ _type: "richText", title: "Legacy unrelated block" }], categoryHero: {
      title: "用途に合わせた計測ソリューション", summary: "測定課題に合わせてBebur製品をご確認ください。", eyebrow: "APPLICATIONS",
      image: { asset: { url: "https://cdn.sanity.io/images/gbzt89e5/production/reviewed-banner.jpg" }, alt: "水質監視のイメージ" },
      color: "light", fontFamily: "serif", fontSize: "lg",
    } });
    const { container } = render(await ApplicationsPage());
    expect(screen.getByRole("heading", { name: "用途に合わせた計測ソリューション", level: 1 })).toBeTruthy();
    expect(container.querySelector(".category-banner--light.category-banner--serif.category-banner--lg img")?.getAttribute("src")).toContain("reviewed-banner.jpg");
    expect(screen.queryByText("Legacy unrelated block")).toBeNull();
  });

  it("retains the local banner on CMS failure or unsafe field values", async () => {
    const fallback = resolveCategoryHero("application-index");
    expect(fallback?.image.src).toContain("1762161234430121");
    expect(resolveCategoryHero("application-index", { image: { asset: { url: "https://other.test/a.jpg" } }, title: "<script>", color: "red", fontSize: "999px" })).toEqual(fallback);
    getPageBySlug.mockRejectedValue(new Error("CMS unavailable"));
    const { container } = render(await ApplicationsPage());
    expect(container.querySelector(".category-banner img")?.getAttribute("src")).toContain("1762161234430121");
  });

  it("exposes existing hero controls on the applications index without exposing them on unrelated pages", () => {
    const hidden = categoryHeroField.hidden as unknown as (context: { document: { slug: { current: string } } }) => boolean;
    expect(hidden({ document: { slug: { current: "application-index" } } })).toBe(false);
    expect(hidden({ document: { slug: { current: "dosing" } } })).toBe(false);
    expect(hidden({ document: { slug: { current: "contact" } } })).toBe(true);
  });
});
