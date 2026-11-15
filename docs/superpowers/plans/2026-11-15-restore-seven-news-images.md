# Restore Seven News Image Sets Implementation Plan

> **For agentic workers:** Use executing-plans to implement this approved, bounded restoration inline. Steps use checkbox syntax for tracking.

**Goal:** Restore the original manufacturer image sets on the seven approved Japanese news pages, verify desktop/mobile rendering, and publish.

**Architecture:** Reuse the existing manufacturer assets in `public/source-media`; restore only `images` in the seven local fallback article records, and `coverImage`/`gallery` on their existing Sanity news documents. Existing rendering, schema, body copy, contacts, unrelated articles and user drafts remain intact. Preview local fallback content before changing published CMS documents; then verify production consumes the same assets.

**Tech Stack:** Next.js static export, TypeScript, Vitest, Sanity Content Lake, Cloudflare Pages, Chrome browser QA.

## Global Constraints

- Scope: six exhibition/conference news articles plus `particle-charge-analyzer-papermaking` only.
- Japanese company: 新樹産業株式会社.
- Preserve `080-5189-8663`, `info@newtree-i.com`, `〒340-0043`, `埼玉県草加市草加2－13－21－7`.
- Preserve all article prose, dates, SEO, URLs, related product references and publication state.
- Retain Chinese Sanity controls `封面图片` and `图片库` with accurate Japanese alt text.
- Backup existing CMS documents; abort on divergent drafts or concurrent revisions. Patch only approved image fields.
- No production publication before seven-page desktop/mobile visual QA passes.
- Preserve existing unrelated dirty files; commit/push only explicitly reviewed task files.

## Task 1: Content and regression check

Files: `tests/news-image-restoration.test.ts`, `content/ja/insights.json`.

- [x] Add regression assertions that the seven image arrays equal their original source asset-map associations, with counts `2,2,2,1,1,3,1` and Japanese alt text. Confirm test fails on the current empty arrays.
- [x] Set only those arrays. Keep first image as cover and remaining images as gallery. Reuse existing local assets without editing originals.
- [x] Run the new test and existing content/CMS rendering tests. Validate every local asset against the live manufacturer file. Passed 55 content/rendering tests and 21 Studio/schema tests in separate batches; initial combined schema check timed out and passed when rerun alone.

## Task 2: Staged assets and visual preview

Files: ignored `.codex-tmp/restore-news-images.mjs`, ignored `.codex-tmp/news-image-restoration/*`, `artifacts/2026-11-15-news-image-restoration/*`.

- [x] Read the existing Sanity documents and their drafts; save a before snapshot. Check project `gbzt89e5`, dataset `production`, exact article slugs and contacts.
- [x] Reuse Sanity assets by original SHA1 where present; upload missing original assets without changing published news documents. Save the proposed image-field values for later revision-guarded publication. Four existing assets reused; eight original images uploaded.
- [x] Build the current real Next.js renderer with local fallback content (Sanity project disabled only in that preview process). Start the static preview server. A stale local compilation cache was preserved/moved; the normal Turbopack build then passed, including TypeScript and 120 exported routes.
- [x] Inspect all seven article image sets and news-list thumbnails in Chrome at desktop and 390 px mobile widths; ensure complete images, no stretching, readable layout, no overflow, and preserved Japanese contact links. Save screenshots. Sanity Chinese image controls also verified in the hosted Studio. Independent read-only review findings resolved, including one lecture-hall alt correction and publish-time allowlist guards.

## Task 3: Publish and read back

- [ ] After QA, patch only `coverImage` and `gallery` on the seven published documents and identical drafts. Compare every other field and protected document revision against the before snapshot.
- [ ] Commit only the content restoration, test and this plan. Push the reviewed commit to the existing production branch.
- [ ] Verify successful Cloudflare deployment and live image sets match the approved Sanity assets. If a stale build cache is observed, retry with cleared build cache rather than changing unrelated code.
- [ ] Verify Sanity image controls and persisted asset references; inspect representative live desktop/mobile pages. Restore viewport and close task-owned temporary tabs/server.
- [ ] Report the seven restored articles, verification result and public link, with a screenshot.
