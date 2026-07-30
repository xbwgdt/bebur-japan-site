export type ContentImage = {
  src: string;
  alt: string;
};

export type ContentSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ContentBase = {
  slug: string;
  route: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  sourceUrl: string;
  publishedAt?: string;
  images: ContentImage[];
  sections: ContentSection[];
};

export type ProductCategory =
  | "cleanliness"
  | "dosing"
  | "water-quality"
  | "gas-detection"
  | "flow-level";

export type Product = ContentBase & {
  kind: "product";
  category: ProductCategory;
  model: string;
  principle?: string;
  features: string[];
  applications: string[];
  specifications: Array<{ label: string; value: string }>;
  relatedSlugs: string[];
};

export type Application = ContentBase & {
  kind: "application";
  recommendedProductSlugs: string[];
};

export type Article = ContentBase & {
  kind: "article";
  relatedProductSlugs: string[];
};

export type AboutPage = ContentBase & {
  kind: "about";
};

export type StaticPage = ContentBase & {
  kind: "page";
  sourceAliases?: string[];
};
