# Liquid Cooling Solution Implementation Plan

**Goal:** Publish the approved Japanese liquid-cooling solution and three sensor pages with editable Sanity content and prominent navigation.

**Architecture:** Retain the existing Next.js static export, Sanity production dataset gbzt89e5, and Cloudflare Pages bebur-jp. Reuse page blocks for the solution and product documents for the sensors. Keep local reviewed content as a fallback and seed only new CMS documents plus narrowly scoped promotion/navigation fields.

**Constraints:** Company 新樹産業株式会社; telephone 080-5189-8663; email info@newtree-i.com. Preserve existing unrelated worktree changes. Technical numbers must match each official product source; identify Chinese standards as reference criteria. No invented Japanese regulatory or customer-adoption claims.

## Approved routes and entry points
- /solutions/liquid-cooling-cleanliness-testing
- /products/water-quality/bs-phs276
- /products/water-quality/bs-ec350
- /products/water-quality/bs-turb113
- Header link, fixed homepage promotion before product categories, applications promotion, related links on existing liquid-cooling and particle-counter pages.

## Tasks
- [ ] Extract all four official pages and reconcile product-specific specifications; translate complete substantive solution content and sensor content to Japanese.
- [ ] Reuse Sanity page blocks for an accessible solution layout with table of contents, Japanese system diagram, responsive tables, product links and inquiry actions.
- [ ] Add CMS-editable homepage promotion and navigation label; register product fallback content and sitemap routes.
- [ ] Validate new documents against Studio schema. Add targeted integration checks for CMS overrides, links, routes and Japanese technical content. Run relevant tests, type checks, production builds and asset audits.
- [ ] Dry-run the CMS seed, reuse/upload official product assets, create only absent new documents, revision-protect settings patch, and verify contact data is unchanged.
- [ ] Deploy updated Studio, push the tested source to main for Cloudflare production, and verify final live pages, header/home entry points, sitemap, images, tel/mail links and CMS-backed values.

## Execution
The user explicitly approved translation, CMS editing and publication on 2026-11-13. Execute in this session; no additional publishing approval is needed. Bounded source-content tasks may run in parallel, while the primary agent owns integration, CMS writes, and deployment.
