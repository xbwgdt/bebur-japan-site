import type { ContentSection } from "@/lib/types";

export function ContentSections({
  sections,
}: {
  sections: ContentSection[];
}): React.ReactElement | null {
  const populatedSections = sections.flatMap((section) => {
    const paragraphs = section.paragraphs.filter(
      (paragraph) => paragraph.length > 0,
    );
    const bullets = (section.bullets ?? []).filter(
      (bullet) => bullet.length > 0,
    );

    if (paragraphs.length === 0 && bullets.length === 0) {
      return [];
    }

    return [{ ...section, paragraphs, bullets }];
  });

  if (populatedSections.length === 0) {
    return null;
  }

  return (
    <div className="content-sections">
      {populatedSections.map((section, sectionIndex) => (
        <section
          className="content-section"
          key={`${section.heading}-${sectionIndex}`}
        >
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={`${paragraph.slice(0, 32)}-${paragraphIndex}`}>
              {paragraph}
            </p>
          ))}
          {section.bullets.length > 0 && (
            <ul>
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={`${bullet.slice(0, 32)}-${bulletIndex}`}>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
