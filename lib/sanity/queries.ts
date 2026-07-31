import type { QueryParams } from "@sanity/client";

import { getSanityClient } from "./client";
import type { PageBlock } from "../page-blocks";

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
  seoTitle: string;
  seoDescription: string;
};

export const pageProjection = `{
  _id,
  title,
  "slug": slug.current,
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
): Promise<T | null> {
  const sanityClient = getSanityClient();
  if (!sanityClient) {
    return null;
  }

  return sanityClient.fetch<T>(query, params);
}

export async function getProducts(): Promise<SanityProduct[]> {
  return (
    (await fetchConfigured<SanityProduct[]>(
      `*[_type == "product" && publishState == "published"] | order(category asc, title asc) ${productProjection}`,
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

export async function getNews(): Promise<SanityNews[]> {
  return (
    (await fetchConfigured<SanityNews[]>(
      `*[_type == "news" && publishState == "published"] | order(publishedAt desc) ${newsProjection}`,
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
    { slug },
  );
}

export async function getPageBySlug(slug: string): Promise<SanityPage | null> {
  return fetchConfigured<SanityPage>(
    `*[
      _type == "page" &&
      publishState == "published" &&
      slug.current == $slug
    ][0] ${pageProjection}`,
    { slug },
  );
}

export const siteSettingsQuery = `*[
  _type == "siteSettings" && _id == "siteSettings"
][0] {
  homeHero {
    eyebrow,
    title,
    summary,
    backgroundImage { ..., asset->{_ref, url} },
    primaryAction,
    secondaryAction,
    style
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

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return fetchConfigured<SanitySiteSettings>(siteSettingsQuery);
}
