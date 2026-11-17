# Applications index hero implementation plan

> **For agentic workers:** Execute inline using executing-plans; request an independent review before publishing. Steps use checkbox syntax.

**Goal:** Restore the manufacturer hero on `/applications`, with Sanity editing, without changing the solution promotion, cases or Japanese contacts.

**Architecture:** Reuse the existing dedicated `categoryHero` field, validated resolver and `SourceHero` component. Add `application-index` to the same-build CMS snapshot allowlist. Scope the SourceShell wrapper to the hero and breadcrumb only so lower sections retain their styles.

**Tech Stack:** Next.js, TypeScript, Sanity, Vitest, existing CSS.

## Global constraints

- Approved image: original manufacturer industry banner, `/source-media/1762161234430121-ff7959b79637fe02.jpg` (source: `https://www.bebur.net/en/static/upload/image/20251103/1762161234430121.jpg`).
- Default title: `産業別用途・導入事例`; eyebrow `APPLICATIONS`; existing Japanese summary retained.
- Default style: deep-blue mask, white text, standard sans-serif, medium title.
- Preserve `SolutionPromotion`, industry navigation, case cards, `080-5189-8663`, `info@newtree-i.com` and all unrelated CMS data.
- No dependency updates or unrelated worktree changes.

### Task 1: Regression tests and implementation

Files: `tests/applications-index-hero.test.tsx`, `tests/cms-normal-routes.test.tsx`, `content/ja/page-enhancements.json`, `lib/page-enhancements.ts`, `lib/sanity/queries.ts`, `sanity/schemaTypes/page-enhancements.ts`, `app/applications/page.tsx`.

- [ ] Verify current baseline: `node node_modules/vitest/vitest.mjs run tests/page-enhancements.test.tsx tests/cms-normal-routes.test.tsx`.
- [ ] Add tests that fail because the default hero is absent, dedicated CMS settings are ignored, and the field is hidden for `application-index`.
- [ ] Extend the existing resolver allowlist to `dosing` and `application-index`, selecting that key from defaults. Keep all text/style/URL validation.
- [ ] Expose `categoryHero` only on those two pages, with a Chinese label explaining its scope.
- [ ] Read `getPublishedPageForRoute("application-index")`; render `SourceHero` with resolved values and a separate breadcrumb band. Keep everything starting with `<SolutionPromotion />` unchanged.
- [ ] Include `application-index` in the per-build CMS snapshot list so a same-commit rebuild sees edits.
- [ ] Run targeted tests; update only the approved CMS-read expectations in canonical-route tests.

### Task 2: CMS and release verification

- [ ] Back up the target document and protected document revisions to ignored `.codex-tmp/applications-index-hero/`.
- [ ] Resolve the reviewed image asset by SHA1; upload only if absent. Prepare a revision-guarded patch containing only `categoryHero` on `page--application-index`; stop if it has an active draft.
- [ ] Validate the prepared document against the schema. Apply only after local tests/build pass. Read back the field, compare the rest of the document and protected revisions.
- [ ] Run all tests, Sanity typecheck/build, content audit, production build and static asset audit. Check the `out/applications.html` hero image, promotion and contact links.
- [ ] Preview desktop 1440px and mobile 390px; inspect loaded image, title contrast, overflow, lower promotion and telephone/email controls. Save screenshots.
- [ ] Independent review of the scoped diff, then deploy updated Studio schema and push only task files to `main`.
- [ ] Wait for successful CI/deployment; fetch the live hero image and verify actual desktop/mobile rendering and Sanity editing UI before reporting completion.

## Verified release checkpoint

- Full regression rerun after connection recovery: 449 tests passed across 50 files.
- Next.js production build, Sanity typecheck/Studio build and static asset audit passed.
- Original lower sections compare exactly with the existing live page: solution promotion, industry navigation, both card grids and Japanese contact CTA.
- CMS readback: only `categoryHero` changed on `page--application-index`; 115 unrelated documents unchanged.
- Manufacturer image responds HTTP 200. Local preview checked at 1440px desktop and 390px mobile; 31 cards and Japanese phone/email preserved.
- Independent read-only code review found no blocking issue.
- Sanity schema and Studio deployment succeeded after recovery. Frontend publication and final live browser verification remain the final gate.
