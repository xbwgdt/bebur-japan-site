# Bebur Japan Source-Faithful Migration Design

## Goal

Rebuild the Japanese Bebur site as a source-faithful, static mirror of `https://www.bebur.net/`: retain the original information architecture, layout hierarchy, imagery, visual rhythm, and 112 real content-page routes, while replacing user-facing copy and contact endpoints with approved Japanese-market content for 新樹産業株式会社.

## Approved content constraints

- Site identity: `Bebur 日本総代理店｜新樹産業株式会社`.
- Contact block: 新樹産業株式会社, 〒340-0043 埼玉県草加市草加2－13－21－7, 080-5189-8663, info@newtree-i.com.
- Online inquiry link: `mailto:info@newtree-i.com`.
- Production domain: `www.bebur-jp.com`.
- No language-switch link.
- Preserve 112 real source-content pages (110 canonical routes already represented by the route model).

## Approach selection

### Selected: source-structure and source-asset migration

Use the original site as the visual reference for every page family. Recreate its semantic DOM and CSS relationships in the existing static Next.js export; download and serve referenced source assets locally, so the deployed site never relies on cross-origin assets. Map the existing Japanese content model into those source-faithful page templates.

This is selected because it preserves the original brand appearance while keeping the current static, SEO-ready route model and the approved Japanese/local contact content.

### Rejected alternatives

1. Repair only the missing asset upload. This would restore images but retain the unrelated replacement design.
2. Embed or proxy the original site. This would not safely support Japanese content, approved contacts, SEO ownership, or long-term asset control.

## Architecture

1. **Source audit layer**: capture source HTML, CSS references, image references, routes, and page-family markers into reproducible local manifests.
2. **Asset layer**: copy source images, fonts, and decorative assets into `public/source-media/` with paths normalized for static export; report every missing or external reference.
3. **Template layer**: replace the current generic homepage, listing, detail, corporate, application, insight, and contact layouts with source-faithful page-family templates.
4. **Japanese content layer**: preserve the existing route/content data model, translate visible labels and metadata, replace global contact data, and use Japanese-ready typography without altering source visual hierarchy.
5. **Deployment layer**: publish the `out/` directory as a directory upload, then verify root, representative image, JavaScript bundle, five route families, and the custom-domain HTTPS endpoint all return HTTP 200.

## Content management

### Platform and access

- Use Sanity's Free plan for the Japanese site content dataset and hosted Studio.
- Studio is localized for Chinese-speaking operators; field labels, validation messages, desk navigation labels, and authoring help text are Chinese.
- Invite each operator through Sanity's account-invitation flow. Each approved operator receives the Sanity Administrator role and can create, edit, upload media, and publish immediately.
- The Free plan supports up to 20 included seats. This is intentionally an all-publish model: it has no separate restricted editor role. Access must be granted only to trusted people.

### Content models

**Product**: category, Japanese title, model number, short summary, body, technical-specification rows, application references, gallery images, cover image, SEO title, SEO description, slug, and publish state.

**News**: Japanese title, publication date, short summary, Portable Text body, cover image, gallery images, SEO title, SEO description, slug, and publish state.

**Shared site settings**: Japanese navigation labels, primary contacts, Japanese distributor identity, inquiry email, footer content, and SEO defaults. The approved contact details remain validation-protected values, not ad-hoc per-page copy.

### Publish flow

1. Operator signs into the Chinese-language Sanity Studio with an invited account.
2. Operator creates or edits a product/news document and uploads media to Sanity.
3. Operator selects Publish; the document immediately becomes available through the public Sanity API.
4. A Sanity webhook triggers a Cloudflare Pages deployment hook.
5. Cloudflare rebuilds the static Next.js site from its connected source repository and publishes the changed content to `www.bebur-jp.com`.

This automatic flow requires converting the current direct-upload Pages project into a Git-connected Pages project, hosted in a new user-owned repository. Direct-upload Pages has no build environment and cannot regenerate `out/` when Sanity data changes. If repository connection is not authorized, the fallback is manual `next build` plus directory deployment after each Sanity publish.

This keeps the public site static and cached while giving operators a familiar content-admin experience. New content is not visible until the Pages deployment completes; the Studio will display the deployment status link supplied by the webhook response where available.

## Data flow

`bebur.net source page/assets` → local source manifest and local assets → page-family components plus Japanese content data → `next build` static `out/` → Cloudflare Pages directory deployment → `www.bebur-jp.com` verification checks.

## Page families

- Homepage
- Product index and category list
- Product detail
- Applications index, application detail, and cases
- Insights index and article detail
- About/corporate pages
- Contact page
- 404 and metadata routes

Each family must use source-equivalent hero treatment, grid density, cards, breadcrumbs, calls to action, and footer/header placement. Japanese wording may reflow but must not introduce a new visual system.

## Error handling and guardrails

- Do not permit source image URLs to remain remote in rendered production HTML.
- Audit every rendered `img`, `source`, stylesheet, and script path against files in `out/`.
- Block a release if an expected first-party visual asset returns a non-200 response from the deployment.
- Keep all user-approved contacts centralized in one content module, with tests guarding against obsolete details.

## Test strategy

- Add test-first route/content assertions for source-faithful shared chrome, localized contacts, no language switch, and local image URL policy.
- Add a build-output audit that verifies every static image reference in representative pages exists in `out/`.
- Run the full Vitest suite, content audit, and production build.
- After deployment, verify `https://www.bebur-jp.com/`, representative route pages, and representative media/bundle URLs with HTTP requests.

## Scope boundaries

- This work replicates layout and assets needed to faithfully represent Bebur Japan. It does not copy source-site tracking IDs, user accounts, private APIs, forms that submit to third parties, or any non-public content.
- The site remains a static Cloudflare Pages deployment; online inquiries use the approved email link rather than a backend form.
