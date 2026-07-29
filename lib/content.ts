import aboutData from "../content/ja/about.json";
import applicationsData from "../content/ja/applications.json";
import insightsData from "../content/ja/insights.json";
import pagesData from "../content/ja/pages.json";
import productsData from "../content/ja/products.json";
import type {
  AboutPage,
  Application,
  Article,
  Product,
  ProductCategory,
  StaticPage,
} from "./types";

const products = productsData as Product[];
const applications = applicationsData as Application[];
const articles = insightsData as Article[];
const aboutPages = aboutData as AboutPage[];
const staticPages = pagesData as StaticPage[];

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
