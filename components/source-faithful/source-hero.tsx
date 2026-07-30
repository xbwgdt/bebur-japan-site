import Image from "next/image";

export type SourceAssetPath =
  | `/source-media/${string}`
  | `/media/${string}`;

export function SourceHero({
  image,
  eyebrow,
  title,
  summary,
}: {
  image: SourceAssetPath;
  eyebrow: string;
  title: string;
  summary: string;
}): React.ReactElement {
  return (
    <header className="source-hero" data-testid="source-hero">
      <Image
        alt={title}
        className="source-hero__image"
        fill
        priority
        sizes="100vw"
        src={image}
      />
      <div className="source-hero__shade" aria-hidden="true" />
      <div className="site-container source-hero__content">
        <p className="source-hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <span className="source-hero__rule" aria-hidden="true" />
        <p className="source-hero__summary">{summary}</p>
      </div>
    </header>
  );
}
