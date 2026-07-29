# Task 5 Report: Home Page and Product Discovery

## Status

Implemented the Japanese Bebur home page, complete product discovery experience, five statically generated category pages, and all 45 statically generated product detail pages.

Required commit subject:

```text
feat: build Japanese product experience
```

## TDD Evidence

### Baseline

Before Task 5 changes:

```text
npm run test:run
Test Files  6 passed (6)
Tests       53 passed (53)
Exit code   0
```

### RED

Tests were written before the Task 5 implementation. After adding non-functional collection scaffolds so Vitest could execute the assertions, the focused run failed for the expected missing behaviors:

```text
npm run test:run -- tests/routes.test.ts tests/product-ui.test.tsx
Test Files  2 failed (2)
Tests       15 failed | 9 passed (24)
Exit code   1
```

Expected failures covered:

- empty category and product static params;
- missing ProductExplorer form controls, live result count, filtering, no-result state, and reset;
- missing reviewed image, alt text, and product route in ProductCard;
- missing product-specific inquiry link;
- missing semantic specification table;
- missing home category and section content;
- missing 320px product-grid and specification-table overflow contracts.

The very first focused invocation also failed during collection because the new route/component modules did not yet exist. The behavior-level RED run above was then captured before implementing any Task 5 behavior.

### GREEN

After implementation:

```text
npm run test:run -- tests/routes.test.ts tests/product-ui.test.tsx
Test Files  2 passed (2)
Tests       24 passed (24)
Exit code   0
```

The focused GREEN run verifies the full required route and UI behavior, including exact 5/45 static parameter counts.

## Route Counts

The reviewed catalog remains unchanged at exactly 45 unique products:

| Category key | Japanese label | Product routes |
| --- | --- | ---: |
| `cleanliness` | 清浄度測定装置 | 3 |
| `dosing` | 薬注制御装置 | 7 |
| `water-quality` | 水質分析計 | 18 |
| `gas-detection` | ガス検知器 | 14 |
| `flow-level` | 流量計・液位計 | 3 |
| **Total** |  | **45** |

Generated route coverage:

- 1 home route: `/`;
- 1 product index route: `/products`;
- 5 category routes from `generateStaticParams()`;
- 45 unique category/slug detail routes from `generateStaticParams()`;
- every catalog `route` equals `productRoute(product)`;
- every product canonical starts with `https://www.bebur-jp.com/products/`;
- invalid categories and category/slug pairs resolve to not-found behavior.

## UI and Behavior

### Home

- Added the exact Japanese hero copy, calls to action, and distributor identity.
- Uses one reviewed water-quality image and one reviewed gas-detection image with catalog alt text.
- Uses CSS measurement lines and marks; no authored decorative SVG was added.
- Shows all five exact category labels with live catalog counts.
- Includes only the source-supported technology facts: 20 years of experience, electrochemical/optical technology, the cross-category product portfolio, and a sales network spanning more than 50 countries.
- Includes reviewed liquid-cooling, municipal-water-treatment, medical/pharmaceutical, and power applications.
- Includes one representative product from each category.
- Includes the full shared ContactCta.
- Adds Japanese metadata and canonical `/`.

### Product discovery

- ProductExplorer is the only new client component.
- Search covers model, Japanese title, description, principle, features, and applications.
- Search is case-insensitive and trims outer whitespace.
- Category and query filters combine without mutating or reordering the input array.
- The live region announces `N件の製品`.
- Exact no-result guidance and reset action are implemented.
- All links and controls provide at least 44px touch height and use the shared visible focus treatment.

### Category and detail pages

- Category pages validate the exact ProductCategory keys, generate metadata/canonicals, and call `notFound()` for unknown routes.
- Category intros accurately describe the five reviewed product families.
- Detail pages support Next.js 16 Promise-based params and generate Japanese metadata, canonical, and Open Graph data.
- Detail pages render reviewed model, title, description, category, first local image, optional principle, non-empty features/applications, additional non-duplicated content sections, and every specification row.
- Specification tables use semantic `<table>`, `{model} 主な仕様` captions, and `<th scope="row">`.
- Specification values and OCR/source-anomaly notes are passed through unchanged.
- Related products use up to three valid explicit products or stable same-category fallbacks excluding the current product.
- Compact inquiry links include both the reviewed product model and title and target `info@newtree-i.com`.

## Responsive and Accessibility Verification

- Mobile-first CSS uses one-column grids at the base viewport and `minmax(0, 1fr)` to prevent intrinsic-width overflow.
- At 320px, the shared container leaves 1rem inline space on each side.
- Product cards, long models, headings, and table cells allow safe wrapping.
- The specification table scrolls inside a `max-width: 100%` scroller instead of widening the page.
- Form controls and links meet the 44px minimum target height.
- Live results use `aria-live="polite"` and `aria-atomic="true"`.
- Inputs have explicit labels; no-results and reset remain keyboard operable.
- Existing visible focus and reduced-motion rules remain active.
- `tests/product-ui.test.tsx` directly verifies the 320px overflow CSS contracts.

## Verification Outputs

Focused Task 5 tests:

```text
Test Files  2 passed (2)
Tests       24 passed (24)
```

Full regression suite:

```text
npm run test:run
Test Files  7 passed (7)
Tests       71 passed (71)
Exit code   0
```

Production build:

```text
npm run build
Next.js 16.2.12 (Turbopack)
Compiled successfully
TypeScript finished successfully
Generating static pages (54/54)
Exit code 0
```

The build route table confirms:

- `/` and `/products` are static;
- all five `/products/[category]` paths are SSG;
- all 45 `/products/[category]/[slug]` paths are SSG;
- no TypeScript, hydration, image, or accessibility warning was emitted.

## Files Changed

- `components/hero.tsx` — reviewed dual-product hero.
- `components/product-card.tsx` — reusable reviewed-product card.
- `components/product-explorer.tsx` — client-side search and category filtering.
- `components/application-card.tsx` — reviewed application card.
- `app/page.tsx` — home page, metadata, categories, technology, applications, representatives, contact.
- `app/products/page.tsx` — complete product index and metadata.
- `app/products/[category]/page.tsx` — five category pages, metadata, validation, static params.
- `app/products/[category]/[slug]/page.tsx` — 45 product details, metadata, semantic specifications, related products.
- `app/globals.css` — approved brand styling, mobile-first layouts, explorer/detail/table behavior.
- `tests/routes.test.ts` — exact route/static-param/canonical/not-found coverage.
- `tests/product-ui.test.tsx` — explorer, card, inquiry, home, table, and 320px behavior coverage.
- `.superpowers/sdd/task-5-report.md` — this report.

No catalog, shared component API, distributor constant, or reviewed product fact was changed.

## Self-Review

- Confirmed exactly one new `"use client"` boundary: `components/product-explorer.tsx`.
- Confirmed 45 products and 45 unique category/slug pairs.
- Confirmed exact category counts of 3/7/18/14/3.
- Confirmed all reviewed product image paths used by the catalog are local `/products/` assets.
- Confirmed Task 5 files contain no China contact channel, forbidden sales email, price, ecommerce, database, authentication, analytics, or server-side form behavior.
- Confirmed ProductCard is not wrapped in a full-card link and therefore creates no nested links.
- Confirmed `git diff --check` reports no whitespace errors.

## Concerns

No blocking concern. Application cards intentionally link to reviewed `/applications/...` routes, while implementation of those application pages remains outside Task 5.
