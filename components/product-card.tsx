import Image from "next/image";
import Link from "next/link";

import { productCategoryLabels, productRoute } from "@/lib/routes";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}): React.ReactElement {
  const image = product.images[0];

  return (
    <article className="product-card card">
      <div className="product-card__media">
        {image ? (
          <Image
            alt={image.alt}
            height={420}
            priority={priority}
            sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
            src={image.src}
            width={560}
          />
        ) : (
          <div
            className="product-card__fallback"
            role="img"
            aria-label={`${product.model} 製品画像`}
          >
            <span>BEBUR</span>
            <strong>{product.model}</strong>
          </div>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__model">{product.model}</span>
          <span className="product-card__category">
            {productCategoryLabels[product.category]}
          </span>
        </div>
        <h3>{product.title}</h3>
        <p className="product-card__description">{product.description}</p>
        <Link className="product-card__link" href={productRoute(product)}>
          詳細を見る
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
