export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}): React.ReactElement {
  return (
    <div className={`section-heading section-heading--${align}`}>
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && (
        <p className="section-heading__description">{description}</p>
      )}
    </div>
  );
}
