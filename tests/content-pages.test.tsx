// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import {
  getAboutPage,
  getApplications,
  getArticle,
  getArticles,
  getProduct,
} from "@/lib/content";
import type {
  SanityNews,
  SanityProduct,
} from "@/lib/sanity/queries";

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

const sanityImage =
  "https://cdn.sanity.io/images/project/production/bt8500.jpg";

function sanityProductFixture(
  overrides: Partial<SanityProduct> = {},
): SanityProduct {
  return {
    _id: "product-bt8500",
    category: "cleanliness",
    title: "Sanity 清浄度モニター",
    slug: "bt8500",
    model: "BT8500",
    summary: "Sanity で公開された日本語の製品概要です。",
    body: [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Sanity 製品説明" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "公開データだけを ",
          },
          {
            _type: "span",
            text: "静的ページへ反映します。",
          },
        ],
      },
    ],
    features: ["公開済みの特長"],
    applications: ["公開済みの用途"],
    specifications: [{ label: "測定方式", value: "Sanity" }],
    coverImage: {
      alt: "Sanity に登録した BT8500",
      asset: { url: sanityImage },
    },
    gallery: [],
    seoTitle: "Sanity 清浄度モニター 製品情報",
    seoDescription:
      "Sanity で公開された清浄度モニターの日本語製品情報です。",
    ...overrides,
  };
}

function sanityNewsFixture(
  overrides: Partial<SanityNews> = {},
): SanityNews {
  return {
    _id: "news-ozone-monitoring-equipment",
    title: "Sanity オゾン監視技術情報",
    slug: "ozone-monitoring-equipment",
    publishedAt: "2026-02-27",
    summary: "Sanity で公開された日本語の技術情報概要です。",
    body: [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "公開済みの技術情報本文です。",
          },
        ],
      },
    ],
    relatedProductSlugs: ["bt3500-oz"],
    coverImage: {
      alt: "Sanity に登録したオゾン監視技術情報",
      asset: { url: sanityImage },
    },
    gallery: [],
    seoTitle: "Sanity オゾン監視技術情報",
    seoDescription:
      "Sanity で公開されたオゾン監視に関する日本語の技術情報です。",
    ...overrides,
  };
}

describe("build content source", () => {
  it("uses deterministic local content without a Sanity project ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    vi.resetModules();

    try {
      const { getContentSource } = await import("@/lib/content");

      expect(getContentSource()).toBe("local");
      expect(getContentSource()).toBe("local");
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("falls back locally when a malformed public project ID cannot create a client", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SANITY_PROJECT_ID",
      "malformed project id!",
    );
    vi.resetModules();

    try {
      const { getContentSource } = await import("@/lib/content");

      expect(getContentSource()).toBe("local");
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("normalizes available public Sanity content by family", async () => {
    const { createContentSnapshot } = await import("@/lib/content");

    const snapshot = createContentSnapshot({
      sanityConfigured: true,
      sanityProducts: [
        sanityProductFixture(),
        sanityProductFixture({
          _id: "product-bt8200-malformed",
          model: "BT8200",
          slug: "bt8200",
          title: "",
        }),
        sanityProductFixture({
          _id: "product-unapproved",
          model: "UNAPPROVED",
          slug: "unapproved",
        }),
      ],
      sanityNews: [sanityNewsFixture()],
    });

    expect(snapshot.source).toBe("sanity");
    expect(snapshot.products).toHaveLength(45);
    expect(snapshot.articles).toHaveLength(17);
    expect(
      snapshot.products.find(({ slug }) => slug === "bt8500"),
    ).toMatchObject({
      category: "cleanliness",
      description: "Sanity で公開された日本語の製品概要です。",
      route: "/products/cleanliness/bt8500",
      seoDescription:
        "Sanity で公開された清浄度モニターの日本語製品情報です。",
      seoTitle: "Sanity 清浄度モニター 製品情報",
      title: "Sanity 清浄度モニター",
    });
    expect(
      snapshot.products.find(({ slug }) => slug === "bt8500")?.images,
    ).toEqual([
      { alt: "Sanity に登録した BT8500", src: sanityImage },
    ]);
    expect(
      snapshot.products.find(({ slug }) => slug === "bt8500")?.sections,
    ).toEqual([
      {
        heading: "Sanity 製品説明",
        paragraphs: ["公開データだけを 静的ページへ反映します。"],
      },
    ]);
    expect(
      snapshot.products.find(({ slug }) => slug === "bt8200")?.title,
    ).toBe(getProduct("cleanliness", "bt8200")?.title);
    expect(
      snapshot.products.find(({ slug }) => slug === "unapproved"),
    ).toBeUndefined();
    expect(
      snapshot.articles.find(
        ({ slug }) => slug === "ozone-monitoring-equipment",
      ),
    ).toMatchObject({
      seoDescription:
        "Sanity で公開されたオゾン監視に関する日本語の技術情報です。",
      seoTitle: "Sanity オゾン監視技術情報",
      title: "Sanity オゾン監視技術情報",
    });
    expect(resolveSourceMediaPath(sanityImage)).toBe(sanityImage);
  });

  it("settles product and news reads independently", async () => {
    const { loadContentSnapshot } = await import("@/lib/content");
    const localProductTitle = getProduct("cleanliness", "bt8500")?.title;
    const localArticleTitle = getArticle(
      "ozone-monitoring-equipment",
    )?.title;

    const productAvailable = await loadContentSnapshot({
      sanityConfigured: true,
      readProducts: async () => [sanityProductFixture()],
      readNews: async () => {
        throw new Error("news unavailable");
      },
    });
    expect(
      productAvailable.products.find(({ slug }) => slug === "bt8500")
        ?.title,
    ).toBe("Sanity 清浄度モニター");
    expect(
      productAvailable.articles.find(
        ({ slug }) => slug === "ozone-monitoring-equipment",
      )?.title,
    ).toBe(localArticleTitle);

    const newsAvailable = await loadContentSnapshot({
      sanityConfigured: true,
      readProducts: async () => {
        throw new Error("products unavailable");
      },
      readNews: async () => [sanityNewsFixture()],
    });
    expect(
      newsAvailable.products.find(({ slug }) => slug === "bt8500")
        ?.title,
    ).toBe(localProductTitle);
    expect(
      newsAvailable.articles.find(
        ({ slug }) => slug === "ozone-monitoring-equipment",
      )?.title,
    ).toBe("Sanity オゾン監視技術情報");
  });
});

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
    async () => {
      const applications = getApplications();
      const { container } = render(await ApplicationsPage());

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

  it("lists only case-classified records on the cases index", async () => {
    const { container } = render(await ApplicationCasesPage());
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
  it("links all 17 insights once in deterministic newest-first order", async () => {
    const articles = getArticles();
    const expected = orderArticlesByDate(articles);
    const { container } = render(await InsightsPage());
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
    const applicationsPage = await ApplicationsPage();
    const insightsPage = await InsightsPage();
    const { container } = render(
      <>
        {applicationsPage}
        {application}
        {insightsPage}
        {insight}
      </>,
    );

    expect(container.textContent).not.toMatch(forbiddenContactPattern);
    expect(container.innerHTML).not.toMatch(forbiddenContactPattern);
  });
});
