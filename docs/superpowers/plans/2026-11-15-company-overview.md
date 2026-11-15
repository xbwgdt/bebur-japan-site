# Complete Japanese company overview implementation plan

> **For agentic workers:** Execute inline with executing-plans; request independent read-only review before production.

**Goal:** Fill `/about/overview` with the complete Japanese company presentation approved by the user, referencing https://www.bebur-tech.com/about_41/.

**Architecture:** Add a focused overview renderer using existing Sanity page blocks. A bundled complete Japanese document is the resilient fallback; published CMS blocks override it when they contain real body content, not just a legacy hero. The overview-only theme field exposes page palette/font; existing module presets remain usable. Other about routes retain their canonical renderer.

**Tech stack:** Next static export, React, semantic HTML/CSS, Sanity page blocks, Vitest. No new dependencies.

## Constraints
- Preserve 新樹産業株式会社, 080-5189-8663, info@newtree-i.com and the approved Japan address.
- Preserve the homepage loop animation and all unrelated pages, including `/about/company-profile`.
- Retain the reference structure: company profile, four key figures, three culture cards, five history milestones, certificates, seven exhibitions, and section links.
- Use real source photographs/documents, Japanese captions, optimized lazy thumbnails, and original certificate links. Never infer Japanese certification or current scope from a logo.
- Preserve technical meaning; omit unsupported superlatives, not substantive company history/mission. No internal translation/audit notes on the public page.
- Everything customer-facing in the new body comes from editable page modules. Safe palette/font controls must not allow injected CSS/URLs.

## Task 1: Content and reliable page selection
Files: `content/ja/company-overview.json`, `lib/company-overview.ts`, `app/about/[slug]/page.tsx`, `tests/company-overview.test.tsx`.
- [x] Add failing route tests for complete sections, images, contacts, published edits, legacy-hero fallback, and unaffected company profile.
- [x] Supply Japanese blocks with source-matched images and links. Keep four factual source figures and full five-part presentation.
- [x] Select CMS content only when real body remains; fall back on missing/malformed reads. Metadata and hero use the same document.

## Task 2: Responsive view and CMS controls
Files: `components/company-overview.tsx`, `app/company-overview.css`, `app/globals.css`, `sanity/schemaTypes/company-overview-style.ts`, `sanity/schemaTypes/page.ts`, `lib/sanity/queries.ts`.
- [x] Render one semantic h1, section navigation, two-column profile, four figures, culture cards, timeline, certificate and exhibition grids.
- [x] Reuse existing editable blocks/presets; add overview-only validated hex palette and sans/serif font. Preserve other pages.
- [x] Test invalid colors/links, anchors, image fallbacks and theme values. Optimize source images without redrawing documents.

## Task 3: Verify, seed and publish
- [x] Run targeted regressions, Studio typecheck/build, website production build, static/content audit and independent review.
- [x] Back up the raw `page--overview` document and any draft; replace only its approved fields with revision guards. Upload its image assets to Sanity, retain original files locally and do not modify other page documents.
- [ ] Desktop and 390px/320px browser QA: content/image coverage, contrast, no overflow, working anchors/contact/certificate links; verify Chinese Studio controls.
- [ ] Publish Studio and feature branch, wait full CI/preview success, promote to main and read back production. Save desktop/mobile evidence and confirm homepage animation remains present.

## Commands
```powershell
.\.codex-tmp\node22\node.exe node_modules/vitest/vitest.mjs run tests/company-overview.test.tsx tests/cms-normal-routes.test.tsx tests/routes.test.ts tests/home-solution-animation.test.tsx --pool threads
.\.codex-tmp\node22\node.exe node_modules/typescript/bin/tsc --noEmit -p sanity/tsconfig.json
.\.codex-tmp\node22\node.exe node_modules/next/dist/bin/next build
.\.codex-tmp\node22\node.exe scripts/audit-static-assets.mjs
```

## Verified evidence before preview release
- User confirmed hiding expired certificates; six current/no-expiry documents retained with exact product scope. Five expired source documents are not included in the release asset allowlist.
- 88 targeted regression tests passed in six files. Studio typecheck and Studio build passed. Fresh clean-cache Next production build passed (120 generated entries); content/static audits passed.
- Independent follow-up review found no release blocker; static social-image fallback remains a deferred minor issue.
- Local browser QA: desktop 1920px, mobile 390px and 320px, one h1, readable text, loaded certificate thumbnails, no horizontal overflow, functioning in-page anchors and Japanese tel/mail links. Narrow-screen statistic headings adjusted and rechecked.
- Sanity upload/readback: 18 image references, eight modules; raw backup saved under ignored `.codex-tmp/backups/company-overview-2026-11-15T11-53-04-274Z/`. No pre-existing draft; only six allowed fields changed, other page/settings/product/news revisions unchanged.
