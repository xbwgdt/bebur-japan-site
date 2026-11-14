# Source-faithful liquid-cooling restoration

> For agentic workers: execute with subagent-driven-development; use the task-specific briefs below. Product evidence and translation preparation may run independently; one owner integrates and publishes.

**Goal:** Restore the complete meaning of https://www.bebur.net/fuwu/ in professional Japanese, resolve EC350/TURB113 discrepancies from manufacturer evidence, preserve CMS editing and Japan contacts, and publish only after verification.

**Architecture:** Keep existing block-based Sanity page, animated hero, styling controls and stable anchors. Restore prose and data in local JSON plus precise revision-guarded CMS patches. Keep existing uploaded images and layout; renderer changes only for complete block rendering and correct logarithmic particle scale.

**Tech stack:** Next static export, TypeScript/React, Sanity production dataset, Cloudflare Pages Git deployment.

## Global constraints

- Scope: liquid-cooling solution page; two sensor records only if verified parameter corrections require consistency with linked product pages.
- Preserve 新樹産業株式会社, 080-5189-8663, info@newtree-i.com and 〒340-0043 埼玉県草加市草加2－13－21－7.
- Translate all source assertions, examples, conditions, quantities, recommendation strength and original boundaries; do not substitute editorial summaries or translator commentary.
- Established names: BT8200/BT8500 = オンライン式液中パーティクルカウンタ; BTP8300 = 携帯型液中パーティクルカウンタ.
- No invented specifications or claims. Any unresolved manufacturer contradiction is explicitly recorded and not silently selected.
- Preserve Sanity editing for text, images, colors, typography and diagram controls. No unrelated user changes, dependencies, credentials, DNS or accounts.
- Before CMS writes: snapshot exact targets; validate data; patch only authorized fields with revision guards; read back and compare all unrelated fields.
- Before publishing: tests, typecheck, static build/audits, independent fidelity/code review, desktop/mobile visual checks; after publication: successful deployment and live read-back.

## Task 1 — Manufacturer evidence

- [ ] Fetch exact Chinese product links from fuwu and their linked English equivalents/downloads for BS-EC350 and BS-TURB113.
- [ ] Record model-specific ranges, constants, power and brush configuration with source URLs and dates. Compare against current Japanese page/product records.
- [ ] Write `.codex-tmp/fidelity-manufacturer-evidence.md`; do not mutate production or application files.

## Task 2 — Complete translation data

- [ ] Read current source snapshots and local content JSON. Add a regression test for omitted arguments, concrete operating details, full particle-counter specifications and source authorship/related material.
- [ ] Run focused test and observe expected failures before changing content.
- [ ] Restore `content/ja/liquid-cooling-solution.json` completely while retaining known block keys/anchors and uploaded-image associations. Preserve corrected summary. Keep sensor conflicts pending Task 1.
- [ ] Any new blocks use existing richText/dataTable/cardGrid types and deterministic keys, translated titles and valid links. Add the missing manifold reading link to the manufacturer's exact published source rather than inventing a Japanese route.
- [ ] Translate particle caption as a logarithmic order-of-magnitude illustration. Restore hard operating requirements and source caveats without adding independent commentary.
- [ ] Run focused tests, self-review and write `.codex-tmp/fidelity-content-report.md` including source-to-block mapping and any unresolved gaps. No commits or external writes; owner integrates exact files.

## Task 3 — Integration, CMS and release

- [ ] Add failing renderer tests covering all restored paragraphs, editable logarithmic chart notes, parameter introduction and correct particle bars.
- [ ] Minimally adapt renderer and design JSON: render complete particle prose, parameter preface and added blocks; derive logarithmic widths safely from editable numbers; preserve mobile legend/button fixes.
- [ ] Apply verified manufacturer resolution consistently in solution and authorized two sensor records where needed; retain evidence note.
- [ ] Snapshot CMS targets and write revision-guarded updater. Diff only translated titles/content, authorized specification rows and matching design copy. Preserve all images, styles, settings and unrelated documents; validate/read back exact expected state.
- [ ] Run targeted tests, full suite once, frontend/Studio types, production build and content/static audits. Build output must match current CMS data, not stale fetch cache.
- [ ] Independent review compares complete Chinese source against actual Japanese data/rendered output, evaluates technical reconciliation and migration safety; resolve important findings and re-review.
- [ ] Check desktop 1280/1440 and mobile 375/390 in browser; all text, charts, tables, navigation and contacts remain usable.
- [ ] Commit only task files and push HEAD to existing main production branch; monitor Cloudflare and CI success, verify live complete text/links/contacts and save screenshots.

## Execution result (2026-11-14)

- Manufacturer investigation complete: TURB113 brush is optional in both product specification tables. EC350 remains unresolved: Chinese product/solution A–D conflicts with English product A–E, constants and power. Existing EC350 details and standalone products were not changed; a current controlled manufacturer specification is still required.
- All ten source sections plus introduction, authorship and related readings reviewed independently against the full Chinese snapshot. Existing 25 blocks, anchors and uploaded images retained; 6 editable blocks added.
- Logarithmic particle bars corrected from editable size values; desktop/mobile legend and one-line contact buttons retained.
- CMS updater tested RED/GREEN, bound to reviewed fingerprint and revision, preserves unknown metadata/parameter fields and rejects card removal. Published only the solution document; 25 → 31 blocks, schema errors 0, exact read-back passed, site settings unchanged. Backup saved locally before mutation.
- Checks passed: original full suite 258 tests, then updated focused set 26 tests (including two additional migration guards); frontend and Studio typechecks; local fallback build and CMS-backed production build; static asset audit; 31-block/8-table/8-FAQ/5-stage rendered-content comparison and all 6 images HTTP 200.
- Independent fidelity review passed; both migration-safety review findings fixed and re-reviewed. Local browser checked desktop 1440/1280 and mobile 375/390 without document overflow; tables remain scrollable, animation and contacts work.
- Production Git deployment and final live/browser verification: pending at commit preparation.

## Progress

- Starting commit: 1e87e17638a08ab8475a4f81749af7d4b6ee8a3d.
- Existing linked worktree confirmed; baseline 21 focused tests passed.
