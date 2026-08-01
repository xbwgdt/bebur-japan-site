// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AboutDetailPage from "@/app/about/[slug]/page";
import ApplicationsPage from "@/app/applications/page";
import ApplicationCasesPage from "@/app/applications/cases/page";
import ApplicationDetailPage from "@/app/applications/[slug]/page";
import ContactPage from "@/app/contact/page";
import InsightsPage from "@/app/insights/page";
import HomePage from "@/app/page";
import ProductsPage from "@/app/products/page";
import ProductCategoryPage from "@/app/products/[category]/page";
import { getAboutPage, getApplication } from "@/lib/content";
import { publicSiteSettings } from "@/lib/site-settings";
import type { SanityPage } from "@/lib/sanity/queries";

const getPageBySlug = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sanity/queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sanity/queries")>()),
  getPageBySlug,
}));

afterEach(() => {
  cleanup();
  getPageBySlug.mockReset();
});

function pageFixture(slug: string, title: string): SanityPage {
  return {
    _id: `page-${slug}`,
    title,
    slug,
    blocks: [
      {
        _type: "richText",
        title,
        content: [{ _type: "block", children: [{ text: `${title} body` }] }],
      },
    ],
    seoTitle: `${title} SEO`,
    seoDescription: `${title} description`,
  };
}

describe("normal public CMS routes", () => {
  it.each([
    ["about", "company-profile", () => AboutDetailPage({ params: Promise.resolve({ slug: "company-profile" }) })],
    ["application", "liquid-cooling-industry", () => ApplicationDetailPage({ params: Promise.resolve({ slug: "liquid-cooling-industry" }) })],
    ["contact", "contact", () => ContactPage()],
  ] as const)("renders published CMS blocks before local %s content", async (_family, slug, renderRoute) => {
    const page = pageFixture(slug, `CMS ${slug}`);
    getPageBySlug.mockResolvedValue(page);

    render(await renderRoute());

    expect(getPageBySlug).toHaveBeenCalledWith(slug);
    expect(screen.getByRole("heading", { name: page.title })).toBeTruthy();
    expect(screen.getByText(`${page.title} body`)).toBeTruthy();
  });

  it("keeps the local contact content when Sanity has no published page", async () => {
    getPageBySlug.mockResolvedValue(null);

    render(await ContactPage());

    expect(getPageBySlug).toHaveBeenCalledWith("contact");
    expect(screen.getByText(publicSiteSettings.companyName)).toBeTruthy();
  });

  it("keeps the local contact content when the CMS read fails", async () => {
    getPageBySlug.mockRejectedValue(new Error("Sanity unavailable"));

    render(await ContactPage());

    expect(getPageBySlug).toHaveBeenCalledWith("contact");
    expect(screen.getByText(publicSiteSettings.companyName)).toBeTruthy();
  });

  it.each([
    [
      "about",
      "company-profile",
      () => AboutDetailPage({ params: Promise.resolve({ slug: "company-profile" }) }),
      () => getAboutPage("company-profile")!.title,
    ],
    [
      "application",
      "liquid-cooling-industry",
      () => ApplicationDetailPage({ params: Promise.resolve({ slug: "liquid-cooling-industry" }) }),
      () => getApplication("liquid-cooling-industry")!.title,
    ],
  ] as const)("keeps recognizable local %s content when its CMS read is unavailable", async (_family, slug, renderRoute, localTitle) => {
    getPageBySlug.mockResolvedValue(null);

    render(await renderRoute());

    expect(getPageBySlug).toHaveBeenCalledWith(slug);
    expect(screen.getByRole("heading", { name: localTitle(), level: 1 })).toBeTruthy();
  });

  it.each([
    ["/", "home", () => HomePage()],
    ["/products", "product-index", () => ProductsPage()],
    ["/applications", "application-index", () => ApplicationsPage()],
    ["/applications/cases", "application-case-index", () => ApplicationCasesPage()],
    ["/insights", "insight-index", () => InsightsPage()],
    ["/products/cleanliness", "cleanliness", () => ProductCategoryPage({ params: Promise.resolve({ category: "cleanliness" }) })],
    ["/products/dosing", "dosing", () => ProductCategoryPage({ params: Promise.resolve({ category: "dosing" }) })],
    ["/products/water-quality", "water-quality", () => ProductCategoryPage({ params: Promise.resolve({ category: "water-quality" }) })],
    ["/products/gas-detection", "gas-detection", () => ProductCategoryPage({ params: Promise.resolve({ category: "gas-detection" }) })],
    ["/products/flow-level", "flow-level", () => ProductCategoryPage({ params: Promise.resolve({ category: "flow-level" }) })],
  ] as const)("gives the published CMS page priority for %s", async (_route, slug, renderRoute) => {
    const page = pageFixture(slug, `CMS ${slug}`);
    getPageBySlug.mockResolvedValue(page);

    render(await renderRoute());

    expect(getPageBySlug).toHaveBeenCalledWith(slug);
    expect(screen.getByRole("heading", { name: page.title })).toBeTruthy();
    expect(screen.getByText(`${page.title} body`)).toBeTruthy();
  });

  it.each([
    ["/", "home", () => HomePage()],
    ["/products", "product-index", () => ProductsPage()],
    ["/applications", "application-index", () => ApplicationsPage()],
    ["/applications/cases", "application-case-index", () => ApplicationCasesPage()],
    ["/insights", "insight-index", () => InsightsPage()],
    ["/products/cleanliness", "cleanliness", () => ProductCategoryPage({ params: Promise.resolve({ category: "cleanliness" }) })],
    ["/products/dosing", "dosing", () => ProductCategoryPage({ params: Promise.resolve({ category: "dosing" }) })],
    ["/products/water-quality", "water-quality", () => ProductCategoryPage({ params: Promise.resolve({ category: "water-quality" }) })],
    ["/products/gas-detection", "gas-detection", () => ProductCategoryPage({ params: Promise.resolve({ category: "gas-detection" }) })],
    ["/products/flow-level", "flow-level", () => ProductCategoryPage({ params: Promise.resolve({ category: "flow-level" }) })],
  ] as const)("keeps the local page as fallback for %s", async (_route, slug, renderRoute) => {
    getPageBySlug.mockResolvedValue(null);

    const { container } = render(await renderRoute());

    expect(getPageBySlug).toHaveBeenCalledWith(slug);
    expect(screen.queryByText(`CMS ${slug} body`)).toBeNull();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  it.each([
    ["/", "home", () => HomePage(), "[data-testid=\"source-hero\"]"],
    ["/products", "product-index", () => ProductsPage(), "[data-testid=\"source-hero\"]"],
    ["/applications", "application-index", () => ApplicationsPage(), ".application-industries"],
    ["/applications/cases", "application-case-index", () => ApplicationCasesPage(), ".application-grid"],
    ["/insights", "insight-index", () => InsightsPage(), ".insight-grid"],
    ["/products/cleanliness", "cleanliness", () => ProductCategoryPage({ params: Promise.resolve({ category: "cleanliness" }) }), ".product-index"],
    ["/products/dosing", "dosing", () => ProductCategoryPage({ params: Promise.resolve({ category: "dosing" }) }), ".product-index"],
    ["/products/water-quality", "water-quality", () => ProductCategoryPage({ params: Promise.resolve({ category: "water-quality" }) }), ".product-index"],
    ["/products/gas-detection", "gas-detection", () => ProductCategoryPage({ params: Promise.resolve({ category: "gas-detection" }) }), ".product-index"],
    ["/products/flow-level", "flow-level", () => ProductCategoryPage({ params: Promise.resolve({ category: "flow-level" }) }), ".product-index"],
  ] as const)("keeps static %s locally usable when its CMS read rejects", async (_route, slug, renderRoute, fallbackSelector) => {
    getPageBySlug.mockRejectedValue(new Error("Sanity unavailable"));

    const { container } = render(await renderRoute());

    expect(getPageBySlug).toHaveBeenCalledWith(slug);
    expect(container.querySelector(fallbackSelector)).toBeTruthy();
  });

  it("keeps telephone, email, inquiry CTA, and guide available with CMS contact content", async () => {
    getPageBySlug.mockResolvedValue(pageFixture("contact", "CMS contact"));

    const { container } = render(await ContactPage());

    expect(container.querySelector(`a[href="tel:${publicSiteSettings.phone}"]`)).toBeTruthy();
    expect(container.querySelector(`a[href^="mailto:${publicSiteSettings.inquiryEmail}"]`)).toBeTruthy();
    expect(container.querySelectorAll('a[href^="mailto:"]')).toHaveLength(3);
    expect(container.querySelector(".inquiry-guide")).toBeTruthy();
  });
});
