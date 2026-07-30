// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AboutDetailPage from "@/app/about/[slug]/page";
import ApplicationDetailPage, {
  resolveRecommendedProducts,
} from "@/app/applications/[slug]/page";
import ApplicationsPage from "@/app/applications/page";
import ApplicationCasesPage, {
  applicationCaseSlugs,
} from "@/app/applications/cases/page";
import InsightDetailPage, {
  resolveRelatedProducts,
} from "@/app/insights/[slug]/page";
import InsightsPage, {
  orderArticlesByDate,
} from "@/app/insights/page";
import { ContentSections } from "@/components/content-sections";
import {
  getAboutPage,
  getApplications,
  getArticle,
  getArticles,
  getProduct,
} from "@/lib/content";

afterEach(cleanup);

const forbiddenContactPattern =
  /WeChat|微信|Douyin|抖音|ICP|中国営業|sales@bebur|400-\d/i;

const industryLabels = [
  "液冷",
  "上下水道・水処理",
  "化学",
  "医療・製薬",
  "油圧",
  "環境",
  "食品・飲料",
  "電力",
] as const;

const expectedCaseSlugs = [
  "liquid-cooling-cases",
  "plate-heat-exchanger-cleanliness",
  "manifold-cleanliness",
  "bt8200-cold-plate-liquid-cooling",
  "bt8200-liquid-cooling",
  "liquid-cooled-plate-cleanliness",
  "municipal-water-cases",
  "online-disinfectant-analyzer-waterworks",
  "bt8200-jiangnan-water-plant",
  "scm520-waterworks",
  "chemical-cases",
  "msf8100-metallurgical-industry",
  "medical-pharmaceutical-cases",
  "liquid-particle-counter-pharmaceutical",
  "hydraulic-cases",
  "environmental-protection-cases",
  "gt-3280-ou-landfill",
  "food-beverage-cases",
  "water-ozone-analyzer-beverage",
  "power-industry-cases",
  "scm530-power-plant-dosing",
  "scm530-jiangsu-power-plant",
] as const;

function expectLocalizedRenderedImages(container: HTMLElement): void {
  const images = Array.from(container.querySelectorAll("img"));

  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    const source = decodeURIComponent(image.getAttribute("src") ?? "");

    expect(source).toMatch(/\/(?:source-media|media)\//);
    expect(source).not.toMatch(/\/(?:products|applications)\//);
  }
}

describe("ContentSections", () => {
  it("renders every reviewed paragraph and bullet in source order", () => {
    const sections = [
      {
        heading: "測定条件",
        paragraphs: ["第一段落", "第二段落 https://example.com/long/path"],
        bullets: ["箇条書きA", "箇条書きB"],
      },
      {
        heading: "OCR注記",
        paragraphs: ["原文OCR注記：数値は掲載表記のままです。"],
      },
    ];

    const { container } = render(<ContentSections sections={sections} />);

    expect(
      Array.from(container.querySelectorAll("h2")).map(
        (heading) => heading.textContent,
      ),
    ).toEqual(["測定条件", "OCR注記"]);
    expect(
      Array.from(container.querySelectorAll("p")).map(
        (paragraph) => paragraph.textContent,
      ),
    ).toEqual([
      "第一段落",
      "第二段落 https://example.com/long/path",
      "原文OCR注記：数値は掲載表記のままです。",
    ]);
    expect(
      Array.from(container.querySelectorAll("li")).map(
        (item) => item.textContent,
      ),
    ).toEqual(["箇条書きA", "箇条書きB"]);
  });

  it("omits empty input and empty section wrappers", () => {
    const empty = render(<ContentSections sections={[]} />);
    expect(empty.container.innerHTML).toBe("");
    empty.unmount();

    const onlyEmptySection = render(
      <ContentSections
        sections={[{ heading: "空の節", paragraphs: [], bullets: [] }]}
      />,
    );
    expect(onlyEmptySection.container.innerHTML).toBe("");
  });
});

describe("application indexes and details", () => {
  it(
    "shows all eight industries and links every application exactly once",
    () => {
      const applications = getApplications();
      const { container } = render(<ApplicationsPage />);

      for (const label of industryLabels) {
        expect(screen.getByText(label)).toBeTruthy();
      }

      for (const application of applications) {
        expect(
          container.querySelectorAll(`a[href="${application.route}"]`),
        ).toHaveLength(1);
      }

      expect(
        screen
          .getByRole("link", { name: /導入事例一覧/ })
          .getAttribute("href"),
      ).toBe("/applications/cases");
    },
    15_000,
  );

  it("keeps all 31 records in one reviewed overview/case grouping", () => {
    const applications = getApplications();
    const classified = new Set(applicationCaseSlugs);

    expect(applicationCaseSlugs).toEqual(expectedCaseSlugs);
    expect(new Set(applicationCaseSlugs).size).toBe(22);
    expect(
      applications.filter(({ slug }) => !classified.has(slug)).map(
        ({ slug }) => slug,
      ),
    ).toHaveLength(9);
    expect(applications).toHaveLength(31);
  });

  it("lists only case-classified records on the cases index", () => {
    const { container } = render(<ApplicationCasesPage />);
    const linkedApplicationSlugs = getApplications()
      .filter(({ route }) =>
        container.querySelector(`a[href="${route}"]`),
      )
      .map(({ slug }) => slug);

    expect(new Set(linkedApplicationSlugs)).toEqual(
      new Set(expectedCaseSlugs),
    );
    expect(linkedApplicationSlugs).toHaveLength(expectedCaseSlugs.length);
  });

  it("renders every source section and only valid recommended products", async () => {
    const application = getApplications().find(
      ({ slug }) => slug === "bt8200-cold-plate-liquid-cooling",
    );
    expect(application).toBeDefined();

    const { container } = render(
      await ApplicationDetailPage({
        params: Promise.resolve({ slug: application!.slug }),
      }),
    );

    expect(
      screen.getByRole("region", {
        name: `${application!.title} 掲載画像`,
      }),
    ).toBeTruthy();
    expectLocalizedRenderedImages(container);

    for (const section of application!.sections) {
      expect(
        screen.getByRole("heading", { name: section.heading }),
      ).toBeTruthy();
      for (const paragraph of section.paragraphs) {
        expect(screen.getByText(paragraph)).toBeTruthy();
      }
    }

    const recommended = getProduct("cleanliness", "bt8200");
    expect(recommended).toBeDefined();
    expect(
      screen.getByRole("link", { name: "詳細を見る" }).getAttribute("href"),
    ).toBe(recommended!.route);

    expect(
      resolveRecommendedProducts(["bt8200", "not-a-product"]).map(
        ({ slug }) => slug,
      ),
    ).toEqual(["bt8200"]);
  });
});

describe("company pages", () => {
  it("distinguishes source-reviewed Bebur facts from the Japan distributor", async () => {
    const { container } = render(
      await AboutDetailPage({
        params: Promise.resolve({ slug: "company-profile" }),
      }),
    );
    const aboutPage = getAboutPage("company-profile");
    expect(aboutPage).toBeDefined();

    const brandSection = screen
      .getByRole("heading", { name: "Beburブランド・企業情報" })
      .closest("section");
    const distributorSection = screen
      .getByRole("heading", { name: "日本国内の販売・お問い合わせ" })
      .closest("aside");

    expect(brandSection).toBeTruthy();
    expect(distributorSection).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: `${aboutPage!.title} 掲載画像`,
      }),
    ).toBeTruthy();
    expectLocalizedRenderedImages(container);
    expect(
      within(distributorSection as HTMLElement).getByText(
        "Bebur 日本総代理店｜新樹産業株式会社",
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toMatch(
      /新樹産業株式会社.*(?:世界本社|グローバル本社|製造元)/,
    );
  });

  it("does not invent Japanese regulatory approval on certifications", async () => {
    const certification = getAboutPage("certifications");
    expect(certification).toBeDefined();

    render(
      await AboutDetailPage({
        params: Promise.resolve({ slug: "certifications" }),
      }),
    );

    for (const certificate of certification!.sections[0].bullets ?? []) {
      expect(screen.getByText(certificate)).toBeTruthy();
    }
    expect(document.body.textContent).not.toMatch(
      /日本国内で(?:認証|承認)|日本の(?:認証|承認)|日本規制/,
    );
  });
});

describe("insight indexes and details", () => {
  it("links all 17 insights once in deterministic newest-first order", () => {
    const articles = getArticles();
    const expected = orderArticlesByDate(articles);
    const { container } = render(<InsightsPage />);
    const links = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("a.insight-card__link"),
    );

    expect(links).toHaveLength(17);
    expect(links.map(({ pathname }) => pathname)).toEqual(
      expected.map(({ route }) => route),
    );
    for (const article of articles) {
      expect(
        container.querySelectorAll(`a[href="${article.route}"]`),
      ).toHaveLength(1);
    }
  });

  it("renders a semantic source date and filters invalid related products", async () => {
    const article = getArticle("ozone-monitoring-equipment");
    expect(article?.publishedAt).toBe("2026-02-27");

    const { container } = render(
      await InsightDetailPage({
        params: Promise.resolve({ slug: article!.slug }),
      }),
    );

    const time = container.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe("2026-02-27");
    expect(time?.textContent).toBe("2026年2月27日");
    expect(
      screen.getByRole("region", {
        name: `${article!.title} 掲載画像`,
      }),
    ).toBeTruthy();
    expectLocalizedRenderedImages(container);
    for (const section of article!.sections) {
      expect(
        screen.getByRole("heading", { name: section.heading }),
      ).toBeTruthy();
    }

    expect(
      resolveRelatedProducts(["bt3500-oz", "not-a-product"]).map(
        ({ slug }) => slug,
      ),
    ).toEqual(["bt3500-oz"]);
  });
});

describe("content image and contact policy", () => {
  it("uses only local image paths with Japanese alternative text", () => {
    const records = [
      ...getApplications(),
      ...getArticles(),
      ...(["company-profile", "certifications", "culture", "history", "exhibitions"]
        .map(getAboutPage)
        .filter((record) => record !== undefined)),
    ];

    for (const record of records) {
      for (const image of record.images) {
        expect(image.src).toMatch(/^\/(?!\/)/);
        expect(image.alt).toMatch(
          /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/,
        );
      }
    }
  });

  it("does not render forbidden overseas contact channels", async () => {
    const application = await ApplicationDetailPage({
      params: Promise.resolve({ slug: "electric-power-industry" }),
    });
    const insight = await InsightDetailPage({
      params: Promise.resolve({ slug: "ozone-monitoring-equipment" }),
    });
    const { container } = render(
      <>
        <ApplicationsPage />
        {application}
        <InsightsPage />
        {insight}
      </>,
    );

    expect(container.textContent).not.toMatch(forbiddenContactPattern);
    expect(container.innerHTML).not.toMatch(forbiddenContactPattern);
  });
});
