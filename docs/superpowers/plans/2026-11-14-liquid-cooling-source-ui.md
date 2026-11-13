# Liquid cooling source UI restoration

**Goal:** Restore the user-approved English editorial UI and native SVG flow animation on the Japanese solution route, retaining Japanese contacts and Sanity editing.

**Architecture:** Keep the current Next static export, shared Japanese site header/footer, route and all published page blocks. Scope the official source CSS to one editorial component. Add one optional `liquidCoolingDesign` object to the existing page document for translated UI copy, palette, typography, animated diagram labels, speed and image replacement. No raw HTML or CSS from the CMS is executed.

**Constraints:** 新樹産業株式会社; 080-5189-8663; info@newtree-i.com. No unrelated page/DNS/account/dependency changes. Preserve current CMS blocks, all 15 Chinese reference standards and the reviewed sensor specifications. Chinese standards remain clearly contextualized rather than Japanese legal requirements. Source design was explicitly approved in the user's latest request; execute and publish without another design gate.

**Approved refinement:** Retain the English source layout and animation, but use the Japan site's navy/brand-blue/light-blue palette rather than the original dark-green/teal colors. Default hero text is white with high-contrast pale-blue secondary copy. All palette tokens remain editable.

## Task 1 — Contracts and CMS design data
- [ ] Add failing tests in `tests/liquid-cooling-editorial.test.tsx`: native SVG and Japanese labels, CMS label/palette/image override, safe colors/links, reduced motion, all current blocks preserved.
- [ ] Add typed default design data and resolver in `content/ja/liquid-cooling-design.json` and `lib/liquid-cooling-design.ts`; include the optional page field in `lib/sanity/queries.ts` and local fallback.
- [ ] Add Chinese Studio controls in `sanity/schemaTypes/liquid-cooling-design.ts` and attach to `page.ts`; validate hex colors, typography, speed and navigation anchors.

## Task 2 — English source UI and Japanese flow diagram
- [ ] Implement `components/liquid-cooling/editorial-page.tsx` and `loop-diagram.tsx`, consuming the existing Sanity page and design object.
- [ ] Namespace the exact official source stylesheet into `app/liquid-cooling-editorial.css`; preserve desktop/mobile layouts, add Japanese font metrics, CMS variables and reduced-motion overrides. Do not leak selectors into other pages.
- [ ] Render all existing blocks once in the main reading flow; specialize the particle scale, stage timeline, parameter cards, products and FAQ without removing their editable data. Keep additional/new block types visible.
- [ ] Switch only the solution route to the editorial component; preserve metadata and internal route.
- [ ] Run targeted tests, production type checks, full tests/build and static/content audits.

## Task 3 — Publication and acceptance
- [ ] Add a narrowly scoped, revision-protected initialization script for the new design field only; read back unchanged blocks/contact settings and validate the document.
- [ ] Deploy the updated Chinese Studio and commit/push only task files.
- [ ] Confirm successful Cloudflare deployment, canonical route, all images/anchors/tel/mail links, Japanese labels and animated CSS; inspect desktop/mobile rendering.
- [ ] Hand off the same public URL and exact Sanity edit location, with any remaining verification limits stated.
