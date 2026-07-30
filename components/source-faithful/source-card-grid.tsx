import type { ReactNode } from "react";

export type SourceCardGridVariant =
  | "applications"
  | "categories"
  | "media"
  | "products";

export function SourceCardGrid({
  cards,
  variant,
}: {
  cards: ReactNode;
  variant: SourceCardGridVariant;
}): React.ReactElement {
  return (
    <div
      className={`source-card-grid source-card-grid--${variant}`}
      data-source-variant={variant}
      data-testid="source-card-grid"
    >
      {cards}
    </div>
  );
}
