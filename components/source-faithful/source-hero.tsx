import Image from "next/image";
import type { ReactNode } from "react";

import type { SourceAssetPath } from "@/components/source-faithful/source-media";

export function SourceHero({
  image,
  eyebrow,
  title,
  summary,
  actions,
  identity,
}: {
  image: SourceAssetPath;
  eyebrow: string;
  title: string;
  summary: string;
  actions?: ReactNode;
  identity?: string;
}): React.ReactElement {
  return (
    <header className="source-hero" data-testid="source-hero">
      <Image
        alt=""
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
        {actions && <div className="source-hero__actions">{actions}</div>}
        {identity && <p className="source-hero__identity">{identity}</p>}
      </div>
    </header>
  );
}
