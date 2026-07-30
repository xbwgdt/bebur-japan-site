import type { ReactNode } from "react";

export type SourceCardGridVariant =
  | "applications"
  | "categories"
  | "media"
  | "products";

export function SourceCardGrid({
  ariaLabel,
  cards,
  variant,
}: {
  ariaLabel: string;
  cards: ReactNode;
  variant: SourceCardGridVariant;
}): React.ReactElement {
  return (
    <div
      aria-label={ariaLabel}
      className={`source-card-grid source-card-grid--${variant}`}
      data-source-variant={variant}
      data-testid="source-card-grid"
      role="region"
    >
      {cards}
    </div>
  );
}
