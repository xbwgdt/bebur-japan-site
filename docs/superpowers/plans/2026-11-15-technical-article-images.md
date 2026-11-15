# Technical Article Images Implementation Plan

> **For agentic workers:** Execute inline using executing-plans, with the previously verified seven-news-image restoration workflow. Steps use checkbox syntax for tracking.

**Goal:** Replace generic imagery on the seven remaining technical articles with corresponding original Bebur images, then publish after desktop/mobile QA.

**Architecture:** Restore only article image arrays in `content/ja/insights.json` and `coverImage`/`gallery` on the existing Sanity news records. Reuse tracked manufacturer assets and existing responsive rendering. No new frontend behavior or schema changes.

**Tech Stack:** Next.js static export, Sanity, Vitest, Cloudflare Pages, Chrome QA.

## Global Constraints

- Scope is the seven technical articles listed below; retain the seven exhibition/technical articles repaired in commit `94f5143`.
- Preserve all body text, parameters, dates, SEO, slugs, related products and publication state.
- Japanese contact: 新樹産業株式会社, 〒340-0043, 埼玉県草加市草加2－13－21－7, 080-5189-8663, info@newtree-i.com.
- Retain Sanity `封面图片` and `图片库` editing and Japanese image descriptions.
- Use original manufacturer files unchanged. Identify illustrative water-treatment artwork as an image/illustration, not an installed customer site.
- No production publication until all seven pages pass desktop/mobile visual QA.
- Backup CMS state; abort on divergent drafts or changed revisions; patch only the two image fields.
- Preserve all unrelated dirty workspace files; stage only reviewed task files.

## Approved image mapping

| Article slug | Original file(s) in order |
|---|---|
| liquid-particle-counter-brands | 1773201229211214.jpg: BT8200/BT8500/BTP8300 product lineup |
| online-residual-chlorine-analyzer-brands | 1774589627282883.jpg: BT6308-CL and BC350 |
| online-residual-chlorine-analyzer-recommendations | 1774589627282883.jpg: BT6308-CL and BC350 |
| residual-chlorine-detector-brands-2026-april | 1774589627282883.jpg; 1763108910519122.jpg: instruments and water-treatment illustration |
| residual-chlorine-detector-brands-2026-march | 1763099445589527.jpg: original BT6308-CL product photo |
| toc-analyzer-brands-2026 | 1774319324598474.jpg: UVSense instruments discussed in the article |
| toc-analyzer-brands-2026-march | 1774251187149620.jpg; 1774251223120714.jpg: TOC cabinet exterior/interior |

## Task 1: Source and content validation

Files: `tests/news-image-restoration.test.ts`, `content/ja/insights.json`.

- [x] Confirm the seven unique original files are currently embedded in corresponding manufacturer article/product pages and byte-identical to tracked assets. Evidence: ignored `.codex-tmp/technical-image-restoration/source-verification.json`.
- [x] Add the exact ordered associations above to the existing regression test. Verified seven new failures before implementation; the previous eight passed.
- [x] Set only the seven image arrays with accurate Japanese alt text, without touching prose. Image/content/page tests: 62 passed; separately run Studio/schema tests: 21 passed.

## Task 2: Staging and visual QA

- [x] Extend the ignored CMS helper with a separate hardcoded `--technical` target allowlist and separate backup folder. Preserve its revision, field, asset SHA1, ordering and alt guards.
- [x] Prepare/reuse Sanity assets only, leaving published documents unchanged until visual checks pass.
- [x] Build with local fallback content using the existing portable Node 22 runtime, disabling Sanity only in that preview process. Production build and TypeScript passed; 120 routes generated.
- [x] Check all seven pages and their thumbnails at 1440 px desktop and 390 px mobile widths. All images load, preserve aspect ratio and fit within the viewport. Saved 14 article screenshots and preview-qa.json in artifacts/2026-11-15-technical-article-images.
- [x] Review the exact image associations and publish mutation scope before release. Independent review: no critical, important or minor findings.

## Task 3: Release

- [ ] Commit only the content arrays, regression test and this plan. After QA, apply the revision-guarded CMS image-field transaction and verify all other fields/documents unchanged.
- [ ] Push to the existing production main ref, without force. Wait for Cloudflare success and CI results.
- [ ] Compare all seven live galleries and thumbnails with their Sanity assets; also verify the seven previously restored articles remain correct.
- [ ] Inspect representative live desktop/mobile pages, save final screenshots, reset the viewport, close task-owned temporary tabs and stop the preview server. Report the deployed result.
