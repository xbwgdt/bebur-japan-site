# Japanese homepage carousel and image remediation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task. User approved the prior image review and six-slide proposal on 2026-11-16.

**Goal:** Publish six manufacturer-derived Japanese homepage slides and correct the approved image/context issues without disturbing the homepage solution animation, Japan contacts or Sanity editing.

**Architecture:** Add a bounded, accessible client carousel fed by validated Sanity site settings, with six local fallback slides. Keep source backgrounds separate from Japanese HTML text. Replace broad industry imagery with explicit Japanese technical configuration illustrations when no authenticated corresponding factory photo is available. Synchronize only allowlisted CMS paths after backups and revision checks.

**Tech Stack:** Next.js static export, React, TypeScript, native CSS/SVG, Sanity 6.23.0, Vitest, Cloudflare Pages.

## Verified execution record

- 2026-11-16: Tasks 1 and 2 implemented; two independent code review passes approved after correcting control-loop fidelity, typed CMS array items and exact published/draft ID pairing.
- Final full suite: 41 files / 382 tests passed. Website production builds passed with both local fallbacks and actual published Sanity content; static audit found zero missing assets. Content audit: 113 canonical sitemap URLs, no unmapped sources or validation errors. Studio build/typecheck passed; dependency audit found zero vulnerabilities.
- Desktop 1440 and mobile 390/375 checks covered six slides, text/palette, controls, no horizontal overflow, Japanese technical diagrams, contact buttons and preserved flowing solution animation. Reduced-motion disables autoplay while manual navigation remains usable. Long dosing diagrams retain natural height; solution title words remain unbroken.
- Existing Studio application deployed with Chinese carousel/image fields. Twenty-one approved published documents patched transactionally after backup/revision checks; protected documents, legacy hero, homeSolution and Japan contacts read back unchanged. Actual Sanity schema validation: zero existing or new errors.
- Studio draft-only text edit and drag-sort were saved, read back, and restored to original text/order. Published settings stayed unchanged throughout; an identical recoverable draft is retained rather than deleted.
- Production code push and final live verification are the remaining release gate at this commit.

## Global Constraints

- Existing hosting/repo only; base commit a29733f. No unrelated dirty files in commits.
- Six manufacturer homepage images in their original order. Remove embedded promotional English/Chinese without changing product identities; Japanese headings/descriptions/buttons remain editable HTML.
- Keep `<SolutionPromotion animated />` and `siteSettings.homeSolution` unchanged.
- Preserve 新樹産業株式会社, 080-5189-8663, info@newtree-i.com and the existing postal address.
- Do not fabricate project photos, actual customer installations, product specifications or certifications. Mark technical schematics as 配置例 / 構成例, not actual installation evidence.
- Retain all correct product photos, manufacturer source trace and recoverable originals. No deletion of CMS documents/drafts.
- No new dependencies. Portable Node 22; retain existing timeouts and validation checks.
- Passing local tests/builds, read-only review, desktop/mobile browser QA before production push. Verify production release afterward.

## Task 1: Editable six-slide carousel

**Files:** Create `components/home-carousel.tsx`, `components/home-carousel.css`, `lib/home-carousel.ts`, `content/ja/home-carousel.json`, `sanity/schemaTypes/home-carousel.ts`, `tests/home-carousel.test.tsx`. Modify `app/page.tsx`, `lib/site-settings.ts`, `lib/sanity/queries.ts`, `sanity/schemaTypes/siteSettings.ts` and existing tests only where behavior intentionally changes.

**Interfaces:** `siteSettings.homeCarousel` contains enabled, autoPlay, intervalSeconds, and slides. Each slide has `_key`, title, eyebrow, summary, image `{asset,alt}`, primaryAction `{label,href}`, style `{color,fontFamily,fontSize,alignment}`, optional safe custom text/background/button colors if following existing palette patterns. Resolved public images use `{src,alt}` and default assets `/media/home-carousel/slide-1.webp` through `slide-6.webp`. Main worker supplies those six image files. Export `localHomeCarousel` and a resolver consumed by public site settings; keep legacy homeHero fallback for disabled carousel and recovery.

- [ ] Write tests first: six Japanese slides; local/Sanity resolver and unsafe href/image/style rejection; next/previous/dots/pause; manual navigation; single h1; inactive slides inaccessible; reduced-motion prevents autoplay; homepage still contains solution promotion animation and Japan contacts.
- [ ] Observe expected failure with `node22 node_modules/vitest/vitest.mjs run tests/home-carousel.test.tsx`.
- [ ] Implement native React carousel with previous/next, Japanese dot labels, visible pause/resume, focus/hover pause, cleanup, reduced-motion support. No swipe library. Pause button remains operable independently of hover/focus. Use first-image eager loading, others lazy; no page-wide layout shifts.
- [ ] Japanese standard sans font default; strong contrast; font-size presets and desktop/mobile layout; source images remain uncropped enough to recognize subject, mobile copy must not become baked-in tiny text. No overflow or bottom bar collisions.
- [ ] Add Chinese-labeled Sanity controls for enabled/autoplay/interval/reorderable slides, image+alt, Japanese title/summary/eyebrow, safe action and presentation controls. Existing homeHero controls remain recoverable.
- [ ] GROQ selects full fields; resolver sanitizes values and respects CMS changes including reordered slides. An explicitly empty/disabled carousel falls back safely.
- [ ] Run focused tests and Studio typecheck. Commit only owned carousel files (no images and no CMS writes). Report TDD and constraints in `.codex-tmp/carousel-implementation-report.md`.

## Task 2: Approved image remediation and localized assets

**Files:** `public/media/home-carousel/*`, `public/media/industry/*`, `public/media/dosing/*`, source/asset provenance JSON, `content/ja/applications.json`, `content/ja/products.json`, `content/ja/insights.json`, focused tests. Main worker owns this task.

- [ ] Prepare image-generation cleanup of the six original banners; inspect each output, retain reference originals and prompts. No altered physical product or fabricated installation imagery.
- [ ] Industry overview and eight industry pages: use relevant verified source imagery where available; otherwise create Japanese configuration illustrations with appropriate instruments and functional labels. Update thumbnails consistently.
- [ ] Papermaking article: use existing correct LabSense photograph as cover; remove broad factory illustration. April residual-chlorine comparison: remove extra generic water-treatment illustration, retain correct BT6308-CL/BC350 visual.
- [ ] TOC guide: retain correctly identified UVSense image, add explicit caption distinguishing UV absorption estimates from oxidation-based TOC instruments. Do not invent verification claims.
- [ ] Five product-only case pages: retain legitimate photos with explicit product/configuration captions, add native sampling/measurement illustrations for liquid-cooling, pharma, heat exchanger and dosing topics where useful. Do not relabel another project's photo as the case.
- [ ] BT-9000C/L/S: replace Chinese process-label raster diagrams with Japanese native schematics preserving the documented sensing/control/chemical injection relationships, not claiming new hardware.
- [ ] Tests: approved image assignments, Japanese alt/captions, prohibited generic asset removal and correct product names; then focused tests pass.

## Task 3: CMS synchronization, review and release

- [ ] Back up published and draft versions of all target documents and protected site settings. Build a dry-run allowlist. Reject stale revisions or concurrent drafts for affected paths.
- [ ] Upload new assets and narrowly patch only homeCarousel and approved image/gallery/block/caption fields. Preserve unrelated edits, homeHero, homeSolution, contacts and all untouched documents. Read back and compare the exact expected state.
- [ ] Deploy Studio schema with existing authorized account/host; verify Chinese carousel editing controls and published field readback. Do not create a parallel Studio.
- [ ] Run complete Vitest suite, dependency audit, content audit, website production build/static resource audit, Studio typecheck/build. Restore generated import files to their exact pre-run state if tests rewrite them.
- [ ] Read-only reviewer evaluates complete allowed diff; resolve Critical/Important issues and rerun covering tests.
- [ ] Desktop 1440 and mobile 390/375 browser verification: all six slides, Japanese text, controls, reduced-motion, image/contrast/layout, preserved solution animation and contact actions. Save screenshots.
- [ ] Commit only approved task files and push to existing main after all prelaunch checks pass. Wait for Cloudflare and GitHub success.
- [ ] Read back live six-slide HTML and images, contact links, old company redirect, sitemap113 and affected image assignments. Final report states completed work and any fact-limited image choices candidly.
