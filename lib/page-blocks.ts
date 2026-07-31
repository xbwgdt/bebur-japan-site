import type { SanityImage } from "./sanity/queries";

export type PageBlockStyle = {
  color?: "brand" | "blue" | "red" | "neutral";
  fontSize?: "sm" | "md" | "lg" | "xl";
  alignment?: "left" | "center";
  spacing?: "compact" | "normal" | "spacious";
  desktopTitleWrap?: "wrap" | "nowrap";
};

export type PortableTextBlock = {
  _type?: string;
  children?: Array<{ text?: string }>;
  style?: string;
  listItem?: string;
};

export type HeroPageBlock = PageBlockStyle & {
  _type: "hero";
  title?: string;
  summary?: string;
  image?: SanityImage;
  ctaLabel?: string;
  ctaHref?: string;
};

export type RichTextPageBlock = PageBlockStyle & {
  _type: "richText";
  title?: string;
  content?: PortableTextBlock[];
};

export type GalleryPageBlock = PageBlockStyle & {
  _type: "gallery";
  title?: string;
  images?: SanityImage[];
};

export type CardGridPageBlock = PageBlockStyle & {
  _type: "cardGrid";
  title?: string;
  cards?: Array<{
    title?: string;
    summary?: string;
    image?: SanityImage;
    linkLabel?: string;
    href?: string;
  }>;
};

export type DataTablePageBlock = PageBlockStyle & {
  _type: "dataTable";
  title?: string;
  columns?: string[];
  rows?: Array<{ cells?: string[] }>;
};

export type CtaPageBlock = PageBlockStyle & {
  _type: "cta";
  title?: string;
  summary?: string;
  label?: string;
  href?: string;
};

export type PageBlock =
  | HeroPageBlock
  | RichTextPageBlock
  | GalleryPageBlock
  | CardGridPageBlock
  | DataTablePageBlock
  | CtaPageBlock;

export type PageBlockInput = PageBlock | { _type?: string } | null | undefined;
