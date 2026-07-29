import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
}: {
  items: BreadcrumbItem[];
}): React.ReactElement {
  const breadcrumbs =
    items[0]?.label === "ホーム"
      ? items
      : [{ label: "ホーム", href: "/" }, ...items];

  return (
    <nav className="breadcrumbs" aria-label="パンくずリスト">
      <ol>
        {breadcrumbs.map((item, index) => {
          const isCurrent = index === breadcrumbs.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && (
                <span className="breadcrumbs__separator" aria-hidden="true">
                  /
                </span>
              )}
              {isCurrent ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
