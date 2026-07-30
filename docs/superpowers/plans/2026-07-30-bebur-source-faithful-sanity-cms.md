# Bebur Source-Faithful Sanity CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a source-faithful Japanese Bebur site with a Chinese Sanity Studio and automatic Cloudflare Pages rebuilds after publishing.

**Architecture:** Next.js remains a static exporter. Source visual assets are stored locally and used by page-family templates; Sanity is read during builds with checked-in Japanese data as a safe fallback. A Git-connected Cloudflare Pages project rebuilds after a Sanity webhook calls its deploy hook.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Sanity Studio v3, Sanity client, GitHub, Cloudflare Pages.

## Global Constraints

- Preserve 112 source-content pages / 110 canonical routes and source-equivalent visual hierarchy.
- Use the approved company, Japanese address, phone, and `mailto:info@newtree-i.com`; omit all language switching.
- Use Sanity Free: Chinese labels, public dataset, invited Administrator accounts only, maximum 20 trusted users.
- Public pages cannot render remote Bebur image URLs; all first-party image/script references must exist in `out/`.
- Publish under `www.bebur-jp.com` from a Bebur-owned Git-connected project, never an AJAZZ account/project.

---

### Task 1: Capture source assets and page-family manifest

**Files:**
- Modify: `scripts/collect-source.mjs`, `scripts/download-assets.mjs`, `content/source/asset-map.json`
- Create: `content/source/page-family-manifest.json`, `tests/source-assets.test.ts`
- Modify: `tests/content.test.ts`

**Interfaces:** The manifest is an array of `{ route, family, sourceUrl, localAssets }`, covering `home`, `product-index`, `product-detail`, `application`, `insight`, `about`, and `contact`.

- [ ] Write a failing test that reads the new manifest, requires exactly those seven families, and requires at least one local asset per representative route.
- [ ] Run `npm run test:run -- tests/source-assets.test.ts`; verify failure is `ENOENT` for the absent manifest.
- [ ] Extend the collection script to record source layout markers and every visual reference; extend the asset downloader to write normalized files below `public/source-media/` and local URLs into `asset-map.json`.
- [ ] Run `node scripts/collect-source.mjs && node scripts/download-assets.mjs && npm run test:run -- tests/source-assets.test.ts`; verify success.
- [ ] Commit with `git commit -m "feat: capture source-faithful Bebur assets"`.

### Task 2: Replace the visual system with source-faithful templates

**Files:**
- Modify: `app/globals.css`, `components/header.tsx`, `components/footer.tsx`, `app/page.tsx`, `app/products/page.tsx`, `app/products/[category]/[slug]/page.tsx`, `app/applications/[slug]/page.tsx`, `app/insights/[slug]/page.tsx`, `app/about/[slug]/page.tsx`, `app/contact/page.tsx`
- Create: `components/source-faithful/source-shell.tsx`, `components/source-faithful/source-hero.tsx`, `components/source-faithful/source-card-grid.tsx`
- Modify: `tests/components.test.ts`, `tests/product-ui.test.tsx`

**Interfaces:** `SourceShell({ children })`, `SourceHero({ image, eyebrow, title, summary })`, and `SourceCardGrid({ cards, variant })`. All asset props must be `/source-media/` or `/media/` paths.

- [ ] Write failing component tests requiring `data-testid="source-hero"`, source card landmarks, Japanese headings, and `mailto:info@newtree-i.com`.
- [ ] Run `npm run test:run -- tests/components.test.ts tests/product-ui.test.tsx`; verify the tests fail because those source-faithful landmarks are absent.
- [ ] Implement the components by mapping captured source structure, spacing, responsive grids, hero treatment, breadcrumbs, CTA positions, and footer/header order onto the existing Japanese route data.
- [ ] Run `npm run test:run -- tests/components.test.ts tests/product-ui.test.tsx tests/contact.test.ts && npm run build`; verify success.
- [ ] Commit with `git commit -m "feat: mirror Bebur source page families"`.

### Task 3: Add the Chinese Sanity Studio

**Files:**
- Create: `sanity/package.json`, `sanity/sanity.config.ts`, `sanity/structure.ts`, `sanity/schemaTypes/{index,product,news,siteSettings}.ts`, `lib/sanity/{client,queries}.ts`, `tests/sanity-schema.test.ts`
- Modify: `.gitignore`, root `package.json`, root lockfile

**Interfaces:** `getProducts()`, `getProductBySlug(category, slug)`, `getNews()`, `getNewsBySlug(slug)`, `getSiteSettings()`; public environment keys `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`.

- [ ] Write a failing test importing `product` and asserting Chinese title `产品` plus fields `title`, `slug`, `coverImage`, and `specifications`.
- [ ] Run `npm run test:run -- tests/sanity-schema.test.ts`; verify module-not-found failure.
- [ ] Add Studio dependencies and schemas: product, news, shared site settings; label all authoring UI in Chinese and validate Japanese public title/slug/image/SEO fields.
- [ ] Configure desk navigation labels `产品管理`, `新闻管理`, `网站设置`; do not put write tokens, webhook URLs, user emails, or project IDs in Git.
- [ ] Run `npm --prefix sanity run typecheck && npm run test:run -- tests/sanity-schema.test.ts`; verify success and commit `feat: add Chinese Sanity content studio`.

### Task 4: Make static builds read Sanity and audit output

**Files:**
- Modify: `lib/content.ts`, `lib/routes.ts`, `app/products/[category]/[slug]/page.tsx`, `app/insights/[slug]/page.tsx`, `scripts/audit-content.mjs`, `package.json`, `tests/content-pages.test.tsx`
- Create: `scripts/audit-static-assets.mjs`, `tests/static-output.test.ts`

**Interfaces:** `getContentSource()` returns `"sanity"` with available configured content, otherwise `"local"`; `npm run audit:static` returns nonzero for missing local `img`, `source`, stylesheet, or script output files.

- [ ] Write failing tests for local fallback without a Sanity project ID and for `runStaticAudit("out/index.html")` returning no unresolved references.
- [ ] Run `npm run test:run -- tests/static-output.test.ts tests/content-pages.test.tsx`; verify missing-function failure.
- [ ] Implement build-time GROQ reads normalized to existing types, local JSON fallback, and a static output auditor that resolves every local reference relative to `out/`.
- [ ] Run `npm run test:run && npm run audit:content && npm run build && npm run audit:static`; require every command to exit 0.
- [ ] Commit with `git commit -m "feat: build Bebur pages from Sanity content"`.

### Task 5: Import localized data and validate route/contact constraints

**Files:**
- Create: `scripts/export-sanity-import.mjs`, `sanity/import/initial.ndjson`
- Modify: `content/ja/{products,insights,pages}.json`, `tests/routes.test.ts`, `tests/contact.test.ts`

**Interfaces:** The export script emits stable Sanity product/news/site settings documents; `sanity/import/initial.ndjson` can be imported with `sanity dataset import` after the user creates the Bebur-owned project.

- [ ] Write failing tests requiring 110 canonical routes, 112 rendered pages, no obsolete contact values, and the approved inquiry email.
- [ ] Run `npm run test:run -- tests/routes.test.ts tests/contact.test.ts`; verify the test detects incomplete migration before data normalization.
- [ ] Build stable product/news/settings documents and import with `npx --prefix sanity sanity dataset import sanity/import/initial.ndjson production --replace` only after action-time user confirmation.
- [ ] Invite only user-supplied email addresses through Sanity as Administrators.
- [ ] Run `npm run test:run -- tests/routes.test.ts tests/contact.test.ts && npm run audit:content`; verify success and commit `feat: import Bebur Japan CMS content`.

### Task 6: Automate GitHub to Cloudflare deployment and verify production

**Files:**
- Create: `.github/workflows/verify.yml`, `.env.example`, `docs/operations/sanity-cloudflare-publishing.md`
- Modify: `wrangler.jsonc`, `tests/deployment-config.test.ts`

**Interfaces:** user-owned repository `bebur-japan-site`; Cloudflare build command `npm ci && npm run build && npm run audit:static`; output `out`; Sanity webhook points to a Cloudflare Pages deploy hook.

- [ ] Write a failing test requiring `.env.example` public Sanity keys and `wrangler.jsonc` Pages output `./out`.
- [ ] Run `npm run test:run -- tests/deployment-config.test.ts`; verify it fails for the absent environment template.
- [ ] Add CI for `npm ci`, tests, content audit, build, and static audit. Document exact repository connection, environment setup, deploy hook, Sanity webhook, operator invitation, rollback, and manual fallback.
- [ ] At user-confirmed action time create the Bebur-owned GitHub repo, push the branch, connect the existing Bebur Cloudflare account, configure build variables, create the deploy hook, and set the Sanity webhook.
- [ ] Publish one test document, verify a Pages build starts, then request root, source image, `_next` bundle, product detail, application detail, insight, about, contact, and `https://www.bebur-jp.com/`; every expected endpoint must return HTTP 200.
- [ ] Commit with `git commit -m "ci: automate Sanity to Cloudflare publishing"`.

## Plan self-review

- All required outcomes are covered: visual fidelity, local assets, Chinese content management, build-time content, data import, safe contact data, repository automation, Cloudflare release, and external verification.
- Every production behavior begins with a specific failing test, and all credentials/external-account actions remain action-time user approvals.
