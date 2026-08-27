import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  approvedHomeHero,
  buildHomeHeroPatch,
  resolvePublicAssetPath,
} from "../scripts/sync-home-hero-to-sanity.mjs";

describe("Sanity home hero synchronization", () => {
  it("keeps the approved home hero content and presentation", () => {
    expect(approvedHomeHero).toEqual({
      eyebrow: "WATER QUALITY & GAS DETECTION",
      title: "水質とガスを、より確かに。",
      summary:
        "Beburの精密計測技術で、水処理、製造、医薬、液冷設備の安全と品質管理を支えます。",
      backgroundImage: {
        src: "/source-media/1761791363673595-08e6a0255dfd817e.jpg",
        alt: "Beburの水質分析・ガス検知ソリューション",
      },
      primaryAction: { label: "製品情報を見る", href: "/products" },
      secondaryAction: { label: "お問い合わせ", href: "/contact" },
      style: {
        color: "brand",
        fontSize: "xl",
        alignment: "left",
        spacing: "normal",
        desktopTitleWrap: "nowrap",
      },
    });
  });

  it("patches only homeHero and never replaces the singleton", () => {
    const patch = buildHomeHeroPatch({
      hero: approvedHomeHero,
      assetId: "image-test-1920x1080-jpg",
    });

    expect(patch).toEqual({
      id: "siteSettings",
      set: {
        homeHero: {
          eyebrow: approvedHomeHero.eyebrow,
          title: approvedHomeHero.title,
          summary: approvedHomeHero.summary,
          backgroundImage: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: "image-test-1920x1080-jpg",
            },
            alt: approvedHomeHero.backgroundImage.alt,
          },
          primaryAction: approvedHomeHero.primaryAction,
          secondaryAction: approvedHomeHero.secondaryAction,
          style: approvedHomeHero.style,
        },
      },
    });

    const serialized = JSON.stringify(patch);
    expect(serialized).not.toContain("contactPage");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("inquiryEmail");
    expect(serialized).not.toContain("createOrReplace");
  });

  it("resolves a public URL beneath the public directory", () => {
    const root = path.resolve("test-workspace", "bebur");
    expect(resolvePublicAssetPath(root, approvedHomeHero.backgroundImage.src)).toBe(
      path.join(
        root,
        "public",
        "source-media",
        "1761791363673595-08e6a0255dfd817e.jpg",
      ),
    );
  });
});
