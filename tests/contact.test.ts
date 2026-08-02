// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import ContactPage from "@/app/contact/page";
import { ContactCta, MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { buildMailto, siteConfig } from "@/lib/constants";

afterEach(cleanup);

describe("Bebur Japan contact details", () => {
  it("keeps the approved inquiry address and excludes obsolete contacts from localized CMS content", async () => {
    const content = await readFile(
      join(process.cwd(), "content", "ja", "pages.json"),
      "utf8",
    );
    const pages = JSON.parse(content) as Array<{
      route: string;
      contact?: unknown;
    }>;

    expect(content).toContain("info@newtree-i.com");
    expect(content).not.toMatch(
      /18001379750|010-87653191|0838-2236056|sales@bebur\.net|wechat|douyin/i,
    );
    expect(pages.find(({ route }) => route === "/contact")?.contact).toEqual({
      distributorName: "Bebur 日本総代理店",
      companyName: "新樹産業株式会社",
      postalCode: "340-0043",
      address: "埼玉県草加市草加2－13－21－7",
      phone: "080-5189-8663",
      inquiryEmail: "info@newtree-i.com",
    });
  });

  it("exposes the approved distributor identity", () => {
    expect(siteConfig.company).toBe("新樹産業株式会社");
    expect(siteConfig.distributorLabel).toBe(
      "Bebur 日本総代理店｜新樹産業株式会社",
    );
    expect(siteConfig.postalCode).toBe("〒340-0043");
    expect(siteConfig.address).toBe("埼玉県草加市草加2－13－21－7");
    expect(siteConfig.phone).toBe("080-5189-8663");
    expect(siteConfig.email).toBe("info@newtree-i.com");
  });

  it("builds the product inquiry email link", () => {
    expect(buildMailto("BT-7000 多項目水質分析計")).toBe(
      "mailto:info@newtree-i.com?subject=BT-7000%20%E5%A4%9A%E9%A0%85%E7%9B%AE%E6%B0%B4%E8%B3%AA%E5%88%86%E6%9E%90%E8%A8%88%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B",
    );
  });

  it("renders every approved contact detail in the footer", () => {
    render(createElement(Footer));

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(siteConfig.distributorLabel)).toBeTruthy();
    expect(within(footer).getByText(siteConfig.postalCode)).toBeTruthy();
    expect(within(footer).getByText(siteConfig.address)).toBeTruthy();
    expect(
      within(footer)
        .getByRole("link", { name: siteConfig.phone })
        .getAttribute("href"),
    ).toBe(`tel:${siteConfig.phone}`);
    expect(
      within(footer)
        .getByRole("link", { name: siteConfig.email })
        .getAttribute("href"),
    ).toBe(
      "mailto:info@newtree-i.com?subject=Bebur%20%E8%A3%BD%E5%93%81%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B",
    );
  });

  it("builds a product-specific contact call to action", () => {
    render(
      createElement(ContactCta, {
        subject: "BT-7000 多項目水質分析計",
      }),
    );

    expect(
      screen.getByText(/製品選定、仕様の確認、お見積もり/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /電話で相談/ })
        .getAttribute("href"),
    ).toBe(`tel:${siteConfig.phone}`);

    const emailLink = screen.getByRole("link", { name: /メールで問い合わせ/ });
    expect(emailLink.getAttribute("href")).toBe(
      buildMailto("BT-7000 多項目水質分析計"),
    );
    expect(decodeURIComponent(emailLink.getAttribute("href") ?? "")).toContain(
      "BT-7000 多項目水質分析計",
    );
  });

  it("gives the mobile contact bar accessible telephone and email actions", () => {
    render(createElement(MobileContactBar));

    expect(
      screen
        .getByRole("link", { name: /電話で相談/ })
        .getAttribute("href"),
    ).toBe(`tel:${siteConfig.phone}`);
    expect(
      screen
        .getByRole("link", { name: /メールで問い合わせ/ })
        .getAttribute("href"),
    ).toBe(buildMailto("Bebur 製品"));
  });
});

describe("contact page", () => {
  it("shows the exact approved Japan distributor identity and contact details", async () => {
    render(await ContactPage());

    expect(screen.getByText("Bebur 日本総代理店")).toBeTruthy();
    expect(screen.getByText(siteConfig.company)).toBeTruthy();
    expect(screen.getByText(siteConfig.postalCode)).toBeTruthy();
    expect(screen.getByText(siteConfig.address)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: siteConfig.phone }).getAttribute("href"),
    ).toBe("tel:080-5189-8663");
    expect(
      screen.getByRole("link", { name: siteConfig.email }).getAttribute("href"),
    ).toBe(buildMailto("Bebur 製品"));
  });

  it("separates the approved telephone CTA from email inquiry links", async () => {
    render(await ContactPage());

    expect(
      screen
        .getByRole("link", { name: "電話で相談" })
        .getAttribute("href"),
    ).toBe("tel:080-5189-8663");
    expect(
      screen
        .getByRole("link", { name: "メールでお問い合わせ" })
        .getAttribute("href"),
    ).toMatch(/^mailto:info@newtree-i\.com\?subject=/);
    expect(
      screen
        .getByRole("link", { name: "メールで問い合わせ" })
        .getAttribute("href"),
    ).toMatch(/^mailto:info@newtree-i\.com\?subject=/);
    expect(screen.queryByText("オンライン相談（メール）")).toBeNull();
  });

  it("contains no form controls, submission behavior, or forbidden contacts", async () => {
    const { container } = render(await ContactPage());

    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).not.toMatch(
      /WeChat|微信|Douyin|抖音|ICP|中国営業|sales@bebur|400-\d/i,
    );
    expect(container.innerHTML).not.toMatch(
      /maps|latitude|longitude|submit|localStorage|sessionStorage/i,
    );
  });

  it("presents exactly the approved three-step inquiry guide", async () => {
    render(await ContactPage());

    const guide = screen
      .getByRole("heading", { name: "お問い合わせの流れ" })
      .closest("section");
    expect(guide).toBeTruthy();
    const steps = within(guide as HTMLElement).getAllByRole("listitem");

    expect(steps).toHaveLength(3);
    expect(steps.map(({ textContent }) => textContent)).toEqual([
      "製品・用途を確認",
      "電話またはメールで相談",
      "仕様・見積もりをご案内",
    ]);
  });
});
