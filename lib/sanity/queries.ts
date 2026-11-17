import type { QueryParams } from "@sanity/client";

import { getSanityClient } from "./client";
import type { PageBlock } from "../page-blocks";
import type { SanityHomeCarousel } from "../home-carousel";
import { applicationProductPageSlugs } from "../page-enhancements";

export type SanityImage = {
  asset?: {
    _ref?: string;
    url?: string;
  };
  alt?: string;
};

export type SanityProduct = {
  _id: string;
  category: string;
  title: string;
  slug: string;
  model: string;
  summary: string;
  principle?: string;
  body: unknown[];
  features: string[];
  applications: string[];
  specifications: Array<{ label: string; value: string }>;
  relatedProductSlugs?: string[];
  coverImage?: SanityImage;
  gallery?: SanityImage[];
  seoTitle: string;
  seoDescription: string;
};

export type SanityNews = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  summary: string;
  body: unknown[];
  relatedProductSlugs?: string[];
  coverImage?: SanityImage;
  gallery?: SanityImage[];
  seoTitle: string;
  seoDescription: string;
};

export type SanitySiteSettings = {
  homeCarousel?: SanityHomeCarousel;
  homeSolution?: {
    eyebrow?: string;
    title?: string;
    summary?: string;
    image?: SanityImage;
    action?: { label?: string; href?: string };
    style?: { color?: string; fontSize?: string; fontFamily?: string };
    diagram?: unknown;
    diagramColors?: Record<string, string>;
  };
  homeHero?: {
    eyebrow?: string;
    title?: string;
    summary?: string;
    backgroundImage?: SanityImage;
    primaryAction?: { label?: string; href?: string };
    secondaryAction?: { label?: string; href?: string };
    style?: {
      color?: string;
      fontSize?: string;
      alignment?: string;
      spacing?: string;
      desktopTitleWrap?: string;
    };
  };
  contactPage?: {
    panel?: {
      label?: string;
      description?: string;
      phoneActionLabel?: string;
      emailActionLabel?: string;
      style?: {
        color?: string;
        fontSize?: string;
        fontFamily?: string;
      };
    };
    guide?: {
      eyebrow?: string;
      title?: string;
      steps?: unknown[];
      linkLabel?: string;
      style?: {
        color?: string;
        fontSize?: string;
        fontFamily?: string;
      };
    };
  };
  navigationLabels?: Record<string, string>;
  distributorName?: string;
  companyName?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  inquiryEmail?: string;
  footerText?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultOgImage?: SanityImage;
};

export type SanityPage = {
  _id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  liquidCoolingDesign?: unknown;
  companyOverviewStyle?: unknown;
  categoryHero?: unknown;
  applicationProducts?: unknown;
  seoTitle: string;
  seoDescription: string;
};

export const pageProjection = `{
  _id,
  title,
  "slug": slug.current,
  liquidCoolingDesign { ..., diagram { ..., image { ..., alt, asset->{_ref, url} } } },
  companyOverviewStyle,
  categoryHero { ..., image { alt, asset->{url} } },
  applicationProducts { ..., navigation { ..., items[] { ..., "slug": page->slug.current } }, groups[] { ..., "productSlugs": products[]->slug.current } },
  blocks[] {
    _type,
    ...,
    image { ..., alt, asset->{_ref, url} },
    images[] { ..., alt, asset->{_ref, url} },
    cards[] { ..., image { ..., alt, asset->{_ref, url} } }
  },
  seoTitle,
  seoDescription
}`;

const productProjection = `{
  _id,
  category,
  title,
  "slug": slug.current,
  model,
  summary,
  principle,
  body,
  features,
  applications,
  specifications,
  "relatedProductSlugs": relatedProducts[]->slug.current,
  coverImage {
    ...,
    asset->{_ref, url}
  },
  gallery[] {
    ...,
    asset->{_ref, url}
  },
  seoTitle,
  seoDescription
}`;

const newsProjection = `{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  summary,
  body,
  "relatedProductSlugs": relatedProducts[]->slug.current,
  coverImage {
    ...,
    asset->{_ref, url}
  },
  gallery[] {
    ...,
    asset->{_ref, url}
  },
  seoTitle,
  seoDescription
}`;

async function fetchConfigured<T>(
  query: string,
  params: QueryParams = {},
  options?: { cache: "no-store" | "force-cache" },
): Promise<T | null> {
  const sanityClient = getSanityClient();
  if (!sanityClient) {
    return null;
  }

  return options
    ? sanityClient.fetch<T>(query, params, options)
    : sanityClient.fetch<T>(query, params);
}

export async function getProducts(): Promise<SanityProduct[]> {
  return (
    (await fetchConfigured<SanityProduct[]>(
      `*[_type == "product" && publishState == "published"] | order(category asc, title asc) ${productProjection}`,
      {},
      { cache: "no-store" },
    )) ?? []
  );
}

export async function getProductBySlug(
  category: string,
  slug: string,
): Promise<SanityProduct | null> {
  return fetchConfigured<SanityProduct>(
    `*[
      _type == "product" &&
      publishState == "published" &&
      category == $category &&
      slug.current == $slug
    ][0] ${productProjection}`,
    { category, slug },
  );
}

// Each static build must see newly published news images, even at the same Git SHA.
// Keep force-cache within a build: no-store can be rejected during static export.
const newsBuildSnapshot = Date.now().toString(36);

export async function getNews(): Promise<SanityNews[]> {
  return (
    (await fetchConfigured<SanityNews[]>(
      `*[_type == "news" && publishState == "published"] | order(publishedAt desc) ${newsProjection}`,
      { newsBuildSnapshot },
      { cache: "force-cache" },
    )) ?? []
  );
}

export async function getNewsBySlug(
  slug: string,
): Promise<SanityNews | null> {
  return fetchConfigured<SanityNews>(
    `*[
      _type == "news" &&
      publishState == "published" &&
      slug.current == $slug
    ][0] ${newsProjection}`,
    { slug, newsBuildSnapshot },
    { cache: "force-cache" },
  );
}

// A new process snapshot prevents stale company pages, category banners and
// application selections surviving CMS-triggered rebuilds of the same Git commit.
const overviewBuildSnapshot = Date.now().toString(36);

export async function getPageBySlug(slug: string): Promise<SanityPage | null> {
  const overview = ["overview", "culture", "history", "dosing", "application-index", ...applicationProductPageSlugs].includes(slug);
  return fetchConfigured<SanityPage>(
    `*[
      _type == "page" &&
      publishState == "published" &&
      slug.current == $slug
    ][0] ${pageProjection}`,
    overview ? { slug, overviewBuildSnapshot } : { slug },
    // Static export rejects no-store fetches. Cache only within this build
    // snapshot; keep existing behavior on unrelated page routes.
    { cache: overview ? "force-cache" : "no-store" },
  );
}

export const siteSettingsQuery = `*[
  _type == "siteSettings" && _id == "siteSettings"
][0] {
  homeCarousel {
    enabled, autoPlay, intervalSeconds,
    slides[] { _key, eyebrow, title, summary, image { ..., asset->{_ref, url} }, primaryAction, style }
  },
  homeSolution {
    eyebrow, title, summary,
    image { ..., asset->{_ref, url} },
    action, style, diagramColors,
    diagram { ..., image { ..., alt, asset->{_ref, url} } }
  },
  homeHero {
    eyebrow,
    title,
    summary,
    backgroundImage { ..., asset->{_ref, url} },
    primaryAction,
    secondaryAction,
    style
  },
  contactPage {
    panel {
      label,
      description,
      phoneActionLabel,
      emailActionLabel,
      style
    },
    guide {
      eyebrow,
      title,
      steps,
      linkLabel,
      style
    }
  },
  navigationLabels,
  distributorName,
  companyName,
  postalCode,
  address,
  phone,
  inquiryEmail,
  footerText,
  defaultSeoTitle,
  defaultSeoDescription,
  defaultOgImage {
    ...,
    asset->{_ref, url}
  }
}`;

// Rebuilds of the same commit must read newly published carousel settings,
// without the no-store fetch that static export rejects.
const siteSettingsBuildSnapshot = Date.now().toString(36);
export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return fetchConfigured<SanitySiteSettings>(siteSettingsQuery, { siteSettingsBuildSnapshot }, { cache: "force-cache" });
}
