# Homepage solution animation implementation plan

> **For agentic workers:** Execute inline with executing-plans; request an independent read-only review before production.

**Goal:** Replace only the homepage promotion's static visual with the dedicated solution's animated loop, retaining ソリューション, existing copy, links and Sanity controls.

**Architecture:** Reuse LoopDiagram and its scoped editorial CSS inside a homepage-only wrapper. Extend homeSolution with independently editable diagram settings and four validated colors; reuse the existing Sanity diagram field definition. Keep applications' shared promotion static via an explicit homepage-only prop. Preserve the existing image as the fallback in image mode.

**Tech stack:** Next static export, React, native SVG/CSS animation, Sanity, Vitest.

## Global constraints
- No dependency, product specification, company/contact, favicon or unrelated CMS changes.
- Keep the title 液冷システムの清浄度検査ソリューション and the existing summary/action editable.
- Respect animation off and prefers-reduced-motion; never require client JavaScript for animation.
- Desktop two columns; mobile one column with readable 14px legend and no horizontal overflow.
- Publish only after desktop/mobile browser QA, unit tests, static build and independent review.

## Tasks
- [x] Add failing tests: homepage-only animated SVG; existing applications/image mode; editable labels/speed/off/colors; invalid colors/URLs; schema and query coverage.
- [x] Reuse the diagram field, add homeSolution diagram/palette resolution and GROQ projection. Defaults animate without overwriting published copy. Render LoopDiagram only when homepage prop is enabled and mode is animation; image mode keeps existing uploaded image fallback.
- [x] Add a locally scoped pale-blue diagram wrapper using CSS variables and inherited font, with readable mobile legend. Keep dedicated-page styles/markup unchanged.
- [x] Run targeted Vitest tests under Node 22, Studio typecheck/build, production build and static audit. Review diff independently before main.
- [x] Preview the built output; inspect desktop and 390px/320px mobile layouts, labels, running flow and reduced-motion. Final contrast enhancement gives small accent text 5.48:1 against its panel. Studio controls checked during publishing below.
- [ ] Publish Studio schema and feature branch; wait for full CI/preview. Promote to main only after required checks. Confirm production homepage and unchanged dedicated page plus original Japan contacts. Save desktop/mobile screenshots.

## Verification commands
```powershell
.\.codex-tmp\node22\node.exe node_modules/vitest/vitest.mjs run tests/home-solution-animation.test.tsx tests/liquid-cooling.test.tsx tests/liquid-cooling-editorial.test.tsx --pool threads
.\.codex-tmp\node22\node.exe node_modules/typescript/bin/tsc --noEmit -p sanity/tsconfig.json
.\.codex-tmp\node22\node.exe node_modules/next/dist/bin/next build
.\.codex-tmp\node22\node.exe scripts/audit-static-assets.mjs
```
