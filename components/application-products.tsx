import Link from "next/link";
import { ProductCard } from "./product-card";
import { SourceCardGrid } from "./source-faithful/source-card-grid";
import type { ApplicationProductSelection } from "@/lib/page-enhancements";
import type { Product } from "@/lib/types";

export function ApplicationProducts({ selection, products }: { selection: ApplicationProductSelection; products: Product[] }): React.ReactElement | null {
  const seen = new Set<string>();
  const groups = selection.groups.flatMap(group => {
    const selected = group.productSlugs.flatMap(slug => {
      const product = products.find(item => item.slug === slug && (group.category === "all" || item.category === group.category));
      if (!product || seen.has(product.slug)) return [];
      seen.add(product.slug);
      return [product];
    });
    return selected.length ? [{ ...group, products: selected }] : [];
  });
  if (!groups.length && !selection.navigation?.items.length) return null;
  return <section className="section source-section related-products application-products" aria-label={selection.title}>
    <div className="site-container">
      {selection.navigation?.items.length ? <nav className="application-products__industries" aria-label={selection.navigation.title}>
        <h2>{selection.navigation.title}</h2>
        <p className="related-products__description">{selection.navigation.summary}</p>
        <ul className="industry-anchor-grid">{selection.navigation.items.map((item,index)=><li key={item.slug}><Link href={`/applications/${item.slug}`}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.title}</strong><small>{item.summary}</small></Link></li>)}</ul>
      </nav> : null}
      {groups.length > 0 && <><h2>{selection.title}</h2><p className="related-products__description">{selection.summary}</p></>}
      {groups.map((group, index) => <div className="application-products__group" key={`${group.category}-${index}`}>
        <h3 className="application-products__heading">{group.title}</h3>
        <p className="application-products__summary">{group.summary}</p>
        <SourceCardGrid ariaLabel={group.title} variant="products" cards={group.products.map(product => <ProductCard key={product.slug} product={product} />)} />
        <Link className="application-products__more" href={group.category === "all" ? "/products" : `/products/${group.category}`}>{group.moreLabel}<span aria-hidden="true"> →</span></Link>
      </div>)}
    </div>
  </section>;
}
