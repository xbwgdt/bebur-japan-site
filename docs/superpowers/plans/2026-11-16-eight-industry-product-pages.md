# Eight Industry Product Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete product introductions and detail links on the eight user-approved pages, with Sanity editing and responsive QA before release.

**Architecture:** Extend the existing dedicated `applicationProducts` field and canonical `ApplicationProducts` component, not legacy generic page blocks. Keep existing recommendations and add approved missing products. The industry overview additionally exposes eight editable, allowlisted industry links. Product photos and descriptions stay shared with the existing catalog.

**Tech Stack:** Next.js static export, React, TypeScript, Sanity, Vitest; no new dependencies.

## Global Constraints

- Approved slugs only: `electric-power-industry`, `environmental-protection`, `municipal-water-treatment`, `liquid-cooling-industry`, `industry-solutions`, `plate-heat-exchanger-cleanliness`, `manifold-cleanliness`, `online-disinfectant-analyzer-waterworks`.
- Preserve all existing product recommendations on the four populated industry detail pages.
- Preserve chemical and dosing pages, other application pages, page heroes, prose, imagery, style, homepage carousel/animation and Japanese contacts.
- Japanese contact: 新樹産業株式会社 / 080-5189-8663 / info@newtree-i.com.
- No new standards, certification, compatibility or performance claims. Reuse published catalog descriptions.
- Only patch `applicationProducts` on eight existing page documents, with backups, revision guards and draft-conflict protection.
- Desktop and mobile visual acceptance precedes the production push. Reuse Studio app `tv1tbzu23214yqqurejer2e3`.

## Approved product mapping

| Page | Existing retained | Additions / final total |
|---|---:|---|
| Electric power | 14 | AS-525 toxic online, AS-300 combustible, streaming current system / 17 |
| Environmental protection | 10 | AS-525 combustible, AS-300 toxic / 12 |
| Municipal water | 20 | streaming current system, BT-9000L, BT-9000C / 23 |
| Liquid cooling industry | 6 | BS-PHS276, BS-EC350, BS-TURB113 / 9 |
| Industry overview | 0 | Eight industry navigation entries; BT8200, BT-7000, SCM530, AS-300 combustible / 4 |
| Plate heat exchanger | 0 | BT8200, BT8500, BTP8300 / 3 |
| Manifold | 0 | BT8200, BT8500, BTP8300 / 3 |
| Waterworks disinfectants | 0 | BT6308-CL, BT6308-OZ, BT6308-CD / 3 |

### Task 1: Dedicated grouped selections and overview navigation

**Files:** create `content/ja/application-product-selections.json`; modify `lib/page-enhancements.ts`, `components/application-products.tsx`, `app/applications/[slug]/page.tsx`, `lib/sanity/queries.ts`, `sanity/schemaTypes/page-enhancements.ts`; create `tests/industry-product-pages.test.tsx`; extend `tests/company-overview-static-read.test.ts`.

**Interfaces:** `applicationProductPageSlugs: string[]`; existing `resolveApplicationProducts(slug, value?, catalog?)` returns a typed grouped selection, optionally with `navigation: {title,summary,items:[{slug,title,summary}]}`. Product category `all` means mixed-category recommendations linking to `/products`; otherwise use the existing five categories. Navigation slugs are restricted to the eight established industry pages.

- [ ] Write route tests asserting final card counts `17,12,23,9,4,3,3,3`, valid image/description/detail link on every card, all previous slugs retained, and eight overview links.
- [ ] Run `.codex-tmp/node22/node.exe node_modules/vitest/vitest.mjs run tests/industry-product-pages.test.tsx`; observe missing grouped-selection failures.
- [ ] Add reviewed Japanese group titles, short use-case summaries and product slugs in the JSON mapping. Keep the existing chemical defaults intact.
- [ ] Extend normalization to the eight approved slugs, five categories plus `all`, safe navigation references, explicit empty removal and malformed-data fallback. Validate against the current catalog.
- [ ] Extend the canonical renderer and Studio field; project industry page references to slugs. Add the approved pages to build-specific force-cache reads.
- [ ] Run targeted route, schema and cache tests; verify unrelated pages still ignore generic CMS blocks.

### Task 2: Scoped CMS and browser validation

**Files:** ignored `.codex-tmp/eight-industry-release.mjs`; evidence under `C:/Users/bwgd/Documents/Bebur/artifacts/2026-11-16-industry-products/`.

- [ ] Read and back up the eight published pages, any corresponding drafts and protected document revisions; verify published Japanese contacts.
- [ ] Resolve exactly the approved product references, build proposed `applicationProducts`, validate actual Studio schema with all existing IDs and save the dry-run report.
- [ ] Apply one guarded transaction; read back exact changed fields and unchanged protected records. Preserve divergent drafts.
- [ ] Back up dirty import NDJSON, run full tests and restore byte-identical original files. Run production/Studio type checks, builds, content and static-asset audits.
- [ ] Build with published CMS data, inspect all eight pages at desktop and mobile dimensions, including long model names, overview navigation and product detail links.
- [ ] Obtain independent read-only review, resolve important findings and rerun relevant checks.

### Task 3: Release and live verification

- [ ] Stage only this task's source, schema, tests and plan; confirm remote ancestry and non-force push the verified commit to `main`.
- [ ] Deploy Studio controls to the existing app, confirm actual field visibility and product references.
- [ ] Wait for GitHub Verify and Cloudflare success. Check all 113 live sitemap pages, expected products/counts/navigation on eight targets, image availability, Japanese contacts and unchanged homepage settings.
- [ ] Save live desktop/mobile evidence, stop the owned preview server, preserve unrelated user files and report live page links.

## Self-review

The eight-page allowlist matches the user's approval. Food, medical, hydraulic and other cases are intentionally excluded. Existing recommendations are retained. The navigation enhancement is confined to the overview. No product documents or contact settings need mutation.
