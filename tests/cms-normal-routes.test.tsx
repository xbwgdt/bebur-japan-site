// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AboutDetailPage from "@/app/about/[slug]/page";
import ApplicationDetailPage from "@/app/applications/[slug]/page";
import ContactPage from "@/app/contact/page";
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
});
