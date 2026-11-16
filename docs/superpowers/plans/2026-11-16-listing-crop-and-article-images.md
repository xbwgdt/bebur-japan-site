# Listing image fit and manufacturer article illustrations

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans task by task. The user has approved execution and production release after desktop/mobile verification.

**Goal:** Repair image clipping on `/applications`, `/applications/cases`, `/insights`, correct the landfill image/caption, and complete the nine approved articles with manufacturer illustrations.

**Architecture:** Keep the canonical templates and existing Sanity photo fields. Constrain only application/news thumbnail images inside their existing aspect-ratio containers. Append verified manufacturer photographs and Japanese-localized graphics to the ten approved CMS documents with revision guards; keep prior images, main prose, related-product selections and unrelated records unchanged.

**Tech Stack:** Next.js, CSS, Vitest, Sanity, existing Node 22 runtime, browser visual QA.

## Global constraints

- Japanese contact identity remains 新樹産業株式会社 / 080-5189-8663 / info@newtree-i.com, with existing address unchanged.
- Preserve Sanity editing, source image/caption fields, existing page style, product data, homepage carousel and solution animation.
- No invented product appearance, numerical specifications, certifications, customer installation claims, or altered technical flow relationships.
- Preserve unrelated dirty files, imports and lockfiles. No force push or workspace cleanup.
- Only ten CMS documents: `bt8200-cold-plate-liquid-cooling`, `bt8200-liquid-cooling`, `liquid-cooled-plate-cleanliness`, `manifold-cleanliness`, `plate-heat-exchanger-cleanliness`, `scm530-jiangsu-power-plant`, `water-ozone-analyzer-beverage`, `gt-3280-ou-landfill`, `ozone-detector-brands-2026`, `ozone-monitoring-equipment`.
- Existing audit sources: `.codex-tmp/final-site-image-audit-20261116/source-refined.json` and root artifact `artifacts/2026-11-16-whole-site-image-review/findings.json`.
- Graphic Chinese labels are translated faithfully; installation photographs and device faces remain documentary originals, with accurate Japanese captions.

### Task 1: Thumbnail layout regression

**Files:** `app/globals.css`, `tests/listing-image-fit.test.ts`.

**Interfaces:** Existing `.application-card__media`, `.insight-card__media` and their `img` children; no component APIs or product-card changes.

- [ ] Read the current media CSS and audit geometry (a 384.5px image overflowed a 214.5px application frame).
- [ ] Add failing tests that resolve the effective stylesheet declarations for both media frames/images and require relative frame positioning, absolute image positioning with inset 0, 100% dimensions and `object-fit: contain`.
- [ ] Run the regression test and observe the missing positional containment failure.
- [ ] Minimal implementation: make the two frames `position: relative`; make their direct thumbnail images `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain`. Keep aspect ratios, colors, borders, typography and card layout unchanged.
- [ ] Run targeted tests, report exact results; do not commit, push or touch other files. Owner will integrate and verify real browser geometry.

### Task 2: Verified manufacturer assets and CMS preparation

**Files:** New approved assets under `public/media/article-completion/`, provenance JSON under `content/source/`, ignored release helper under `.codex-tmp/`.

**Interfaces:** Existing page `contextImages`, news `coverImage` / `gallery`; existing Japanese captions. Use official original asset IDs from the prior audit: 1,2,6,8,9,14,17,20,21,23,31,32,35.

- [ ] View originals full-size; transcribe all diagram/marketing-panel text and verify exact Japanese terminology and numbers.
- [ ] Localize the two technical diagrams and leakage-detector panel without changing their measurement relationships or actual product photographs. Preserve originals and save Japanese sibling assets.
- [ ] Back up all ten targets and corresponding drafts, all protected document revisions and Japan contact identity.
- [ ] Build an exact image/caption allowlist, preserving existing images and other fields; make landfill instrument photo the lead and accurately label the retained facility photo.
- [ ] Validate proposed documents against the actual Studio schema with existing IDs before applying. Abort on divergent drafts or unreviewed revisions.
- [ ] Prepare/apply one guarded narrow transaction; read back only approved image fields changed, with unrelated records and all product/contact/home settings unchanged.

### Task 3: Verification and release

**Files:** Evidence in root `artifacts/2026-11-16-article-image-completion/`.

- [ ] Back up dirty import files, run full tests and restore byte-identical imports. Run production/Studio typechecks, published-CMS production build, content and static asset audits.
- [ ] Preview all three lists and ten targets on desktop/mobile: all thumbnails inside frames, all required photos/graphics loaded, Japanese graphic text legible, prior images/related products/contact paths intact.
- [ ] Independent code/content review; resolve important findings and rerun covering checks.
- [ ] Stage only task-owned files, verify remote main ancestry, normal push the verified release commit. Existing schema needs no new fields unless a genuine compatibility issue is found.
- [ ] Wait for GitHub Verify and Cloudflare success; check all 113 live pages plus requested media associations, image status, Japanese contacts and homepage protection.
- [ ] Live desktop/mobile screenshots and final acceptance, reset viewport, stop owned preview server, preserve unrelated files.

## Self-review

Scope matches the user's approved three lists plus ten content documents. Layout repair is bounded to application/news thumbnails. The images come from previously verified manufacturer body content, not logo blocks or generic AI illustrations. Existing published content and local editing paths remain intact.

## Release verification checkpoint

- Thumbnail regression RED: 8 failed / 2 product-preservation guards passed; minimal containment implementation GREEN.
- Final suite: 47 files, 435 tests passed. Production and Studio typechecks passed; content/static audits passed.
- Desktop 1440×1000 and mobile 390×844: all 70 listing cards contained, no horizontal overflow; ten articles / 28 figures loaded and Japanese captions verified.
- Mobile review identified dense diagram labels. Added a scoped 44px full-resolution link to captions on these ten articles only; tested the actual new-tab image opening. Other captions/layouts unchanged.
- Local fallback arrays also receive the same approved images so a CMS outage cannot restore the old landfill association. Mechanical deep comparison confirms only 8 application and 2 news image arrays changed.
- Manufacturer assets were re-fetched and byte-checked; photographs are unretouched. Three graphics localized with built-in image generation, followed by visual/numerical checks. Discarded PNG variants are outside public assets.
- CMS transaction applied only `contextImages` on 8 pages and `gallery` on 2 news documents. Readback confirms all other fields and 106 protected documents unchanged. Actual Studio image/caption editor opened read-only.
- Preview-only loader overrides were removed before final build. Normal published-CMS production output matches accepted preview; no ignored preview fixture is a release dependency.
- Normal build comparison caught stale news galleries despite correct CMS publication. News collection/detail reads now use a fresh build snapshot with static-export-compatible `force-cache`, matching the existing application/page policy. Regression RED: 2 failed; final normal rebuild contains all 28 expected figures and exact accepted captions/links.
- Independent read-only reviews found no critical, important or minor issues in CSS, content, CMS guards, caption links or fallback mapping.
- Remaining release gate: publish scoped Git commit; wait for GitHub/Cloudflare success; perform live desktop/mobile and sitemap/media checks. Evidence: root `artifacts/2026-11-16-article-image-completion/` and ignored `.codex-tmp/article-image-completion/`.
