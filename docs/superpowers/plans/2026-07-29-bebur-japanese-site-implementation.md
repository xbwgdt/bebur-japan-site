# Bebur Japanese Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, validate, and deploy a modern Japanese Bebur corporate and product website with approximately 113 migrated pages, New Tree Industries as the exclusive Japanese distributor, and `www.bebur-jp.com` as the production domain.

**Architecture:** Use a Next.js 16 App Router application with data-driven static pages. Source pages are inventoried from the current Bebur English sitemap, normalized into typed Japanese content records, and rendered through shared category and detail templates. Railway runs the standalone Next.js server; content remains repository-owned and requires no database.

**Tech Stack:** Node.js 22, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React, Cheerio, Vitest, Testing Library, Railway.

## Global Constraints

- The canonical production origin is exactly `https://www.bebur-jp.com`.
- The organization label is exactly `Bebur 日本総代理店｜新樹産業株式会社`.
- The company address is exactly `〒340-0043 埼玉県草加市草加2－13－21－7`.
- The telephone number is exactly `080-5189-8663`.
- Every online inquiry link must address `info@newtree-i.com`.
- Chinese telephone numbers, Chinese sales email addresses, WeChat, Douyin, and ICP registration information must not ship.
- Product model numbers, numeric specifications, units, and measurement principles must match the source.
- Missing specifications must be omitted, never inferred.
- The migrated site must represent the current English-site structure, not the 874-URL legacy sitemap.
- No database, account system, tracking system, or server-side inquiry form is in scope.
- The site must support keyboard, touch, reduced-motion, and mobile layouts.
- Railway must run the standalone Next.js server and bind to its assigned `PORT`.

---

## Planned File Structure

```text
app/
  about/[slug]/page.tsx       Company subpages
  applications/[slug]/page.tsx
  contact/page.tsx
  insights/[slug]/page.tsx
  insights/page.tsx
  products/[category]/[slug]/page.tsx
  products/[category]/page.tsx
  products/page.tsx
  globals.css
  icon.tsx
  layout.tsx
  not-found.tsx
  opengraph-image.tsx
  page.tsx
  robots.ts
  sitemap.ts
components/
  application-card.tsx
  breadcrumbs.tsx
  contact-cta.tsx
  footer.tsx
  header.tsx
  hero.tsx
  product-card.tsx
  product-explorer.tsx
  section-heading.tsx
content/
  ja/about.json
  ja/applications.json
  ja/insights.json
  ja/pages.json
  ja/products.json
  source/source-manifest.json
lib/
  constants.ts
  content.ts
  routes.ts
  types.ts
public/
  products/
  applications/
scripts/
  audit-content.mjs
  collect-source.mjs
  download-assets.mjs
tests/
  contact.test.ts
  content.test.ts
  routes.test.ts
Dockerfile
next.config.ts
package.json
postcss.config.mjs
tsconfig.json
vitest.config.ts
```

### Task 1: Application Foundation and Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Test: `tests/contact.test.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `test`, `test:run`, `audit:content`.
- Produces: `siteConfig` and `buildMailto()` consumed by all later UI tasks.

- [ ] **Step 1: Create the package and compiler configuration**

Create `package.json` with Node 22, Next 16, React 19, Cheerio, Lucide, Vitest, and Testing Library. Use these scripts:

```json
{
  "name": "bebur-japan",
  "private": true,
  "version": "1.0.0",
  "engines": { "node": ">=22 <23" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -H 0.0.0.0",
    "test": "vitest",
    "test:run": "vitest run",
    "audit:content": "node scripts/audit-content.mjs"
  },
  "dependencies": {
    "cheerio": "^1.1.0",
    "lucide-react": "^0.468.0",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@tailwindcss/postcss": "^4.0.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies and capture the lockfile**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and `npm audit` reports no unresolved critical runtime vulnerability.

- [ ] **Step 3: Write the failing contact identity test**

Create `tests/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMailto, siteConfig } from "@/lib/constants";

describe("Japanese distributor identity", () => {
  it("uses New Tree Industries for every canonical contact field", () => {
    expect(siteConfig.company).toBe("新樹産業株式会社");
    expect(siteConfig.distributorLabel).toBe("Bebur 日本総代理店｜新樹産業株式会社");
    expect(siteConfig.postalCode).toBe("〒340-0043");
    expect(siteConfig.address).toBe("埼玉県草加市草加2－13－21－7");
    expect(siteConfig.phone).toBe("080-5189-8663");
    expect(siteConfig.email).toBe("info@newtree-i.com");
  });

  it("creates product inquiries to the approved mailbox", () => {
    expect(buildMailto("BT-7000 多項目水質分析計")).toBe(
      "mailto:info@newtree-i.com?subject=BT-7000%20%E5%A4%9A%E9%A0%85%E7%9B%AE%E6%B0%B4%E8%B3%AA%E5%88%86%E6%9E%90%E8%A8%88%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B"
    );
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:

```powershell
npm run test:run -- tests/contact.test.ts
```

Expected: FAIL because `@/lib/constants` does not exist.

- [ ] **Step 5: Implement the shared site identity**

Create `lib/constants.ts`:

```ts
export const siteConfig = {
  name: "Bebur Japan",
  origin: "https://www.bebur-jp.com",
  company: "新樹産業株式会社",
  distributorLabel: "Bebur 日本総代理店｜新樹産業株式会社",
  postalCode: "〒340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  email: "info@newtree-i.com",
} as const;

export function buildMailto(subject: string): string {
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(`${subject}のお問い合わせ`)}`;
}
```

Create `app/layout.tsx` with `lang="ja"`, site-wide metadata, and an empty structural shell that imports `app/globals.css`. Configure `next.config.ts` with `output: "standalone"` and remote image domains limited to `www.bebur.net` during migration.

- [ ] **Step 6: Run the focused test and build**

Run:

```powershell
npm run test:run -- tests/contact.test.ts
npm run build
```

Expected: 2 tests pass; Next.js completes a production build.

- [ ] **Step 7: Commit the foundation**

```powershell
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.ts postcss.config.mjs vitest.config.ts app/layout.tsx app/globals.css lib/constants.ts tests/contact.test.ts
git commit -m "feat: scaffold Bebur Japan site"
```

### Task 2: Source Inventory and Asset Acquisition

**Files:**
- Create: `scripts/collect-source.mjs`
- Create: `scripts/download-assets.mjs`
- Create: `content/source/source-manifest.json`
- Create: `public/products/**`
- Create: `public/applications/**`
- Test: `tests/content.test.ts`

**Interfaces:**
- Consumes: `https://www.bebur.net/sitemap.xml` and current `/en/` pages.
- Produces: `content/source/source-manifest.json` containing `sourceUrl`, `sourcePath`, `title`, `headings`, `paragraphs`, `tables`, and `images`.

- [ ] **Step 1: Write the failing source-manifest test**

Create `tests/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import manifest from "@/content/source/source-manifest.json";

describe("source inventory", () => {
  it("contains the current English site pages only", () => {
    expect(manifest.length).toBeGreaterThanOrEqual(100);
    expect(manifest.length).toBeLessThanOrEqual(120);
    expect(manifest.every((page) => page.sourcePath.startsWith("/en/"))).toBe(true);
    expect(new Set(manifest.map((page) => page.sourceUrl)).size).toBe(manifest.length);
  });
});
```

- [ ] **Step 2: Run the source test to verify it fails**

Run:

```powershell
npm run test:run -- tests/content.test.ts
```

Expected: FAIL because `source-manifest.json` does not exist.

- [ ] **Step 3: Implement deterministic source collection**

Create `scripts/collect-source.mjs` that:

1. Fetches `https://www.bebur.net/sitemap.xml`.
2. Extracts `<loc>` values.
3. Keeps HTTPS URLs whose pathname starts with `/en/`.
4. Removes language-switch URLs containing `?p=/Do/area`.
5. De-duplicates normalized URLs.
6. Fetches each page with a descriptive user agent and concurrency of four.
7. Uses Cheerio to collect the title, `h1`–`h3`, meaningful paragraphs, tables, image URLs and alt text.
8. Writes stable, alphabetically sorted JSON to `content/source/source-manifest.json`.

The output record must use this shape:

```ts
type SourcePage = {
  sourceUrl: string;
  sourcePath: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  tables: Array<{ headers: string[]; rows: string[][] }>;
  images: Array<{ src: string; alt: string }>;
};
```

- [ ] **Step 4: Generate and inspect the manifest**

Run:

```powershell
node scripts/collect-source.mjs
npm run test:run -- tests/content.test.ts
```

Expected: collection completes without failed URLs; the test passes with 100–120 unique `/en/` records. Record the exact page count in the implementation notes and use it as the migration denominator.

- [ ] **Step 5: Implement first-party asset downloading**

Create `scripts/download-assets.mjs` to download only `bebur.net` images referenced by the manifest, hash duplicate binaries, preserve image extensions, and emit an `assetMap` from source URL to local `/products/` or `/applications/` path. Reject tracking pixels and images smaller than 160 pixels in both dimensions.

- [ ] **Step 6: Download and verify assets**

Run:

```powershell
node scripts/download-assets.mjs
Get-ChildItem public/products,public/applications -Recurse -File | Measure-Object
```

Expected: product and application images exist locally; the downloader reports zero broken required images.

- [ ] **Step 7: Commit the source inventory**

```powershell
git add scripts content/source public/products public/applications tests/content.test.ts
git commit -m "chore: inventory Bebur source content"
```

### Task 3: Japanese Content Model and Migration Audit

**Files:**
- Create: `lib/types.ts`
- Create: `lib/content.ts`
- Create: `lib/routes.ts`
- Create: `content/ja/products.json`
- Create: `content/ja/applications.json`
- Create: `content/ja/about.json`
- Create: `content/ja/insights.json`
- Create: `content/ja/pages.json`
- Create: `scripts/audit-content.mjs`
- Modify: `tests/content.test.ts`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Produces: `Product`, `Application`, `Article`, and `StaticPage` types.
- Produces: `getProduct()`, `getProducts()`, `getApplication()`, `getArticle()`, and `getAllRoutes()`.
- Guarantees: every source-manifest record maps to one Japanese route or an explicit duplicate mapping.

- [ ] **Step 1: Define content types and failing coverage tests**

Define a common `ContentBase` with `slug`, `title`, `description`, `sourceUrl`, `publishedAt`, and `images`. Add:

```ts
export type Product = ContentBase & {
  kind: "product";
  category: "cleanliness" | "dosing" | "water-quality" | "gas-detection" | "flow-level";
  model: string;
  principle?: string;
  features: string[];
  applications: string[];
  specifications: Array<{ label: string; value: string }>;
  relatedSlugs: string[];
};
```

Add tests that require:

- Every source record has exactly one `sourceUrl` match in Japanese content or `content/ja/pages.json` duplicate mapping.
- Every Japanese page has a unique route.
- All titles and descriptions contain Japanese text where prose is expected.
- No content includes `18001379750`, `010-87653191`, `0838-2236056`, `sales@bebur.net`, `WeChat`, `Douyin`, or `蜀ICP备`.
- Every product has a model, category, Japanese title, and at least one application or feature.

- [ ] **Step 2: Run the coverage tests to verify they fail**

Run:

```powershell
npm run test:run -- tests/content.test.ts tests/routes.test.ts
```

Expected: FAIL because Japanese content files and content functions do not exist.

- [ ] **Step 3: Build the Japanese route map**

Map source pages to these route families:

```text
/products/{category}/{slug}
/applications/{slug}
/about/{slug}
/insights/{slug}
/contact
```

Use lower-case ASCII slugs derived from model numbers for products and concise English transliterations for other pages. Preserve source URLs in every record for traceability.

- [ ] **Step 4: Translate and normalize products**

For each source product page:

1. Preserve the model identifier exactly.
2. Translate the product name to the approved Japanese terminology.
3. Translate the overview, principle, features, applications, and specification labels.
4. Copy numeric values and units exactly.
5. Omit absent fields.
6. Replace source image URLs with local asset paths from Task 2.
7. Add only related products supported by the source category.

Write the records to `content/ja/products.json` and run the content tests after each product category.

- [ ] **Step 5: Translate applications, company pages, and insights**

Translate the remaining source records into `applications.json`, `about.json`, `insights.json`, and `pages.json`. Keep original publication dates. Remove China-specific contact blocks while retaining factual technical content. The distributor language must use `日本総代理店`.

- [ ] **Step 6: Implement the runtime content API**

Create `lib/content.ts` with pure lookup functions:

```ts
export function getProducts(category?: Product["category"]): Product[];
export function getProduct(category: Product["category"], slug: string): Product | undefined;
export function getApplication(slug: string): Application | undefined;
export function getArticle(slug: string): Article | undefined;
export function getAllRoutes(): string[];
```

Create `lib/routes.ts` for category labels, canonical route assembly, and static parameter generation.

- [ ] **Step 7: Implement and run the content audit**

Create `scripts/audit-content.mjs` to print:

- source page count;
- translated route count;
- duplicate mappings;
- missing images;
- forbidden contact matches;
- missing Japanese titles or descriptions;
- duplicate canonical routes.

Run:

```powershell
npm run audit:content
npm run test:run -- tests/content.test.ts tests/routes.test.ts
```

Expected: zero unmapped source pages, zero missing required images, zero forbidden contacts, zero duplicate routes, and all tests pass.

- [ ] **Step 8: Commit the complete Japanese content set**

```powershell
git add content/ja lib/types.ts lib/content.ts lib/routes.ts scripts/audit-content.mjs tests/content.test.ts tests/routes.test.ts
git commit -m "feat: add Japanese Bebur content catalog"
```

### Task 4: Design System, Header, Footer, and Shared Contact Experience

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `components/header.tsx`
- Create: `components/footer.tsx`
- Create: `components/contact-cta.tsx`
- Create: `components/breadcrumbs.tsx`
- Create: `components/section-heading.tsx`
- Create: `app/not-found.tsx`
- Modify: `tests/contact.test.ts`

**Interfaces:**
- Consumes: `siteConfig`, `buildMailto()`.
- Produces: shared chrome used by every route.

- [ ] **Step 1: Add failing shared-contact render tests**

Render `Footer` and `ContactCta` with Testing Library. Assert that:

- the company, postal code, address, phone, and email are visible;
- telephone links use `tel:080-5189-8663`;
- inquiry links use the approved mailto address;
- the distributor label is visible.

- [ ] **Step 2: Run the render tests to verify they fail**

Run:

```powershell
npm run test:run -- tests/contact.test.ts
```

Expected: FAIL because the shared components do not exist.

- [ ] **Step 3: Implement the visual foundation**

Define CSS tokens in `app/globals.css`:

```css
:root {
  --navy-950: #071c33;
  --navy-900: #0a2746;
  --blue-700: #0866b3;
  --blue-600: #087fd1;
  --cyan-400: #35c7dc;
  --ice-100: #eaf6fb;
  --slate-700: #334b5f;
  --slate-500: #667c8d;
  --line: #d9e5ec;
  --paper: #ffffff;
  --font-sans: "Noto Sans JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif;
}
```

Add responsive container, section, grid, button, focus-visible, reduced-motion, and typography utilities. Avoid gradients in body text and avoid decorative inline SVG.

- [ ] **Step 4: Implement responsive shared chrome**

Build:

- a desktop navigation and keyboard-accessible mobile menu;
- a top identity strip for the Japanese distributor;
- a footer with approved contact details and site navigation;
- a fixed mobile inquiry bar with telephone and email actions;
- breadcrumbs with an accessible navigation label;
- a branded 404 page linking to home and products.

- [ ] **Step 5: Run shared tests and build**

Run:

```powershell
npm run test:run -- tests/contact.test.ts
npm run build
```

Expected: contact tests pass; build completes without hydration or accessibility warnings.

- [ ] **Step 6: Commit shared UI**

```powershell
git add app components tests/contact.test.ts
git commit -m "feat: add Bebur Japan design system"
```

### Task 5: Home Page and Product Discovery

**Files:**
- Create: `components/hero.tsx`
- Create: `components/product-card.tsx`
- Create: `components/product-explorer.tsx`
- Create: `components/application-card.tsx`
- Create: `app/page.tsx`
- Create: `app/products/page.tsx`
- Create: `app/products/[category]/page.tsx`
- Create: `app/products/[category]/[slug]/page.tsx`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: product and application content APIs.
- Produces: static home, product index, category, and product detail routes.

- [ ] **Step 1: Add failing route-generation tests**

Test that every product produces:

```ts
`/products/${product.category}/${product.slug}`
```

and that each of the five approved product categories produces a category route. Assert that every product mail link contains its model and uses `info@newtree-i.com`.

- [ ] **Step 2: Run route tests to verify they fail**

Run:

```powershell
npm run test:run -- tests/routes.test.ts
```

Expected: FAIL because product routes and components do not exist.

- [ ] **Step 3: Build the home page**

Implement these sections in order:

1. Precision water and gas measurement hero.
2. Five product category cards.
3. Technology and quality proof points.
4. Featured applications.
5. Representative products.
6. Japanese distributor contact band.

Use actual Japanese content and first-party product imagery. The primary call to action is `製品情報を見る`; the secondary call to action is `お問い合わせ`.

- [ ] **Step 4: Build product discovery**

`ProductExplorer` is the only client component in the product flow. It accepts `Product[]`, filters by category and case-insensitive model/title query, exposes an accessible search label, and announces the result count.

Category and detail pages remain server components. Use `generateStaticParams()` and `generateMetadata()` from the content records. Missing products call `notFound()`.

- [ ] **Step 5: Verify product routes**

Run:

```powershell
npm run test:run -- tests/routes.test.ts
npm run build
```

Expected: route tests pass; the build prerenders all product category and detail pages.

- [ ] **Step 6: Commit product experience**

```powershell
git add app/page.tsx app/products components/hero.tsx components/product-card.tsx components/product-explorer.tsx components/application-card.tsx tests/routes.test.ts
git commit -m "feat: build Japanese product experience"
```

### Task 6: Applications, Company, Insights, and Contact Routes

**Files:**
- Create: `app/applications/[slug]/page.tsx`
- Create: `app/about/[slug]/page.tsx`
- Create: `app/insights/page.tsx`
- Create: `app/insights/[slug]/page.tsx`
- Create: `app/contact/page.tsx`
- Modify: `tests/routes.test.ts`
- Modify: `tests/contact.test.ts`

**Interfaces:**
- Consumes: all translated non-product content and shared contact components.
- Produces: the remaining current-site route inventory.

- [ ] **Step 1: Add failing non-product route tests**

Assert that:

- every application, company page, and insight has one generated route;
- publication dates retain `YYYY-MM-DD`;
- the contact page exposes telephone, email, postal code, address, and distributor label;
- no route points to a Chinese language page.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
npm run test:run -- tests/routes.test.ts tests/contact.test.ts
```

Expected: FAIL because the remaining route pages do not exist.

- [ ] **Step 3: Build application and company templates**

Application pages show the industry challenge, measurement needs, recommended products, and related cases. Company pages preserve factual source content and clearly separate Bebur brand information from the Japanese distributor identity.

- [ ] **Step 4: Build insights and contact**

Insights pages render the source publication date, Japanese article content, related products, and inquiry CTA. The contact page uses direct links only:

```ts
href="tel:080-5189-8663"
href="mailto:info@newtree-i.com?subject=Bebur%20%E8%A3%BD%E5%93%81%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B"
```

Do not add input fields, submission handlers, or data storage.

- [ ] **Step 5: Verify all content routes**

Run:

```powershell
npm run audit:content
npm run test:run
npm run build
```

Expected: audit reports complete mapping and zero forbidden contacts; all tests pass; all static routes build.

- [ ] **Step 6: Commit the remaining pages**

```powershell
git add app/applications app/about app/insights app/contact tests
git commit -m "feat: complete Japanese corporate content"
```

### Task 7: SEO, Social Preview, and Release Audit

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `app/icon.tsx`
- Create: `app/opengraph-image.tsx`
- Modify: `app/layout.tsx`
- Modify: `scripts/audit-content.mjs`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: `siteConfig.origin` and `getAllRoutes()`.
- Produces: canonical metadata, sitemap, robots policy, organization JSON-LD, and social preview.

- [ ] **Step 1: Add failing SEO tests**

Test that:

- every route begins with `https://www.bebur-jp.com`;
- sitemap URLs are unique;
- the organization JSON-LD identifies New Tree Industries as the Japanese exclusive distributor;
- robots allows public crawling and references the canonical sitemap.

- [ ] **Step 2: Run SEO tests to verify they fail**

Run:

```powershell
npm run test:run -- tests/routes.test.ts
```

Expected: FAIL because SEO route files do not exist.

- [ ] **Step 3: Implement metadata and structured data**

Set `metadataBase` to `new URL(siteConfig.origin)`. Add page-specific Japanese titles, descriptions, canonical links, Open Graph values, and X card metadata. Add organization JSON-LD with:

- name: `新樹産業株式会社`;
- email: `info@newtree-i.com`;
- telephone: `080-5189-8663`;
- postal address from `siteConfig`;
- URL: `https://www.bebur-jp.com`.

- [ ] **Step 4: Create the site-specific social preview**

Create one cohesive landscape social card using the finished navy, blue, cyan, and white design language. Required visible text:

```text
Bebur Japan
水質分析・ガス検知の精密ソリューション
日本総代理店 新樹産業株式会社
```

Inspect the generated result for exact text. If the image text is unusable, use `app/opengraph-image.tsx` to render the same content deterministically with `ImageResponse`; do not ship a generic starter card.

- [ ] **Step 5: Run the full release audit**

Run:

```powershell
npm run audit:content
npm run test:run
npm run build
```

Expected: zero content errors, all tests pass, and the production build completes.

Start the production server and verify representative routes:

```powershell
$env:PORT='3000'
npm run start
```

In a second terminal, request `/`, `/products`, one route from every product category, one application, one company page, one insight, `/contact`, `/sitemap.xml`, and `/robots.txt`. Expected: HTTP 200. Request a nonexistent slug. Expected: HTTP 404.

- [ ] **Step 6: Commit the release-ready site**

```powershell
git add app scripts tests
git commit -m "feat: finalize Bebur Japan SEO and release audit"
```

### Task 8: Railway Packaging, Deployment, and Domain

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: `next.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the exact commit that passed Task 7.
- Produces: Railway preview deployment and custom domain configuration for `www.bebur-jp.com`.

- [ ] **Step 1: Create the Railway-compatible container**

Create a multi-stage Node 22 Alpine `Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Set `.dockerignore` to exclude `.git`, `.next`, `node_modules`, local logs, and design-source files not required at runtime.

- [ ] **Step 2: Verify the production container**

Run:

```powershell
docker build -t bebur-japan:release .
docker run --rm -p 3000:3000 -e PORT=3000 bebur-japan:release
```

Expected: container starts as the non-root `nextjs` user and representative routes return HTTP 200.

- [ ] **Step 3: Verify Railway access and initialize the project**

Run:

```powershell
railway whoami
railway init
railway up
```

Expected: the authenticated Railway account owns the new project, upload completes, and deployment reaches success. If `railway whoami` is unauthenticated, stop before creating a project and ask the user to complete Railway login.

- [ ] **Step 4: Generate the Railway verification domain**

Run:

```powershell
railway domain
railway status
railway logs
```

Expected: Railway returns one `*.up.railway.app` domain and the service logs show the Next.js server listening on the Railway `PORT`.

Verify the same representative route set used in Task 7 against the Railway domain. Expected: HTTP 200 for real routes and HTTP 404 for the invalid route.

- [ ] **Step 5: Add the production custom domain**

Run:

```powershell
railway domain www.bebur-jp.com
```

Expected: Railway returns the required CNAME and TXT verification records. Provide those exact values to the user or apply them only when the user has supplied access to the domain DNS provider.

After DNS records are applied, poll:

```powershell
Resolve-DnsName www.bebur-jp.com
Invoke-WebRequest -UseBasicParsing -Uri https://www.bebur-jp.com -Method Head
```

Expected: DNS resolves to the Railway target and HTTPS returns 200 with a valid certificate. Railway documentation notes DNS propagation can take up to 72 hours, so an unpropagated record is reported as pending rather than treated as an application failure.

- [ ] **Step 6: Commit deployment configuration**

```powershell
git add Dockerfile .dockerignore next.config.ts package.json package-lock.json
git commit -m "chore: configure Railway deployment"
```

- [ ] **Step 7: Record final verification evidence**

Capture:

- exact migrated source count;
- exact Japanese route count;
- content audit summary;
- test summary;
- production build result;
- Railway deployment URL;
- `www.bebur-jp.com` domain status;
- any DNS action still requiring the domain owner.

Do not claim the custom domain is live until HTTPS verification succeeds.
