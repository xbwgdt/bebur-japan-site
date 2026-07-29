// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";
import RootLayout, { metadata } from "@/app/layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactCta, MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/constants";

afterEach(cleanup);

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/products", label: "製品情報" },
  { href: "/applications", label: "導入分野・事例" },
  { href: "/about/company-profile", label: "企業情報" },
  { href: "/insights", label: "ニュース・技術情報" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

function expectExactNavigationItems(navigation: HTMLElement): void {
  const links = Array.from(navigation.querySelectorAll("a"));

  expect(links).toHaveLength(6);
  expect(
    links.map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.trim(),
    })),
  ).toEqual(navigationItems);
}

describe("shared Bebur Japan components", () => {
  it("renders exactly six required items in each header navigation", () => {
    const { container } = render(createElement(Header));

    const desktopNavigation = screen.getByRole("navigation", {
      name: "メインナビゲーション",
    });
    const mobileNavigation = container.querySelector<HTMLElement>(
      'nav[aria-label="モバイルナビゲーション"]',
    );

    expect(mobileNavigation).not.toBeNull();
    expectExactNavigationItems(desktopNavigation);
    expectExactNavigationItems(mobileNavigation!);

    expect(screen.getByText(siteConfig.distributorLabel)).toBeTruthy();
    const wordmark = screen.getByRole("link", { name: "BEBUR JAPAN" });
    expect(wordmark.getAttribute("href")).toBe("/");
  });

  it("exports the exact default Japanese metadata", () => {
    expect(metadata.title).toEqual({
      default: "Bebur Japan｜水質分析・ガス検知の精密計測",
      template: "%s｜Bebur Japan",
    });
    expect(metadata.description).toBe(
      "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
    );
  });

  it("wraps pages with a skip link and one shared main landmark", () => {
    const markup = renderToStaticMarkup(
      createElement(
        RootLayout,
        null,
        createElement("p", null, "ページ本文"),
      ),
    );

    expect(markup).toContain('lang="ja"');
    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain(">本文へ移動</a>");
    expect(markup.match(/<main/g)).toHaveLength(1);
    expect(markup).toContain('id="main-content"');
  });

  it("marks the final breadcrumb as the current page", () => {
    render(
      createElement(Breadcrumbs, {
        items: [
          { label: "製品情報", href: "/products" },
          { label: "BT-7000 多項目水質分析計" },
        ],
      }),
    );

    const navigation = screen.getByRole("navigation", {
      name: "パンくずリスト",
    });
    const items = within(navigation).getAllByRole("listitem");
    expect(items[0].textContent).toContain("ホーム");
    expect(
      within(navigation)
        .getByText("BT-7000 多項目水質分析計")
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("renders a semantic section heading with optional supporting copy", () => {
    render(
      createElement(SectionHeading, {
        eyebrow: "MEASUREMENT",
        title: "精密計測",
        description: "水と空気を正確に測るための製品群です。",
        align: "center",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "精密計測", level: 2 }),
    ).toBeTruthy();
    expect(screen.getByText("MEASUREMENT")).toBeTruthy();
    expect(
      screen.getByText("水と空気を正確に測るための製品群です。"),
    ).toBeTruthy();
  });

  it("offers home and product links on the not-found page", () => {
    render(createElement(NotFound));

    expect(
      screen.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /ホーム/ }).getAttribute("href"),
    ).toBe("/");
    expect(
      screen.getByRole("link", { name: /製品情報/ }).getAttribute("href"),
    ).toBe("/products");
  });

  it("contains none of the forbidden China contact channels", () => {
    const markup = [
      renderToStaticMarkup(createElement(Header)),
      renderToStaticMarkup(createElement(Footer)),
      renderToStaticMarkup(createElement(ContactCta)),
      renderToStaticMarkup(createElement(MobileContactBar)),
    ].join("");

    expect(markup).not.toMatch(
      /WeChat|微信|Douyin|抖音|ICP|中国営業|sales@bebur|400-\d/i,
    );
  });
});
