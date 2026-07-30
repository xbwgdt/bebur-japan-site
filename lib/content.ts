import aboutData from "../content/ja/about.json";
import applicationsData from "../content/ja/applications.json";
import insightsData from "../content/ja/insights.json";
import pagesData from "../content/ja/pages.json";
import productsData from "../content/ja/products.json";
import { insightRoute, isProductCategory, productRoute } from "./routes";
import { getSanityClient } from "./sanity/client";
import {
  getNews as getSanityNews,
  getProducts as getSanityProducts,
  type SanityImage,
  type SanityNews,
  type SanityProduct,
} from "./sanity/queries";
import type {
  AboutPage,
  Application,
  Article,
  ContentImage,
  ContentSection,
  Product,
  ProductCategory,
  StaticPage,
} from "./types";

export type ContentSource = "local" | "sanity";

export type ContentSnapshot = {
  source: ContentSource;
  products: Product[];
  articles: Article[];
};

type ContentSnapshotInput = {
  sanityConfigured: boolean;
  sanityProducts: readonly SanityProduct[];
  sanityNews: readonly SanityNews[];
};

type ContentSnapshotLoaderInput = {
  sanityConfigured: boolean;
  readProducts?: () => Promise<SanityProduct[]>;
  readNews?: () => Promise<SanityNews[]>;
};

type PortableTextBlock = {
  _type?: unknown;
  style?: unknown;
  listItem?: unknown;
  children?: unknown;
};

const localProducts = productsData as Product[];
const applications = applicationsData as Application[];
const localArticles = insightsData as Article[];
const aboutPages = aboutData as AboutPage[];
const staticPages = pagesData as StaticPage[];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

function copy<T>(value: T): T {
  return structuredClone(value);
}

function byRouteThenTitle<T extends { route: string; title: string }>(
  left: T,
  right: T,
): number {
  return (
    left.route.localeCompare(right.route, "ja") ||
    left.title.localeCompare(right.title, "ja")
  );
}

function sortedCopies<T extends { route: string; title: string }>(
  records: readonly T[],
): T[] {
  return records.toSorted(byRouteThenTitle).map(copy);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalized = nonEmptyString(item);
    return normalized === undefined ? [] : [normalized];
  });
}

function specificationRows(
  value: unknown,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as { label?: unknown; value?: unknown };
    const label = nonEmptyString(candidate.label);
    const specificationValue = nonEmptyString(candidate.value);

    return label && specificationValue
      ? [{ label, value: specificationValue }]
      : [];
  });
}

function portableTextValue(block: PortableTextBlock): string {
  if (!Array.isArray(block.children)) {
    return "";
  }

  return block.children
    .flatMap((child) => {
      if (!child || typeof child !== "object") {
        return [];
      }

      const text = (child as { text?: unknown }).text;
      return typeof text === "string" ? [text] : [];
    })
    .join("")
    .trim();
}

function portableTextSections(value: unknown): ContentSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sections: ContentSection[] = [];
  let current:
    | {
        heading: string;
        paragraphs: string[];
        bullets: string[];
      }
    | undefined;

  const ensureCurrent = () => {
    current ??= {
      heading: "概要",
      paragraphs: [],
      bullets: [],
    };
    return current;
  };
  const flushCurrent = () => {
    if (
      current &&
      (current.paragraphs.length > 0 || current.bullets.length > 0)
    ) {
      sections.push({
        heading: current.heading,
        paragraphs: current.paragraphs,
        ...(current.bullets.length > 0
          ? { bullets: current.bullets }
          : {}),
      });
    }
    current = undefined;
  };

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const block = item as PortableTextBlock;
    if (block._type !== "block") {
      continue;
    }

    const text = portableTextValue(block);
    if (text === "") {
      continue;
    }

    if (
      block.style === "h1" ||
      block.style === "h2" ||
      block.style === "h3"
    ) {
      flushCurrent();
      current = { heading: text, paragraphs: [], bullets: [] };
      continue;
    }

    if (typeof block.listItem === "string") {
      ensureCurrent().bullets.push(text);
    } else {
      ensureCurrent().paragraphs.push(text);
    }
  }

  flushCurrent();
  return sections;
}

function sanityImage(image: SanityImage | undefined): ContentImage | undefined {
  const src = nonEmptyString(image?.asset?.url);
  const alt = nonEmptyString(image?.alt);

  if (!src || !alt) {
    return undefined;
  }

  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.hostname !== "cdn.sanity.io") {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return { src, alt };
}

function sanityImages(
  coverImage: SanityImage | undefined,
  gallery: SanityImage[] | undefined,
): ContentImage[] {
  const images = [coverImage, ...(gallery ?? [])].flatMap((image) => {
    const normalized = sanityImage(image);
    return normalized === undefined ? [] : [normalized];
  });
  const bySource = new Map<string, ContentImage>();

  for (const image of images) {
    if (!bySource.has(image.src)) {
      bySource.set(image.src, image);
    }
  }

  return [...bySource.values()];
}

function normalizeSanityProduct(record: SanityProduct): Product | undefined {
  const category = nonEmptyString(record.category);
  const slug = nonEmptyString(record.slug);
  const title = nonEmptyString(record.title);
  const model = nonEmptyString(record.model);
  const description = nonEmptyString(record.summary);

  if (
    !category ||
    !isProductCategory(category) ||
    !slug ||
    !slugPattern.test(slug) ||
    !title ||
    !model ||
    !description
  ) {
    return undefined;
  }

  const localFallback = localProducts.find(
    (product) =>
      product.category === category && product.slug === slug,
  );
  const images = sanityImages(record.coverImage, record.gallery);
  const sections = portableTextSections(record.body);

  return {
    kind: "product",
    category,
    slug,
    route: productRoute({ category, slug }),
    title,
    description,
    sourceUrl:
      localFallback?.sourceUrl ??
      `https://www.bebur-jp.com${productRoute({ category, slug })}`,
    images: images.length > 0 ? images : (localFallback?.images ?? []),
    sections:
      sections.length > 0 ? sections : (localFallback?.sections ?? []),
    model,
    ...(localFallback?.principle
      ? { principle: localFallback.principle }
      : {}),
    features: Array.isArray(record.features)
      ? stringArray(record.features)
      : (localFallback?.features ?? []),
    applications: Array.isArray(record.applications)
      ? stringArray(record.applications)
      : (localFallback?.applications ?? []),
    specifications: Array.isArray(record.specifications)
      ? specificationRows(record.specifications)
      : (localFallback?.specifications ?? []),
    relatedSlugs: Array.isArray(record.relatedProductSlugs)
      ? stringArray(record.relatedProductSlugs)
      : (localFallback?.relatedSlugs ?? []),
  };
}

function normalizeSanityArticle(record: SanityNews): Article | undefined {
  const slug = nonEmptyString(record.slug);
  const title = nonEmptyString(record.title);
  const description = nonEmptyString(record.summary);

  if (!slug || !slugPattern.test(slug) || !title || !description) {
    return undefined;
  }

  const localFallback = localArticles.find(
    (article) => article.slug === slug,
  );
  const images = sanityImages(record.coverImage, record.gallery);
  const sections = portableTextSections(record.body);
  const publishedAt = nonEmptyString(record.publishedAt);
  const route = insightRoute(slug);

  return {
    kind: "article",
    slug,
    route,
    title,
    description,
    sourceUrl:
      localFallback?.sourceUrl ?? `https://www.bebur-jp.com${route}`,
    ...(publishedAt && isoDatePattern.test(publishedAt)
      ? { publishedAt }
      : localFallback?.publishedAt
        ? { publishedAt: localFallback.publishedAt }
        : {}),
    images: images.length > 0 ? images : (localFallback?.images ?? []),
    sections:
      sections.length > 0 ? sections : (localFallback?.sections ?? []),
    relatedProductSlugs: Array.isArray(record.relatedProductSlugs)
      ? stringArray(record.relatedProductSlugs)
      : (localFallback?.relatedProductSlugs ?? []),
  };
}

function uniqueRoutes<T extends { route: string }>(records: readonly T[]): T[] {
  const byRoute = new Map<string, T>();

  for (const record of records) {
    if (!byRoute.has(record.route)) {
      byRoute.set(record.route, record);
    }
  }

  return [...byRoute.values()];
}

export function createContentSnapshot({
  sanityConfigured,
  sanityProducts,
  sanityNews,
}: ContentSnapshotInput): ContentSnapshot {
  if (!sanityConfigured) {
    return {
      source: "local",
      products: localProducts,
      articles: localArticles,
    };
  }

  const normalizedProducts = uniqueRoutes(
    sanityProducts.flatMap((record) => {
      const normalized = normalizeSanityProduct(record);
      return normalized === undefined ? [] : [normalized];
    }),
  );
  const normalizedArticles = uniqueRoutes(
    sanityNews.flatMap((record) => {
      const normalized = normalizeSanityArticle(record);
      return normalized === undefined ? [] : [normalized];
    }),
  );
  const approvedProductRoutes = new Set(
    localProducts.map(({ route }) => route),
  );
  const approvedArticleRoutes = new Set(
    localArticles.map(({ route }) => route),
  );
  const productOverlays = new Map(
    normalizedProducts
      .filter(({ route }) => approvedProductRoutes.has(route))
      .map((product) => [product.route, product]),
  );
  const articleOverlays = new Map(
    normalizedArticles
      .filter(({ route }) => approvedArticleRoutes.has(route))
      .map((article) => [article.route, article]),
  );
  const products = localProducts.map(
    (product) => productOverlays.get(product.route) ?? product,
  );
  const articles = localArticles.map(
    (article) => articleOverlays.get(article.route) ?? article,
  );
  const hasSanityContent =
    productOverlays.size > 0 || articleOverlays.size > 0;

  return {
    source: hasSanityContent ? "sanity" : "local",
    products,
    articles,
  };
}

export async function loadContentSnapshot({
  sanityConfigured,
  readProducts = getSanityProducts,
  readNews = getSanityNews,
}: ContentSnapshotLoaderInput): Promise<ContentSnapshot> {
  if (!sanityConfigured) {
    return createContentSnapshot({
      sanityConfigured: false,
      sanityProducts: [],
      sanityNews: [],
    });
  }

  const [productsResult, newsResult] = await Promise.allSettled([
    readProducts(),
    readNews(),
  ]);

  return createContentSnapshot({
    sanityConfigured: true,
    sanityProducts:
      productsResult.status === "fulfilled" &&
      Array.isArray(productsResult.value)
        ? productsResult.value
        : [],
    sanityNews:
      newsResult.status === "fulfilled" &&
      Array.isArray(newsResult.value)
        ? newsResult.value
        : [],
  });
}

const contentSnapshot = await loadContentSnapshot({
  sanityConfigured: getSanityClient() !== null,
});
const products = contentSnapshot.products;
const articles = contentSnapshot.articles;

export function getContentSource(): ContentSource {
  return contentSnapshot.source;
}

export function getProducts(category?: ProductCategory): Product[] {
  const matches =
    category === undefined
      ? products
      : products.filter((product) => product.category === category);
  return sortedCopies(matches);
}

export function getProduct(
  category: ProductCategory,
  slug: string,
): Product | undefined {
  const product = products.find(
    (candidate) =>
      candidate.category === category && candidate.slug === slug,
  );
  return product === undefined ? undefined : copy(product);
}

export function getApplications(): Application[] {
  return sortedCopies(applications);
}

export function getApplication(slug: string): Application | undefined {
  const application = applications.find(
    (candidate) => candidate.slug === slug,
  );
  return application === undefined ? undefined : copy(application);
}

export function getArticles(): Article[] {
  return sortedCopies(articles);
}

export function getArticle(slug: string): Article | undefined {
  const article = articles.find((candidate) => candidate.slug === slug);
  return article === undefined ? undefined : copy(article);
}

export function getAboutPages(): AboutPage[] {
  return sortedCopies(aboutPages);
}

export function getAboutPage(slug: string): AboutPage | undefined {
  const aboutPage = aboutPages.find((candidate) => candidate.slug === slug);
  return aboutPage === undefined ? undefined : copy(aboutPage);
}

export function getStaticPages(): StaticPage[] {
  return sortedCopies(staticPages);
}

export function getAllRoutes(): string[] {
  return [
    ...new Set(
      [
        ...products,
        ...applications,
        ...articles,
        ...aboutPages,
        ...staticPages,
      ].map(({ route }) => route),
    ),
  ].toSorted();
}

export function getAllSourceUrls(): string[] {
  const directSourceUrls = [
    ...products,
    ...applications,
    ...articles,
    ...aboutPages,
    ...staticPages,
  ].map(({ sourceUrl }) => sourceUrl);
  const aliases = staticPages.flatMap(({ sourceAliases }) =>
    sourceAliases ?? [],
  );

  return [...directSourceUrls, ...aliases].toSorted();
}
