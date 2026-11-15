# Japan-first liquid-cooling references implementation plan

> Execute inline with regression tests and a read-only review before publication. User approved the design and publication on 2026-11-15; do not ask again about the same decisions.

**Goal:** Localize the existing solution page to applicable Japanese standards first, with US-origin industry guidance where no suitable Japanese counterpart was verified.

**Architecture:** Keep all 31 block identities, the editorial renderer, media, animation and Sanity schema. Update only reviewed text/table/card fields in `content/ja/liquid-cooling-solution.json` and labels/metrics in `content/ja/liquid-cooling-design.json`. Publish the same fields into the existing Sanity page with revision checks, backup, dry-run fingerprint and read-back verification.

## Global constraints

- Preserve 新樹産業株式会社, 080-5189-8663, info@newtree-i.com and all company settings.
- Preserve all product specifications, uploaded images, block styles, custom palette, font and diagram settings.
- This user-approved localization supersedes the earlier requirement to retain 15 Chinese standards; do not merely substitute standard numbers onto Chinese limits.
- JIS K 0102-1:2021 plus Amendment 1:2023: industrial-water test methods, not universal coolant acceptance limits. Validate glycol/additive matrix applicability.
- JIS B 9933:2023: hydraulic-fluid contamination coding reference, not a mandatory data-center cleanliness grade.
- ASHRAE TC 9.9 Water-Cooled Servers (2019): distinguish facility/technology cooling loops; white paper, not a US compulsory national standard.
- OCP accepted water-based and PG-fluid guidance plus pre-commission manifold preparation: keep medium/scope restrictions and do not imply certification.
- No universal inherited 16/14/11, 50/300 µm, 24-hour, ±0.5 pH, ≤10 µS/cm or incoming/running 5/20 NTU acceptance claims.
- Retain useful engineering explanations, five stages, eight FAQs, six product links, original related readings, and Japanese professional wording. Internal EC350 questions remain private; sensor specs stay unchanged.
- Do not modify DNS, accounts, dependencies, other pages, or unrelated dirty worktree files.

## Task 1 — Regression contracts

- Add `tests/liquid-cooling-standards.test.tsx` checking no Chinese normative references in page/design, Japanese-first references, clear guideline scopes, no inherited universal thresholds, editable metric/navigation overrides and contacts.
- Run the test and verify expected failures on current content.

## Task 2 — Reviewed Japanese text and migration

- Patch the two content JSON files, preserving section IDs and unaffected data; retain numeric examples only when explicitly illustrative and not borrowed acceptance requirements.
- Update old source-fidelity assertions only where the newly approved localization supersedes them.
- Extend the existing revision-protected migration helper/script with an opt-in design-field allowlist for metrics/navigation. Test that defaults still preserve these fields and only explicit approved fields change.
- Run targeted tests, full tests, production build, content/static audits and Studio type checks. Verify unchanged specifications/media/styles.

## Task 3 — Publish and verify

- Fetch current Sanity document again; require published document/contact preconditions, no unreviewed copy drift, and no unexpected draft.
- Save a private local pre-publication backup, validate proposed Sanity content, dry run, publish only approved fields with ifRevisionID and fingerprint, then verify persisted content/settings.
- Build with live Sanity configuration, inspect desktop/mobile via browser, verify tables, FAQ, animation, fonts, images, links, tel/mail and overflow.
- Read-only review before source integration; commit only task files and publish via the existing Git/Cloudflare path. Verify the actual custom-domain HTML includes the revised standards and not the old references.
- Leave unrelated dirty files and the existing worktree intact. Report actual verification and public URL; do not claim launch if deployment or visual checks are blocked.

## Pre-publication evidence

- Regression RED observed: four localization assertions and the explicit metrics/navigation migration test failed before implementation.
- Targeted tests: 41 passed; full suite: 26 files / 267 tests passed.
- Production build: 120 generated pages; production TypeScript and Studio TypeScript passed. The sandbox child-process restriction required retrying the unchanged build in normal local execution.
- Content audit: 112 source URLs represented, no missing images, forbidden contacts, language switches, duplicate routes or Japanese copy errors. Static audit: zero unresolved local asset references.
- Local rendered route: all 31 blocks, 8 tables, 8 FAQs, 5 stage entries, 6 images HTTP 200; all reviewed copy and links matched.
- Browser review: desktop 1920px, mobile 390px and narrow 320px; no page/card/title overflow, tables scroll independently, readable 14px mobile legend, 48px no-wrap bottom buttons, native animation active.
- Independent read-only review: no critical/important defects; block identities, four specification tables, six product links, colors, typography, media and animation preserved.
- CMS dry run: one published page, no draft, 31 blocks, zero validation errors; only blocks and approved design copy change. Company settings preserved.
