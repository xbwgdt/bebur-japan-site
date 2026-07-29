"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";
import { productCategoryLabels } from "@/lib/routes";
import type { Product, ProductCategory } from "@/lib/types";

export function ProductExplorer({
  products,
  initialCategory = "all",
}: {
  products: Product[];
  initialCategory?: ProductCategory | "all";
}): React.ReactElement {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">(
    initialCategory,
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return products.filter((product) => {
      if (category !== "all" && product.category !== category) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      const searchableContent = [
        product.model,
        product.title,
        product.description,
        product.principle ?? "",
        ...product.features,
        ...product.applications,
      ]
        .join("\n")
        .toLocaleLowerCase("ja-JP");

      return searchableContent.includes(normalizedQuery);
    });
  }, [category, products, query]);

  function resetFilters(): void {
    setQuery("");
    setCategory("all");
  }

  return (
    <section
      className="product-explorer"
      aria-labelledby="product-explorer-title"
    >
      <h2 className="sr-only" id="product-explorer-title">
        製品を検索・絞り込み
      </h2>

      <div className="product-explorer__controls">
        <div className="product-explorer__field">
          <label htmlFor="product-query">製品名・型式で検索</label>
          <input
            id="product-query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例：BT-7000、オゾン"
            type="search"
            value={query}
          />
        </div>

        <div className="product-explorer__field">
          <label htmlFor="product-category">製品カテゴリー</label>
          <select
            id="product-category"
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | "all")
            }
            value={category}
          >
            <option value="all">すべて</option>
            {Object.entries(productCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="product-explorer__status-row">
        <p aria-atomic="true" aria-live="polite" role="status">
          {filteredProducts.length}件の製品
        </p>
        {filteredProducts.length > 0 &&
          (query.length > 0 || category !== "all") && (
          <button onClick={resetFilters} type="button">
            絞り込みを解除
          </button>
          )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={`${product.category}-${product.slug}`}
              priority={index < 3}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="product-explorer__empty">
          <p>
            条件に一致する製品がありません。検索語またはカテゴリーを変更してください。
          </p>
          <button className="button button--secondary" onClick={resetFilters} type="button">
            絞り込みを解除
          </button>
        </div>
      )}
    </section>
  );
}
