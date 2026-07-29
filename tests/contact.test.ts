import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ContactCta, MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { buildMailto, siteConfig } from "@/lib/constants";

afterEach(cleanup);

describe("Bebur Japan contact details", () => {
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
