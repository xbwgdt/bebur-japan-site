import Image from "next/image";
import Link from "next/link";

import { getProduct } from "@/lib/content";
import { siteConfig } from "@/lib/constants";
import type { Product } from "@/lib/types";

const heroProducts = [
  getProduct("water-quality", "bt-7000"),
  getProduct("gas-detection", "gt-3280-ou"),
].filter((product): product is Product => product !== undefined);

export function Hero(): React.ReactElement {
  return (
    <section className="hero" aria-labelledby="home-hero-title">
      <div className="site-container hero__grid">
        <div className="hero__content">
          <p className="hero__eyebrow">WATER QUALITY &amp; GAS DETECTION</p>
          <h1 id="home-hero-title">水質とガスを、より確かに。</h1>
          <p className="hero__description">
            Beburの精密計測技術で、水処理、製造、医薬、液冷設備の安全と品質管理を支えます。
          </p>
          <div className="hero__actions">
            <Link className="button button--accent" href="/products">
              製品情報を見る
            </Link>
            <Link className="button button--hero-secondary" href="/contact">
              お問い合わせ
            </Link>
          </div>
          <p className="hero__identity">{siteConfig.distributorLabel}</p>
        </div>

        <div className="hero__instruments" aria-label="代表製品">
          {heroProducts.map((product, index) => {
            const image = product.images[0];

            return (
              <figure
                className={`hero__instrument hero__instrument--${index + 1}`}
                key={`${product.category}-${product.slug}`}
              >
                <div className="hero__instrument-image">
                  <Image
                    alt={image.alt}
                    height={480}
                    priority
                    sizes="(min-width: 64rem) 24rem, 44vw"
                    src={image.src}
                    width={560}
                  />
                </div>
                <figcaption>
                  <span>{product.model}</span>
                  {product.title}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
