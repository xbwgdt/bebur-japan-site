// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFile } from "node:fs/promises";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HomePage from "@/app/page";
import ProductsPage from "@/app/products/page";
import ProductDetailPage from "@/app/products/[category]/[slug]/page";
import { ProductCard } from "@/components/product-card";
import { ProductExplorer } from "@/components/product-explorer";
import { getProduct, getProducts } from "@/lib/content";
import { siteConfig } from "@/lib/constants";
import { productCategoryLabels, productRoute } from "@/lib/routes";

afterEach(cleanup);

const products = getProducts();

function renderExplorer() {
  return render(<ProductExplorer products={products} />);
}

function expectLocalizedRenderedImages(container: HTMLElement): void {
  const images = Array.from(container.querySelectorAll("img"));

  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    const source = decodeURIComponent(image.getAttribute("src") ?? "");

    expect(source).toMatch(/\/(?:source-media|media)\//);
    expect(source).not.toMatch(/\/(?:products|applications)\//);
  }
}

describe("ProductExplorer", () => {
  it("announces all 45 products initially", () => {
    renderExplorer();

    expect(screen.getByRole("status").textContent).toBe("45件の製品");
  });

  it("matches a product model case-insensitively", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "bt-9000l" } },
    );

    expect(screen.getByRole("status").textContent).toBe("1件の製品");
    expect(
      screen.getByRole("heading", {
        name: "BT-9000L 凝集インテリジェント薬注制御システム",
      }),
    ).toBeTruthy();
  });

  it("matches Japanese product titles", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "オンラインフッ化物分析計" } },
    );

    expect(screen.getByRole("status").textContent).toBe("1件の製品");
    expect(screen.getByText("BT6308-F200")).toBeTruthy();
  });

  it("ignores leading and trailing query whitespace", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "   BT8500   " } },
    );

    expect(screen.getByRole("status").textContent).toBe("1件の製品");
    expect(
      screen.getByRole("heading", { name: "BT8500 オンライン液中粒子計" }),
    ).toBeTruthy();
  });

  it("returns the exact reviewed category count", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("combobox", { name: "製品カテゴリー" }),
      { target: { value: "gas-detection" } },
    );

    expect(screen.getByRole("status").textContent).toBe("14件の製品");
  });

  it("combines category and query filters", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("combobox", { name: "製品カテゴリー" }),
      { target: { value: "water-quality" } },
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "bt6308-oz" } },
    );

    expect(screen.getByRole("status").textContent).toBe("1件の製品");
    expect(
      screen.getByRole("heading", {
        name: "BT6308-OZ オンラインオゾン分析計",
      }),
    ).toBeTruthy();
  });

  it("shows no-result guidance and reset restores all products", () => {
    renderExplorer();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "該当しない型式" } },
    );

    expect(screen.getByRole("status").textContent).toBe("0件の製品");
    expect(
      screen.getByText(
        "条件に一致する製品がありません。検索語またはカテゴリーを変更してください。",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "絞り込みを解除" }));

    expect(screen.getByRole("status").textContent).toBe("45件の製品");
    expect(
      (
        screen.getByRole("searchbox", {
          name: "製品名・型式で検索",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("combobox", {
          name: "製品カテゴリー",
        }) as HTMLSelectElement
      ).value,
    ).toBe("all");
  });

  it("does not mutate the input products array", () => {
    const snapshot = structuredClone(products);

    renderExplorer();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "製品名・型式で検索" }),
      { target: { value: "BT-7000" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "製品カテゴリー" }),
      { target: { value: "water-quality" } },
    );

    expect(products).toEqual(snapshot);
  });
});

describe("product cards and detail content", () => {
  it("uses the reviewed local image, Japanese alt, and exact product route", () => {
    const product = getProduct("cleanliness", "bt8500");
    expect(product).toBeDefined();

    const { container } = render(<ProductCard product={product!} />);

    const image = screen.getByRole("img", { name: product!.images[0].alt });
    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
      "/source-media/",
    );
    expectLocalizedRenderedImages(container);
    expect(
      screen.getByRole("link", { name: "詳細を見る" }).getAttribute("href"),
    ).toBe(productRoute(product!));
  });

  it("includes model and title in the distributor inquiry link", async () => {
    const product = getProduct("water-quality", "bt-7000");
    expect(product).toBeDefined();

    render(
      await ProductDetailPage({
        params: Promise.resolve({
          category: product!.category,
          slug: product!.slug,
        }),
      }),
    );

    const inquiryLink = screen.getByRole("link", {
      name: "メールで問い合わせ",
    });
    const decodedHref = decodeURIComponent(
      inquiryLink.getAttribute("href") ?? "",
    );

    expect(decodedHref).toContain("mailto:info@newtree-i.com");
    expect(decodedHref).toContain(product!.model);
    expect(decodedHref).toContain(product!.title);
  });

  it("renders every specification with a caption and row headers", async () => {
    const product = getProduct("water-quality", "bt-7000");
    expect(product).toBeDefined();

    render(
      await ProductDetailPage({
        params: Promise.resolve({
          category: product!.category,
          slug: product!.slug,
        }),
      }),
    );

    expect(
      screen.getByText(`${product!.model} 主な仕様`, {
        selector: "caption",
      }),
    ).toBeTruthy();

    const table = screen.getByRole("table");
    const rowHeaders = table.querySelectorAll('th[scope="row"]');
    expect(rowHeaders).toHaveLength(product!.specifications.length);
    product!.specifications.forEach((specification, index) => {
      expect(rowHeaders[index].textContent).toBe(specification.label);
    });
  });
});

describe("home product discovery", () => {
  it("uses the captured source hero image and Japanese source hierarchy", async () => {
    const { container } = render(await HomePage());
    const sourceHero = screen.getByTestId("source-hero");
    const image = sourceHero.querySelector("img");

    expect(
      screen.getByRole("heading", {
        name: "水質とガスを、より確かに。",
        level: 1,
      }),
    ).toBeTruthy();
    expect(image?.getAttribute("alt")).toBe("");
    expect(
      within(sourceHero).queryByRole("img", {
        name: "水質とガスを、より確かに。",
      }),
    ).toBeNull();
    expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(
      "/source-media/1761791363673595-08e6a0255dfd817e.jpg",
    );
    expectLocalizedRenderedImages(container);
    expect(
      container.querySelectorAll('[data-testid="source-card-grid"]'),
    ).toHaveLength(3);
    expect(
      container.querySelector('[data-source-variant="categories"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-source-variant="applications"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-source-variant="products"]'),
    ).not.toBeNull();
  });

  it("renders the product family banner and source catalog landmark", async () => {
    const { container } = render(await ProductsPage());
    const sourceHero = screen.getByTestId("source-hero");
    const image = sourceHero.querySelector("img");

    expect(
      screen.getByRole("heading", { name: "製品情報", level: 1 }),
    ).toBeTruthy();
    expect(image?.getAttribute("alt")).toBe("");
    expect(decodeURIComponent(image?.getAttribute("src") ?? "")).toContain(
      "/source-media/1762147356906250-b3ac3b47b4049a96.jpg",
    );
    expect(screen.getByRole("region", { name: "製品一覧" })).toBeTruthy();
    expectLocalizedRenderedImages(container);
  });

  it("shows the five reviewed categories and required section headings", async () => {
    const { container } = render(await HomePage());
    const categorySection = screen.getByRole("region", {
      name: "計測課題から選べる製品ラインアップ",
    });
    const scopedCategories = within(categorySection);
    expect(
      scopedCategories.getByRole("heading", {
        name: "計測課題から選べる製品ラインアップ",
      }),
    ).toBeTruthy();

    for (const label of Object.values(productCategoryLabels)) {
      expect(
        scopedCategories.getByRole("heading", { name: label, level: 3 }),
      ).toBeTruthy();
    }

    expect(
      screen.getByRole("heading", {
        name: "現場に応える、確かな計測技術",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "多様な産業で、品質と安全を支える",
      }),
    ).toBeTruthy();
    expect(container.innerHTML).not.toMatch(
      /WeChat|微信|Douyin|抖音|ICP|中国営業|sales@bebur|400-\d/i,
    );
  });

  it("follows the captured homepage sequence and preserves Japanese actions", async () => {
    render(await HomePage());

    const sectionMarkers = [
      screen.getByText("PRODUCT CENTER"),
      screen.getByText("ABOUT US"),
      screen.getByText("INDUSTRY APPLICATIONS"),
      screen.getByText("NEWS CENTER"),
    ];

    for (let index = 1; index < sectionMarkers.length; index += 1) {
      expect(
        sectionMarkers[index - 1].compareDocumentPosition(
          sectionMarkers[index],
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    const hero = screen.getByTestId("source-hero");
    expect(
      within(hero)
        .getByRole("link", { name: "製品情報を見る" })
        .getAttribute("href"),
    ).toBe("/products");
    expect(
      within(hero)
        .getByRole("link", { name: "お問い合わせ" })
        .getAttribute("href"),
    ).toBe("/contact");
    expect(within(hero).getByText(siteConfig.distributorLabel)).toBeTruthy();
  });

  it("does not globally clip document horizontal overflow", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);

    const rules = Array.from(style.sheet?.cssRules ?? []);
    const htmlRule = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === "html",
    );
    const bodyRule = rules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === "body",
    );

    expect(htmlRule?.style.getPropertyValue("overflow-x")).not.toBe("hidden");
    expect(bodyRule?.style.getPropertyValue("overflow-x")).not.toBe("hidden");
  });

  it("places a wide specification table in a focusable horizontal scroller", async () => {
    const product = getProduct("water-quality", "bt-7000");
    expect(product).toBeDefined();

    render(
      await ProductDetailPage({
        params: Promise.resolve({
          category: product!.category,
          slug: product!.slug,
        }),
      }),
    );

    const table = screen.getByRole("table");
    const scroller = table.parentElement;

    expect(scroller?.classList.contains("specification-table__scroller")).toBe(
      true,
    );
    expect(scroller?.tabIndex).toBe(0);
    expect(scroller?.getAttribute("aria-label")).toBe(
      `${product!.model} 仕様表を横にスクロール`,
    );
  });
});
