# Category Banner and Chemical Product Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved manufacturer hero to the dosing category and eight relevant, linked products to the chemical application page, with dedicated Sanity controls.

**Architecture:** Keep canonical route layouts. Read only dedicated optional `categoryHero` and `applicationProducts` page fields; never render legacy generic blocks. Fall back to reviewed local defaults on unavailable or invalid CMS data. Product cards reuse the existing catalog, pictures and detail routes.

**Tech Stack:** Next.js static export, React, TypeScript, Sanity, Vitest.

## Global Constraints

- Only `/products/dosing` and `/applications/chemical-industry` change visually.
- Preserve seven dosing products, search/filter, Japanese contact identity and homepage carousel/solution animation.
- Category hero uses `/source-media/1762147356906250-b3ac3b47b4049a96.jpg`, Japanese heading and summary.
- Chemical products: AS-300 combustible/toxic/VOC, GT-3280-OU, BT6308-pH/Cond/DO, UVSense; do not invent certification or compliance claims.
- Sanity edits must survive rebuild; preserve unrelated fields, user files and divergent drafts.
- Desktop and mobile visual acceptance precedes production publication.

### Task 1: Dosing banner

**Files:** `tests/page-enhancements.test.tsx`, `content/ja/page-enhancements.json`, `lib/page-enhancements.ts`, `components/source-faithful/source-hero.tsx`, `app/products/[category]/page.tsx`, `app/globals.css`, `sanity/schemaTypes/page-enhancements.ts`, `sanity/schemaTypes/page.ts`, `lib/sanity/queries.ts`.

**Interfaces:** `resolveCategoryHero(category: string, value?: unknown)` returns a validated hero or undefined. CMS image is a Sanity image asset; text and approved color/font presets are editable.

- [x] Add a failing route test: `expect(container.querySelector('.category-banner img')?.getAttribute('src')).toContain('1762147356906250')`; assert seven dosing cards and search remain.
- [x] Run `.codex-tmp/node22/node.exe node_modules/vitest/vitest.mjs run tests/page-enhancements.test.tsx`; expect missing-banner assertion failure.
- [x] Implement the dedicated hero resolver/schema/projection and route branch; retain compact heroes for other categories. Use existing `SourceHero` with optional class name, preset style classes and a breadcrumb/count band.
- [x] Run targeted tests and verify CMS overrides and unsafe/legacy fallback.

### Task 2: Chemical application product groups

**Files:** same dedicated data/resolver/schema/test, `components/application-products.tsx`, `app/applications/[slug]/page.tsx`.

**Interfaces:** `resolveApplicationProducts(slug: string, value?: unknown)` returns `{title,summary,groups:[{category,title,summary,moreLabel,productSlugs}]}`. Projection dereferences product slugs; normalization filters unknown or mismatched categories and deduplicates references. An explicit empty group list hides the section; missing/malformed data uses fallback.

- [x] Add a failing route test asserting exactly eight `.product-card` elements and two category links.
- [x] Run targeted tests; expect zero-card assertion failure.
- [x] Implement two groups using existing `ProductCard` and `SourceCardGrid`; heading/copy/references/order editable in Sanity. Keep other application pages' existing recommendations unchanged.
- [x] Test override ordering, explicit empty lists, bad references, CMS failures and preserved Japan contacts.

### Task 3: Validation and release

**Files:** task-specific ignored `.codex-tmp` release scripts and `artifacts/2026-11-16-category-chemical/` evidence.

- [x] Back up dirty import files before full tests; restore exact bytes afterward.
- [x] Run targeted/full tests, root and Studio type checks/builds. Validate prepared target documents using the actual Studio schema.
- [x] Save published/draft snapshots of only dosing and chemical page documents. Prepare only `categoryHero` / `applicationProducts`; patch with revision guards, preserve divergent drafts and verify unrelated fields/contact settings unchanged.
- [x] Build with published CMS data and visually inspect both routes at desktop and mobile sizes; inspect links, overflow and search.
- [x] Obtain independent read-only code review and resolve findings.
- [ ] Stage only this task's source/test/schema/plan files; commit and non-force push to `main` after checking its ancestry.
- [ ] Verify GitHub checks and Cloudflare deployment success, then live banner/product links and contacts; save screenshots. Deploy Studio to existing Bebur app, not a new project.

## Self-review

Both approved scopes have independent route tests. Dedicated fields cannot replace the canonical layout. No new dependency, contact mutation, generic product claim or unrelated page redesign is required.

Pre-release evidence: 390 full-suite tests passed, plus the added existing-Studio-target regression (10 deployment tests passed). Production and Studio type checks/builds passed. Actual prepared documents had zero schema errors. Both CMS patches were read back with all 114 protected documents unchanged. Browser acceptance covered desktop, 390px and 375px mobile; no horizontal/card overflow, search worked and the conductivity product link opened its correct detail page. Existing Studio ID is pinned in `sanity/sanity.cli.ts` to preserve the user's current editing entry point.
