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
  it("keeps the canonical contact hero and excludes legacy generic CMS blocks", async () => {
    getPageBySlug.mockResolvedValue(pageFixture("contact", "Legacy CMS contact"));

    const { container } = render(await ContactPage());

    expect(container.querySelector('[data-testid="source-hero"]')).toBeTruthy();
    expect(screen.getByText("CONTACT")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "お問い合わせ", level: 1 }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "日本国内の製品選定、仕様確認、お見積もり、アフターサービスのご相談を承ります。",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Legacy CMS contact body")).toBeNull();
    expect(getPageBySlug).not.toHaveBeenCalledWith("contact");
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

    expect(getPageBySlug).not.toHaveBeenCalledWith(slug);
    expect(screen.getByRole("heading", { name: localTitle(), level: 1 })).toBeTruthy();
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
    ["/about/company-profile", "company-profile", () => AboutDetailPage({ params: Promise.resolve({ slug: "company-profile" }) }), "[data-testid=\"source-hero\"]"],
    ["/applications/liquid-cooling-industry", "liquid-cooling-industry", () => ApplicationDetailPage({ params: Promise.resolve({ slug: "liquid-cooling-industry" }) }), "[data-testid=\"source-hero\"]"],
  ] as const)("keeps the canonical design for %s when legacy CMS blocks exist", async (_route, slug, renderRoute, canonicalSelector) => {
    const page = pageFixture(slug, `CMS ${slug}`);
    getPageBySlug.mockResolvedValue(page);

    const { container } = render(await renderRoute());

    expect(container.querySelector(canonicalSelector)).toBeTruthy();
    expect(screen.queryByText(`${page.title} body`)).toBeNull();
    expect(getPageBySlug).not.toHaveBeenCalledWith(slug);
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

    expect(getPageBySlug).not.toHaveBeenCalledWith(slug);
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

    expect(getPageBySlug).not.toHaveBeenCalledWith(slug);
    expect(container.querySelector(fallbackSelector)).toBeTruthy();
  });

  it("keeps the shared telephone and email contact actions with CMS content", async () => {
    getPageBySlug.mockResolvedValue(pageFixture("contact", "CMS contact"));

    render(await ContactPage());

    expect(
      screen
        .getByRole("link", { name: publicSiteSettings.contactPage.panel.phoneActionLabel })
        .getAttribute("href"),
    ).toBe(`tel:${publicSiteSettings.phone}`);
    expect(
      screen
        .getByRole("link", { name: publicSiteSettings.contactPage.panel.emailActionLabel })
        .getAttribute("href"),
    ).toMatch(new RegExp(`^mailto:${publicSiteSettings.inquiryEmail}\\?subject=`));
    expect(
      screen
        .getByRole("link", { name: publicSiteSettings.contactPage.guide.linkLabel })
        .getAttribute("href"),
    ).toMatch(new RegExp(`^mailto:${publicSiteSettings.inquiryEmail}\\?subject=`));
  });
});
