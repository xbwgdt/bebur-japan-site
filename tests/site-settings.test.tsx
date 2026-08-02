// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { buildRootMetadata } from "@/app/layout";
import HomePage from "@/app/page";
import { ContactCta, MobileContactBar } from "@/components/contact-cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  localPublicSiteSettings,
  resolveContactPanelStyle,
  resolveHomeHeroStyle,
  resolvePublicSiteSettings,
} from "@/lib/site-settings";

afterEach(cleanup);

const remoteSettings = resolvePublicSiteSettings({
  navigationLabels: {
    home: "トップ",
    products: "製品を探す",
    applications: "導入事例",
    company: "会社案内",
    news: "技術ニュース",
    contact: "ご相談",
  },
  distributorName: "Bebur 日本総代理店",
  companyName: "新樹産業株式会社",
  postalCode: "340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  inquiryEmail: "info@newtree-i.com",
  footerText: "日本正規窓口｜新樹産業株式会社",
  defaultSeoTitle: "Bebur Japan｜CMSで管理する精密計測情報",
  defaultSeoDescription:
    "Bebur Japanが公開する水質分析、ガス検知、清浄度測定、薬注制御の製品情報と、日本国内向けの技術サポート情報をご案内します。",
  defaultOgImage: {
    alt: "Bebur Japanの精密計測ソリューション",
    asset: {
      url: "https://cdn.sanity.io/images/project/production/site-og.jpg",
    },
  },
});

describe("safe public site settings", () => {
  it("renders the home hero image alt text and desktop nowrap preset", async () => {
    const { container } = render(await HomePage());
    const hero = screen.getByTestId("source-hero");

    expect(
      within(hero).getByAltText(
        localPublicSiteSettings.homeHero.backgroundImage.alt,
      ),
    ).not.toBeNull();
    expect(
      container
        .querySelector(".source-home-hero")
        ?.classList.contains("source-home-hero--title-nowrap"),
    ).toBe(true);
  });

  it("uses only approved home hero presentation presets", () => {
    const settings = resolvePublicSiteSettings({
      homeHero: {
        title: "CMS home title",
        eyebrow: "CMS EYEBROW",
        summary: "CMS summary",
        style: {
          color: "javascript:alert(1)",
          fontSize: "9rem",
          alignment: "right",
          spacing: "calc(100vw)",
          desktopTitleWrap: "nowrap",
        },
      },
    });

    expect(settings.homeHero.style).toEqual({
      color: localPublicSiteSettings.homeHero.style.color,
      fontSize: localPublicSiteSettings.homeHero.style.fontSize,
      alignment: localPublicSiteSettings.homeHero.style.alignment,
      spacing: localPublicSiteSettings.homeHero.style.spacing,
      desktopTitleWrap: "nowrap",
    });
    expect(resolveHomeHeroStyle(settings.homeHero.style)).toContain(
      "source-home-hero--title-nowrap",
    );
    expect(resolveHomeHeroStyle(settings.homeHero.style)).not.toContain(
      "javascript:alert",
    );
  });

  it("preserves safe contact page copy, guide steps, and presentation presets", () => {
    const settings = resolvePublicSiteSettings({
      contactPage: {
        panel: {
          label: "Bebur 日本総代理店",
          description: "日本国内の製品選定とお見積もりをご案内します。",
          phoneActionLabel: "電話で相談",
          emailActionLabel: "メールでお問い合わせ",
          style: { color: "light", fontSize: "md", fontFamily: "sans" },
        },
        guide: {
          eyebrow: "INQUIRY GUIDE",
          title: "お問い合わせの流れ",
          steps: [
            "製品・用途を確認",
            "電話またはメールで相談",
            "仕様・見積もりをご案内",
          ],
          linkLabel: "メールで問い合わせ",
          style: {
            color: "deepBlue",
            fontSize: "md",
            fontFamily: "sans",
          },
        },
      },
    });

    expect(settings.contactPage.panel.label).toBe("Bebur 日本総代理店");
    expect(settings.contactPage.guide.steps).toEqual([
      "製品・用途を確認",
      "電話またはメールで相談",
      "仕様・見積もりをご案内",
    ]);
    expect(settings.contactPage.guide.style).toEqual({
      color: "deepBlue",
      fontSize: "md",
      fontFamily: "sans",
    });
    expect(resolveContactPanelStyle(settings.contactPage.guide.style)).toContain(
      "contact-card--color-deep-blue",
    );
  });

  it("falls back to local contact page settings for invalid presets and guide steps", () => {
    const settings = resolvePublicSiteSettings({
      contactPage: {
        panel: {
          label: "<script>alert(1)</script>",
          description: "",
          phoneActionLabel: "",
          emailActionLabel: "<b>unsafe</b>",
          style: {
            color: "javascript:alert(1)",
            fontSize: "9rem",
            fontFamily: "Comic Sans",
          },
        },
        guide: {
          eyebrow: "",
          title: "<script>alert(1)</script>",
          steps: ["", "<b>unsafe</b>", 42],
          linkLabel: "",
          style: {
            color: "#000000",
            fontSize: "calc(100vw)",
            fontFamily: "url(evil)",
          },
        },
      },
    });

    expect(settings.contactPage).toEqual(localPublicSiteSettings.contactPage);
  });

  it("falls back locally for missing or unapproved remote values", () => {
    expect(resolvePublicSiteSettings(null)).toEqual(
      localPublicSiteSettings,
    );
    expect(
      resolvePublicSiteSettings({
        navigationLabels: {
          home: "<script>alert(1)</script>",
        },
        distributorName: "別の日本総代理店",
        companyName: "別会社株式会社",
        postalCode: "100-0001",
        address: "東京都千代田区1-1",
        phone: "03-1234-5678",
        inquiryEmail: "valid@example.com",
        footerText: "<b>unsafe</b>",
        defaultSeoTitle: "short",
        defaultSeoDescription: "short",
        defaultOgImage: {
          alt: "危険な画像",
          asset: { url: "https://www.bebur.net/remote-og.jpg" },
        },
      }),
    ).toEqual(localPublicSiteSettings);
  });

  it("uses safe remote navigation, footer, contacts, and metadata", () => {
    const { container } = render(
      <>
        <Header settings={remoteSettings} />
        <Footer settings={remoteSettings} />
        <ContactCta settings={remoteSettings} />
        <MobileContactBar settings={remoteSettings} />
      </>,
    );

    expect(
      within(screen.getByTestId("source-header")).getAllByRole("link", {
        name: "製品を探す",
      }),
    ).toHaveLength(2);
    expect(
      screen.getAllByText("日本正規窓口｜新樹産業株式会社"),
    ).toHaveLength(2);
    expect(
      container.querySelector(`a[href="tel:${remoteSettings.phone}"]`),
    ).not.toBeNull();
    expect(container.innerHTML).toContain(
      `mailto:${remoteSettings.inquiryEmail}`,
    );

    const metadata = buildRootMetadata(remoteSettings);
    expect(metadata.title).toEqual({
      default: remoteSettings.defaultSeoTitle,
      template: "%s｜Bebur Japan",
    });
    expect(metadata.description).toBe(
      remoteSettings.defaultSeoDescription,
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: remoteSettings.defaultOgImage.src,
        alt: remoteSettings.defaultOgImage.alt,
      },
    ]);
  });
});
