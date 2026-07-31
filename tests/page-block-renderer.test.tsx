// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageBlockRenderer } from "@/components/page-block-renderer";
import type { PageBlock, PageBlockInput } from "@/lib/page-blocks";

afterEach(cleanup);

describe("PageBlockRenderer", () => {
  it("ignores unknown and absent blocks without interrupting the page", () => {
    const { container } = render(
      <PageBlockRenderer
        blocks={[undefined, { _type: "unsupported", title: "Ignored" }] as PageBlockInput[]}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("keeps valid modules when unknown blocks surround them", () => {
    render(
      <PageBlockRenderer
        blocks={[
          { _type: "unsupported-before" },
          {
            _type: "cta",
            title: "お問い合わせ",
            label: "相談する",
            href: "/contact",
          },
          { _type: "unsupported-after" },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "お問い合わせ", level: 2 }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "相談する" }).getAttribute("href"),
    ).toBe("/contact");
  });

  it("maps only approved style presets to renderer class names", () => {
    const { container } = render(
      <PageBlockRenderer
        blocks={[
          {
            _type: "cta",
            title: "お問い合わせ",
            label: "相談する",
            href: "/contact",
            color: "brand",
            fontSize: "lg",
            alignment: "center",
            spacing: "spacious",
            desktopTitleWrap: "nowrap",
          },
          {
            _type: "cta",
            title: "Ignored style values",
            label: "相談する",
            href: "/contact",
            color: "url(javascript:alert(1))",
            fontSize: "massive",
            alignment: "diagonal",
            spacing: "zero",
          },
        ] as PageBlock[]}
      />,
    );

    const blocks = container.querySelectorAll(".page-block--cta");
    expect(blocks[0]?.className).toContain("page-block--color-brand");
    expect(blocks[0]?.className).toContain("page-block--font-lg");
    expect(blocks[0]?.className).toContain("page-block--align-center");
    expect(blocks[0]?.className).toContain("page-block--spacing-spacious");
    expect(blocks[0]?.className).toContain("page-block--title-nowrap");
    expect(blocks[1]?.className).not.toContain("javascript");
    expect(blocks[1]?.className).not.toContain("massive");
    expect(blocks[1]?.className).not.toContain("diagonal");
    expect(blocks[1]?.className).not.toContain("zero");
  });

  it("renders gallery image alternative text", () => {
    render(
      <PageBlockRenderer
        blocks={[
          {
            _type: "gallery",
            title: "設置事例",
            images: [
              {
                alt: "水質分析計を設置した工場設備",
                asset: { url: "https://cdn.sanity.io/images/project/production/factory.jpg" },
              },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: "水質分析計を設置した工場設備" }),
    ).toBeTruthy();
  });
});
