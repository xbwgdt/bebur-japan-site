import { createElement, type ReactElement } from "react";

import type {
  CardGridPageBlock,
  DataTablePageBlock,
  GalleryPageBlock,
  HeroPageBlock,
  PageBlockInput,
  PageBlockStyle,
  RichTextPageBlock,
  CtaPageBlock,
} from "@/lib/page-blocks";
import type { SanityImage } from "@/lib/sanity/queries";

const allowedPresets = {
  color: ["brand", "blue", "red", "neutral"],
  fontSize: ["sm", "md", "lg", "xl"],
  alignment: ["left", "center"],
  spacing: ["compact", "normal", "spacious"],
  desktopTitleWrap: ["wrap", "nowrap"],
} as const;

function isAllowedPreset(
  value: string | undefined,
  values: readonly string[],
): value is string {
  return value !== undefined && values.includes(value);
}

function blockClassName(type: string, style: PageBlockStyle): string {
  const classes = ["page-block", `page-block--${type}`];

  if (isAllowedPreset(style.color, allowedPresets.color)) {
    classes.push(`page-block--color-${style.color}`);
  }
  if (isAllowedPreset(style.fontSize, allowedPresets.fontSize)) {
    classes.push(`page-block--font-${style.fontSize}`);
  }
  if (isAllowedPreset(style.alignment, allowedPresets.alignment)) {
    classes.push(`page-block--align-${style.alignment}`);
  }
  if (isAllowedPreset(style.spacing, allowedPresets.spacing)) {
    classes.push(`page-block--spacing-${style.spacing}`);
  }
  if (
    isAllowedPreset(
      style.desktopTitleWrap,
      allowedPresets.desktopTitleWrap,
    )
  ) {
    classes.push(`page-block--title-${style.desktopTitleWrap}`);
  }

  return classes.join(" ");
}

function safeHref(href: string | undefined): string | null {
  if (!href) {
    return null;
  }

  return /^(?:\/|https?:\/\/|mailto:|tel:)/u.test(href) ? href : null;
}

function BlockImage({ image, fallbackAlt }: { image?: SanityImage; fallbackAlt: string }): ReactElement | null {
  const source = image?.asset?.url;
  if (!source) {
    return null;
  }

  return <img alt={image.alt || fallbackAlt} src={source} />;
}

function Action({ href, label }: { href?: string; label?: string }): ReactElement | null {
  const safeLink = safeHref(href);
  if (!safeLink || !label) {
    return null;
  }

  return <a className="page-block__action" href={safeLink}>{label}</a>;
}

function HeroBlock({ block }: { block: HeroPageBlock }): ReactElement | null {
  if (!block.title) return null;
  return <section className={blockClassName("hero", block)}><div><h1>{block.title}</h1>{block.summary && <p>{block.summary}</p>}<Action href={block.ctaHref} label={block.ctaLabel} /></div><BlockImage image={block.image} fallbackAlt={block.title} /></section>;
}

function RichTextBlock({ block }: { block: RichTextPageBlock }): ReactElement | null {
  const entries = (block.content ?? [])
    .map((entry, index) => ({
      index,
      listItem: entry.listItem,
      style: entry.style,
      text: entry.children?.map((child) => child.text ?? "").join("").trim() ?? "",
    }))
    .filter((entry) => Boolean(entry.text));
  if (!block.title && entries.length === 0) return null;

  const content: ReactElement[] = [];
  for (let index = 0; index < entries.length;) {
    const entry = entries[index]!;
    if (entry.listItem === "bullet" || entry.listItem === "number") {
      const tag = entry.listItem === "number" ? "ol" : "ul";
      const items = [] as ReactElement[];
      while (entries[index]?.listItem === entry.listItem) {
        const listEntry = entries[index]!;
        items.push(<li key={listEntry.index}>{listEntry.text}</li>);
        index += 1;
      }
      content.push(createElement(tag, { key: `list-${entry.index}` }, items));
      continue;
    }

    const tag = /^h[1-6]$/u.test(entry.style ?? "") ? entry.style! : "p";
    content.push(createElement(tag, { key: entry.index }, entry.text));
    index += 1;
  }

  return <section className={blockClassName("rich-text", block)}>{block.title && <h2>{block.title}</h2>}{content}</section>;
}

function GalleryBlock({ block }: { block: GalleryPageBlock }): ReactElement | null {
  const images = (block.images ?? []).filter((image) => image.asset?.url);
  if (!block.title && images.length === 0) return null;
  return <section className={blockClassName("gallery", block)}>{block.title && <h2>{block.title}</h2>}<div>{images.map((image, index) => <figure key={`${image.asset?.url}-${index}`}><BlockImage image={image} fallbackAlt={block.title ?? "Gallery image"} /></figure>)}</div></section>;
}

function CardGridBlock({ block }: { block: CardGridPageBlock }): ReactElement | null {
  const cards = (block.cards ?? []).filter((card) => card.title);
  if (!block.title && cards.length === 0) return null;
  return <section className={blockClassName("card-grid", block)}>{block.title && <h2>{block.title}</h2>}<div>{cards.map((card, index) => <article key={`${card.title}-${index}`}><BlockImage image={card.image} fallbackAlt={card.title!} /><h3>{card.title}</h3>{card.summary && <p>{card.summary}</p>}<Action href={card.href} label={card.linkLabel} /></article>)}</div></section>;
}

function DataTableBlock({ block }: { block: DataTablePageBlock }): ReactElement | null {
  const columns = (block.columns ?? []).filter(Boolean);
  const rows = (block.rows ?? []).filter((row) => row.cells?.some(Boolean));
  if (!block.title || columns.length === 0 || rows.length === 0) return null;
  return <section className={blockClassName("data-table", block)}><table><caption>{block.title}</caption><thead><tr>{columns.map((column, index) => <th key={`${column}-${index}`} scope="col">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{columns.map((_, cellIndex) => <td key={cellIndex}>{row.cells?.[cellIndex] ?? ""}</td>)}</tr>)}</tbody></table></section>;
}

function CtaBlock({ block }: { block: CtaPageBlock }): ReactElement | null {
  if (!block.title) return null;
  return <section className={blockClassName("cta", block)}><h2>{block.title}</h2>{block.summary && <p>{block.summary}</p>}<Action href={block.href} label={block.label} /></section>;
}

function renderBlock(block: PageBlockInput, index: number): ReactElement | null {
  if (!block?._type) return null;
  switch (block._type) {
    case "hero": return <HeroBlock block={block as HeroPageBlock} key={index} />;
    case "richText": return <RichTextBlock block={block as RichTextPageBlock} key={index} />;
    case "gallery": return <GalleryBlock block={block as GalleryPageBlock} key={index} />;
    case "cardGrid": return <CardGridBlock block={block as CardGridPageBlock} key={index} />;
    case "dataTable": return <DataTableBlock block={block as DataTablePageBlock} key={index} />;
    case "cta": return <CtaBlock block={block as CtaPageBlock} key={index} />;
    default: return null;
  }
}

export function PageBlockRenderer({ blocks }: { blocks?: PageBlockInput[] }): ReactElement | null {
  const renderedBlocks = (blocks ?? []).map(renderBlock).filter((block): block is ReactElement => block !== null);
  return renderedBlocks.length > 0 ? <>{renderedBlocks}</> : null;
}
