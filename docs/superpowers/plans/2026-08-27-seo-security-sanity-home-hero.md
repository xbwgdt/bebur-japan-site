# Bebur Japan SEO, Security Headers, and Sanity Home Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicated brand suffixes and missing share images, add verified Cloudflare Pages security headers, and make the current home hero a published Sanity value without changing the visible design or unrelated settings.

**Architecture:** Centralize title and social-image normalization in a metadata helper used by every dynamic route. Keep Cloudflare Pages header policy in `public/_headers`. Add an idempotent, patch-only Sanity synchronization utility that uploads or reuses the approved hero image and modifies only `siteSettings.homeHero`.

**Tech Stack:** Next.js 15 static export, TypeScript, Vitest, Sanity Content Lake HTTP API, Cloudflare Pages, GitHub Actions.

## Global Constraints

- Do not change page structure, visible layout, Japanese body copy, contact details, domain settings, account roles, or asset cache policy.
- Preserve all unrelated dirty worktree files, especially `sanity/import/initial.ndjson`.
- Use test-first red-green cycles for production code.
- Sanity mutation must patch only `siteSettings.homeHero`; never replace the singleton document.
- Publish only after full tests, build, static audit, preview visual checks, and CSP console checks pass.

---

### Task 1: Centralize SEO title and share-image normalization

**Files:**
- Create: `lib/metadata.ts`
- Modify: `tests/document-seo.test.ts`

**Interfaces:**
- Produces: `normalizePageTitle(title: string): string`
- Produces: `socialTitle(title: string): string`
- Produces: `defaultSocialImage(): {url: string; alt: string}`

- [ ] **Step 1: Write failing tests for brand suffix normalization and default images**

```ts
import {
  defaultSocialImage,
  normalizePageTitle,
  socialTitle,
} from "@/lib/metadata";

expect(normalizePageTitle("BT8500｜Bebur Japan")).toBe("BT8500");
expect(normalizePageTitle("BT8500｜Bebur Japan｜Bebur Japan")).toBe("BT8500");
expect(socialTitle("BT8500｜Bebur Japan")).toBe("BT8500｜Bebur Japan");
expect(defaultSocialImage()).toEqual({
  url: "/opengraph-image",
  alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
});
```

- [ ] **Step 2: Run the focused test and confirm module-not-found failure**

Run: `npm exec vitest -- run tests/document-seo.test.ts`

Expected: FAIL because `@/lib/metadata` does not exist.

- [ ] **Step 3: Implement minimal normalization helper**

```ts
import { localPublicSiteSettings } from "@/lib/site-settings";

const brandSuffix = /(?:｜Bebur Japan)+$/u;

export function normalizePageTitle(title: string): string {
  return title.trim().replace(brandSuffix, "");
}

export function socialTitle(title: string): string {
  return `${normalizePageTitle(title)}｜Bebur Japan`;
}

export function defaultSocialImage() {
  return {
    url: localPublicSiteSettings.defaultOgImage.src,
    alt: localPublicSiteSettings.defaultOgImage.alt,
  };
}
```

- [ ] **Step 4: Run focused test and confirm green**

Run: `npm exec vitest -- run tests/document-seo.test.ts`

Expected: PASS.

### Task 2: Apply normalized metadata to every dynamic route

**Files:**
- Modify: `app/products/[category]/[slug]/page.tsx`
- Modify: `app/insights/[slug]/page.tsx`
- Modify: `app/about/[slug]/page.tsx`
- Modify: `app/applications/[slug]/page.tsx`
- Modify: `app/products/[category]/page.tsx`
- Modify: `tests/document-seo.test.ts`
- Modify: `tests/routes.test.ts`

**Interfaces:**
- Consumes: `normalizePageTitle`, `socialTitle`, `defaultSocialImage`
- Produces: route metadata with one brand suffix and a non-empty social image

- [ ] **Step 1: Add failing route tests**

```ts
const metadata = buildProductMetadata({
  ...product,
  seoTitle: `${product.title}｜Bebur Japan`,
  images: [],
});
expect(metadata.title).toBe(product.title);
expect(metadata.openGraph?.title).toBe(`${product.title}｜Bebur Japan`);
expect(metadata.openGraph?.images).toEqual([defaultSocialImage()]);
```

Add an audit assertion that every generated final title contains `Bebur Japan` exactly once and that `/about/company-profile` and `/about/overview` have different titles.

- [ ] **Step 2: Run focused tests and confirm expected duplicate-title/default-image failures**

Run: `npm exec vitest -- run tests/document-seo.test.ts tests/routes.test.ts`

Expected: FAIL on title and social-image assertions.

- [ ] **Step 3: Update route metadata builders**

For each route:

```ts
const rawTitle = record.seoTitle ?? record.title;
const title = normalizePageTitle(rawTitle);
const image = record.images[0]
  ? { url: resolveSourceMediaPath(record.images[0].src), alt: record.images[0].alt }
  : defaultSocialImage();

return {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title: socialTitle(rawTitle),
    description,
    url: canonical,
    images: [image],
  },
};
```

Resolve the two about routes with route-specific fallbacks:

```ts
const aboutSeoTitles: Record<string, string> = {
  "company-profile": "Beburについて",
  overview: "企業概要",
};
```

- [ ] **Step 4: Run focused tests and confirm green**

Run: `npm exec vitest -- run tests/document-seo.test.ts tests/routes.test.ts`

Expected: PASS.

### Task 3: Add Cloudflare Pages security headers

**Files:**
- Modify: `public/_headers`
- Modify: `tests/deployment-config.test.ts`

**Interfaces:**
- Produces: enforceable static response policy compatible with Next.js, Sanity assets, and Cloudflare Web Analytics

- [ ] **Step 1: Add a failing header-policy test**

```ts
expect(headers).toContain("Strict-Transport-Security: max-age=31536000");
expect(headers).toContain("X-Frame-Options: DENY");
expect(headers).toContain("Permissions-Policy:");
expect(headers).toContain("Content-Security-Policy:");
expect(headers).toContain("https://static.cloudflareinsights.com");
expect(headers).toContain("https://cdn.sanity.io");
expect(headers).not.toContain("includeSubDomains");
expect(headers).not.toContain("preload");
```

- [ ] **Step 2: Run focused test and confirm missing-header failure**

Run: `npm exec vitest -- run tests/deployment-config.test.ts`

Expected: FAIL because the global rules are absent.

- [ ] **Step 3: Add the global header rule without changing cache rules**

```text
/*
  Strict-Transport-Security: max-age=31536000
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Content-Security-Policy: default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.sanity.io; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com https://*.sanity.io; form-action 'self' mailto:;
```

- [ ] **Step 4: Run focused test and confirm green**

Run: `npm exec vitest -- run tests/deployment-config.test.ts`

Expected: PASS.

### Task 4: Build an idempotent Sanity home-hero patch

**Files:**
- Create: `scripts/sync-home-hero-to-sanity.mjs`
- Create: `tests/home-hero-sync.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildHomeHeroPatch({ hero, assetId }): { id: "siteSettings"; set: { homeHero: object } }`
- Produces: CLI command `npm run sanity:sync-home-hero -- --dry-run`

- [ ] **Step 1: Write failing patch-scope test**

```ts
const patch = buildHomeHeroPatch({ hero, assetId: "image-test-1x1-jpg" });
expect(patch.id).toBe("siteSettings");
expect(Object.keys(patch.set)).toEqual(["homeHero"]);
expect(JSON.stringify(patch)).not.toContain("contactPage");
expect(JSON.stringify(patch)).not.toContain("createOrReplace");
expect(patch.set.homeHero.backgroundImage.asset._ref).toBe("image-test-1x1-jpg");
```

- [ ] **Step 2: Run focused test and confirm module-not-found failure**

Run: `npm exec vitest -- run tests/home-hero-sync.test.ts`

Expected: FAIL because the sync module does not exist.

- [ ] **Step 3: Implement pure patch builder and guarded CLI**

The CLI must:

1. Read Sanity project ID, dataset, API version, and authentication token from existing configuration/environment.
2. Hash the approved local hero image.
3. Query matching `sanity.imageAsset.sha1hash`; upload only if missing.
4. Send one patch mutation:

```json
{
  "patch": {
    "id": "siteSettings",
    "set": {
      "homeHero": {
        "eyebrow": "WATER QUALITY & GAS DETECTION",
        "title": "水質とガスを、より確かに。",
        "summary": "Beburの精密計測技術で、水処理、製造、医薬、液冷設備の安全と品質管理を支えます。",
        "backgroundImage": {
          "_type": "image",
          "asset": { "_type": "reference", "_ref": "image-a1b2c3-1920x1080-jpg" },
          "alt": "Beburの水質分析・ガス検知ソリューション"
        },
        "primaryAction": { "label": "製品情報を見る", "href": "/products" },
        "secondaryAction": { "label": "お問い合わせ", "href": "/contact" },
        "style": {
          "color": "brand",
          "fontSize": "xl",
          "alignment": "left",
          "spacing": "normal",
          "desktopTitleWrap": "nowrap"
        }
      }
    }
  }
}
```

5. In `--dry-run`, print patch scope and asset status without mutation.
6. After mutation, query `siteSettings{homeHero,contactPage,phone,inquiryEmail}` and verify approved contact values are unchanged.

- [ ] **Step 4: Run focused test and dry-run**

Run: `npm exec vitest -- run tests/home-hero-sync.test.ts`

Run: `npm run sanity:sync-home-hero -- --dry-run`

Expected: test PASS; dry-run reports only `homeHero` patch scope and does not mutate.

### Task 5: Full local verification and preview deployment

**Files:**
- No production file changes

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified static `out` and a Cloudflare preview deployment

- [ ] **Step 1: Run full automated checks**

Run: `npm test`

Run: `npm run sanity:typecheck`

Run: `npm run audit:content`

Run: `npm run build`

Run: `npm run audit:static`

Expected: all commands exit 0; 20 or more test files pass; static audit reports no missing assets or route errors.

- [ ] **Step 2: Audit generated HTML**

Run a script over `out/**/*.html` asserting:

- 110 canonical public pages
- zero duplicated `｜Bebur Japan｜Bebur Japan`
- zero duplicate final titles
- every page has `og:image`
- every page has canonical, description, one H1, and Analytics beacon

- [ ] **Step 3: Deploy a Cloudflare preview and inspect desktop/mobile**

Deploy the current branch as a preview without promoting it to production. Verify homepage, products, a product detail, company profile, applications, insights, and contact at desktop and 390-pixel mobile width.

- [ ] **Step 4: Verify CSP and response headers in the preview**

Confirm no browser console CSP errors, all images/scripts load, Cloudflare Analytics beacon request is not blocked, and response headers include the new policy.

### Task 6: Publish Sanity hero and production code

**Files:**
- No additional source changes

**Interfaces:**
- Produces: published `siteSettings.homeHero` and production deployment

- [ ] **Step 1: Execute the guarded Sanity patch**

Run: `npm run sanity:sync-home-hero`

Expected: one `homeHero` patch; contact fields unchanged; webhook triggered.

- [ ] **Step 2: Commit only task files**

Stage the exact production and test files from Tasks 1-4. Do not stage existing unrelated dirty files.

- [ ] **Step 3: Push the implementation commit**

Push the current branch/approved integration path and observe GitHub Verify and Cloudflare Pages production deployment.

- [ ] **Step 4: Perform fresh production verification**

Verify:

- latest GitHub Verify succeeds
- latest Cloudflare deployment succeeds
- Sanity `siteSettings.homeHero` is non-null and matches the approved hero
- 110/110 sitemap pages return 200
- title/OG audit is clean
- security headers are present
- desktop/mobile visuals match the approved site
- contact tel/mailto and Web Analytics remain functional

- [ ] **Step 5: Record final evidence**

Report commit, deployment URL/time, test counts, crawl counts, response headers, Sanity query result, and any remaining external-only work. Do not report completion without these fresh results.
