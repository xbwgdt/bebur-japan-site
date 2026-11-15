# Company navigation and image re-audit implementation plan

**Goal:** Make `/about/overview` the single company-information entry, remove the obsolete profile button, and report remaining image/content problems without changing them.

**Architecture:** Keep existing Next.js static export and Cloudflare hosting. Update shared desktop/mobile header and footer links; exclude the retired route from sitemap; redirect both old URL forms permanently at Cloudflare. Keep old source/CMS data recoverable rather than deleting it. Remove only the profile-card link label/href from local and Sanity overview data.

**Constraints:** Preserve all other overview content, Sanity editing, images, Japanese contact details and unrelated dirty files. No image substitutions during this audit. Findings distinguish verified mismatches, generic but relevant illustrative images, and uncertain manufacturer associations.

## Task 1: Regression coverage and bounded implementation

- [x] Change the shared-navigation expected destination to `/about/overview`; add footer assertion, overview profile-button absence, sitemap exclusion and exact Cloudflare redirect tests. Observed three expected failures before implementation.
- [x] Update `components/header.tsx`, `components/footer.tsx`, `content/ja/company-overview.json`, `app/sitemap.ts` and `public/_redirects`; align the existing sitemap audit/test expectations with 113 active URLs while keeping 114 recoverable source records. Preserve anchor `#company-profile` inside the overview page.
- [x] Back up Sanity overview and protected document revisions. Removed only the obsolete card's `linkLabel`/`href`; verified every other field, protected record and Japanese contact unchanged. Live overview HTTP200 and obsolete button count0.
- [x] Complete automated site checks on 2026-11-16 after fixing the timeout cause: 36 test files / 332 tests passed, production build and static-asset audit passed, content audit passed with 113 sitemap URLs and no reported errors, Studio typecheck and Studio build passed, and dependency audit reported zero vulnerabilities. The rebuilt static export was visually rechecked at 1440/390 px: no horizontal overflow, obsolete button absent, desktop/mobile/footer company destinations correct.
- [x] Inspect the overview and shared navigation at 1440 px and 390 px; no overflow, obsolete profile button absent, company links point to overview in preview. Independent read-only review found no blockers; the minor concurrent-draft guard was strengthened.
- [ ] Publish only approved task files to existing production main; wait for successful checks/deployment. Verify old URLs return permanent redirects, sitemap excludes the old path, all current pages link to overview, and the obsolete button is absent.

## Task 2: Read-only whole-site image/content review

- [x] Fetch all 114 current sitemap pages, inventory 125 distinct rendered image files, check loading and repeated associations, and visually inspect all seven contact sheets. No missing image file identified.
- [x] Compare the 48 product and 31 application records with current manufacturer pages. Verify the three sensor photo/dimension pairs byte-for-byte using the manufacturer's actual `/en/static/` paths. Distinguish relevant industry illustrations, product-only case imagery, intentional decorative banners and the UVSense/TOC semantic question from confirmed wrong-model images.
- [ ] Save a report with exact Japanese URLs, affected image description, supporting source, confidence and recommended action. Do not silently fix newly found images.
- [ ] Report completed navigation changes separately from the read-only audit findings and any limits.

## Publication approval and timeout resolution (2026-11-16)

The previous production commit/push was rejected while explicit approval and complete verification were missing. The user has now explicitly approved publishing the company-information navigation and old-URL redirects after resolving the verification timeout, with no image changes. No production push has yet been made in this follow-up.

Profiling identified unnecessary loading of the full Sanity Studio UI and a checkout-wide Vite filesystem watcher. The offline validation now uses Sanity's official headless schema/validation packages and the same definition helpers, pinned to the installed Studio version 6.23.0. Both one-shot validation/audit servers disable watching. All built-in schema types, custom rules, reference-existence validation, Japan contact checks and global cleanup remain. Explicit `validateReferenceTypes: false` preserves the old wrapper behavior. Regression tests verify invalid fields/references/contacts are rejected and valid cross-document references are accepted. Existing 60/180-second test limits are unchanged; no tests were skipped.

The controlled 63-document validation dropped from about 149 seconds to about 3 seconds. A read-only source review found no remaining Critical/Important blockers after the reference-default correction. The generated import files were checked against pre-run backups and remain byte-for-byte unchanged. All image assets and image assignments are out of scope and unchanged. Final deployment, public redirect and responsive-navigation evidence will be recorded after publication.
