# Contact Page Sanity Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the contact-page contrast and duplicated mail action, then expose the contact panels' copy, approved color presets, size presets, and font presets in Sanity.

**Architecture:** Add a dedicated `contactPage` object to the existing `siteSettings` singleton, resolve it through the same safe public-settings boundary used by the home hero, and render both contact-page paths through one focused component. Styling is selected only through class-name presets; protected company contact destinations remain sourced from the approved contact constants.

**Tech Stack:** Next.js 15, React 19, TypeScript, Sanity Studio 3, GROQ, CSS, Vitest, Testing Library.

## Global Constraints

- `電話で相談` must link to `tel:080-5189-8663`.
- `メールでお問い合わせ` must continue to open email addressed to `info@newtree-i.com`.
- The default font is standard sans-serif.
- Approved company name, postal code, address, phone, and email remain protected and cannot be redirected through ordinary CMS content.
- Editors may select only validated color, font-size, and font-family presets; raw CSS, JavaScript, arbitrary colors, and arbitrary font names are forbidden.
- The deep-blue guide card must render white body text and cyan accents with clear focus and hover states.
- Desktop remains two-column, narrow screens remain one-column, and neither layout may overflow.
- Preserve unrelated dirty working-tree files.

---

## File Structure

- `sanity/schemaTypes/siteSettings.ts`: owns the Chinese-labelled Sanity controls and their fixed option lists.
- `lib/sanity/queries.ts`: defines the Sanity wire type and GROQ projection for `contactPage`.
- `lib/site-settings.ts`: owns public contact-page types, local fallbacks, whitelist validation, and CSS-class resolution.
- `components/contact-page-panels.tsx`: renders the single reusable pair of contact panels with protected destinations.
- `app/contact/page.tsx`: composes the hero/CMS page blocks with the shared contact panels.
- `app/globals.css`: owns the contact-panel preset classes and accessible foreground/background combinations.
- `scripts/export-sanity-import.mjs`: includes the default `contactPage` object in deterministic Sanity exports.
- `tests/site-settings.test.tsx`: covers whitelist parsing and fallback behavior.
- `tests/sanity-schema.test.ts`: covers schema fields, fixed lists, and GROQ projection.
- `tests/contact.test.ts`: covers labels, destinations, shared rendering, and default presentation classes.
- `tests/cms-normal-routes.test.tsx`: proves the CMS and non-CMS paths retain the same contact actions.
- `tests/routes.test.ts`: proves deterministic exports include the new settings.

---

### Task 1: Define and safely resolve contact-page settings

**Files:**
- Modify: `tests/site-settings.test.tsx`
- Modify: `lib/sanity/queries.ts`
- Modify: `lib/site-settings.ts`

**Interfaces:**
- Produces: `PublicContactPageSettings`, `ContactPanelStyle`, `resolveContactPanelStyle(style): string`, and `PublicSiteSettings.contactPage`.
- Consumes later: `ContactPagePanels` reads `publicSiteSettings.contactPage` and applies `resolveContactPanelStyle`.

- [ ] **Step 1: Write failing resolver tests**

Add tests that pass valid CMS values and assert that labels, guide steps, and presets survive resolution. Add a second case with invalid presets and malformed/empty steps and assert fallback to `localPublicSiteSettings.contactPage`.

```ts
const settings = resolvePublicSiteSettings({
  contactPage: {
    panel: {
      label: "Bebur 日本総代理店",
      description: "日本国内の製品選定とお見積もりをご案内します。",
      phoneActionLabel: "電話で相談",
      emailActionLabel: "メールでお問い合わせ",
      style: { color: "light", fontSize: "md", fontFamily: "sans" },
    },
    guide: {
      eyebrow: "INQUIRY GUIDE",
      title: "お問い合わせの流れ",
      steps: ["製品・用途を確認", "電話またはメールで相談", "仕様・見積もりをご案内"],
      linkLabel: "メールで問い合わせ",
      style: { color: "deepBlue", fontSize: "md", fontFamily: "sans" },
    },
  },
});

expect(settings.contactPage.guide.style).toEqual({
  color: "deepBlue",
  fontSize: "md",
  fontFamily: "sans",
});
expect(resolveContactPanelStyle(settings.contactPage.guide.style)).toContain(
  "contact-card--color-deep-blue",
);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/site-settings.test.tsx --run`

Expected: FAIL because `contactPage` and `resolveContactPanelStyle` do not exist.

- [ ] **Step 3: Add query types, defaults, and whitelist parsing**

Add wire types under `SanitySiteSettings.contactPage`, project `contactPage { panel { ..., style }, guide { ..., steps, style } }`, and define these public types:

```ts
export type ContactPanelStyle = {
  color: "light" | "deepBlue" | "paleBlue";
  fontSize: "sm" | "md" | "lg" | "xl";
  fontFamily: "sans" | "serif" | "mono";
};

export type PublicContactPageSettings = {
  panel: {
    label: string;
    description: string;
    phoneActionLabel: string;
    emailActionLabel: string;
    style: ContactPanelStyle;
  };
  guide: {
    eyebrow: string;
    title: string;
    steps: string[];
    linkLabel: string;
    style: ContactPanelStyle;
  };
};
```

Use `safeText` for copy, accept only 1–6 non-empty safe guide steps, and use `safePreset` with exact lists. Set defaults to `light/md/sans` for the left panel and `deepBlue/md/sans` for the guide.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `npm test -- tests/site-settings.test.tsx --run`

Expected: PASS.

- [ ] **Step 5: Commit the settings boundary**

```powershell
git add -- tests/site-settings.test.tsx lib/sanity/queries.ts lib/site-settings.ts
git commit -m "feat: resolve contact page CMS settings"
```

---

### Task 2: Add Chinese Sanity controls with fixed presentation presets

**Files:**
- Modify: `tests/sanity-schema.test.ts`
- Modify: `sanity/schemaTypes/siteSettings.ts`

**Interfaces:**
- Consumes: field names and preset values defined by Task 1.
- Produces: the editor-facing `contactPage.panel` and `contactPage.guide` fields.

- [ ] **Step 1: Write failing schema tests**

Find `contactPage`, then assert that it contains `panel` and `guide`; assert the guide contains an array `steps`; assert both style objects expose fixed `color`, `fontSize`, and `fontFamily` lists with no free-form fields.

```ts
expect(optionValues(panelStyle, "color")).toEqual(["light", "deepBlue", "paleBlue"]);
expect(optionValues(panelStyle, "fontFamily")).toEqual(["sans", "serif", "mono"]);
expect(optionValues(guideStyle, "fontSize")).toEqual(["sm", "md", "lg", "xl"]);
expect(siteSettingsQuery).toContain("contactPage");
```

- [ ] **Step 2: Run schema tests and verify failure**

Run: `npm test -- tests/sanity-schema.test.ts --run`

Expected: FAIL because the contact-page controls are absent.

- [ ] **Step 3: Add the schema fields**

Add a `contactPage` object to the existing contact group. Use Chinese titles such as `联系页内容与样式`, `左侧联系卡片`, `右侧咨询流程`, `配色`, `字号`, and `字体`. Use Japanese text validation for visible Japanese copy, required array members for steps, and radio/dropdown lists for all style values. Describe that telephone/email destinations are protected and derived from the approved contact fields.

- [ ] **Step 4: Run schema and Studio checks**

Run:

```powershell
npm test -- tests/sanity-schema.test.ts --run
npm run sanity:typecheck
npm run sanity:build
```

Expected: all commands exit 0 and the Studio production build completes.

- [ ] **Step 5: Commit the schema**

```powershell
git add -- tests/sanity-schema.test.ts sanity/schemaTypes/siteSettings.ts
git commit -m "feat: add contact page controls to Sanity"
```

---

### Task 3: Render one shared contact-panels component

**Files:**
- Create: `components/contact-page-panels.tsx`
- Modify: `tests/contact.test.ts`
- Modify: `tests/cms-normal-routes.test.tsx`
- Modify: `app/contact/page.tsx`

**Interfaces:**
- Consumes: `publicSiteSettings.contactPage`, `resolveContactPanelStyle`, approved phone/email values, and `buildMailto`.
- Produces: `ContactPagePanels(): React.ReactElement`, used in both the CMS and fallback contact routes.

- [ ] **Step 1: Replace obsolete behavior assertions with failing required behavior**

Assert exactly one phone CTA named `電話で相談` links to `tel:080-5189-8663`; assert the mail CTA and guide mail link start with `mailto:info@newtree-i.com`; assert the old text `オンライン相談（メール）` is absent. In the CMS-path test, assert the same destinations and labels remain present.

```ts
expect(screen.getByRole("link", { name: "電話で相談" }).getAttribute("href"))
  .toBe("tel:080-5189-8663");
expect(screen.queryByText("オンライン相談（メール）")).toBeNull();
```

- [ ] **Step 2: Run contact tests and verify failure**

Run: `npm test -- tests/contact.test.ts tests/cms-normal-routes.test.tsx --run`

Expected: FAIL because the primary button is still a mail action and two implementations are hardcoded.

- [ ] **Step 3: Create the shared component and simplify the page**

Move the company card and guide markup into `ContactPagePanels`. Generate `tel:${publicSiteSettings.phone}` internally and generate the mail URL from `buildMailto("Bebur 製品", publicSiteSettings.inquiryEmail)`. Read all editable labels, descriptions, steps, and style classes from `publicSiteSettings.contactPage`. Replace both the old `ContactInteractivity` branch and fallback inline markup with this component.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `npm test -- tests/contact.test.ts tests/cms-normal-routes.test.tsx --run`

Expected: PASS with no duplicate online-mail CTA.

- [ ] **Step 5: Commit the shared rendering**

```powershell
git add -- components/contact-page-panels.tsx app/contact/page.tsx tests/contact.test.ts tests/cms-normal-routes.test.tsx
git commit -m "fix: separate contact phone and email actions"
```

---

### Task 4: Implement accessible color, size, and font preset classes

**Files:**
- Modify: `tests/contact.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: class strings produced by `resolveContactPanelStyle`.
- Produces: visible `contact-card--color-*`, `contact-card--font-*`, and `contact-card--size-*` behavior.

- [ ] **Step 1: Add failing presentation-class assertions**

Assert that the default guide has `contact-card--color-deep-blue`, `contact-card--font-sans`, and `contact-card--size-md`, while the left panel uses the light preset.

- [ ] **Step 2: Run the contact test and verify failure**

Run: `npm test -- tests/contact.test.ts --run`

Expected: FAIL until the classes and component wiring exist.

- [ ] **Step 3: Add complete preset styles**

Define variables per card preset so every descendant inherits a coherent foreground color. The deep-blue preset must set the card background to the existing source blue, normal text and headings to white, eyebrow/accent/link to cyan or a verified light cyan, and step-number circles to navy with white text. Add visible `:focus-visible` outlines and underlined hover states. Map `sans` to `var(--font-sans)`, `serif` to a Japanese serif stack, and `mono` to `var(--font-mono)`; map size presets through card-level custom properties rather than arbitrary inline styles.

- [ ] **Step 4: Run the focused test and production build**

Run:

```powershell
npm test -- tests/contact.test.ts --run
npm run build
```

Expected: tests pass and Next.js production build exits 0.

- [ ] **Step 5: Commit the visual fix**

```powershell
git add -- tests/contact.test.ts app/globals.css
git commit -m "fix: improve contact guide contrast"
```

---

### Task 5: Seed deterministic defaults and verify the full repository

**Files:**
- Modify: `tests/routes.test.ts`
- Modify: `scripts/export-sanity-import.mjs`

**Interfaces:**
- Consumes: `contactPage` field names and default content from Tasks 1–2.
- Produces: deterministic exported Sanity settings with the same safe defaults as the live site.

- [ ] **Step 1: Add a failing export assertion**

Extend the `siteSettings` expectation to include `contactPage.panel.phoneActionLabel === "電話で相談"`, `contactPage.panel.style.fontFamily === "sans"`, and `contactPage.guide.style.color === "deepBlue"`.

- [ ] **Step 2: Run the export test and verify failure**

Run: `npm test -- tests/routes.test.ts --run`

Expected: FAIL because the exporter does not yet emit `contactPage`.

- [ ] **Step 3: Add the deterministic export object**

Add the exact confirmed defaults to `siteSettingsDocument`, matching `localPublicSiteSettings.contactPage` and the schema field names. Do not duplicate or alter the protected contact destinations.

- [ ] **Step 4: Run all non-live verification**

Run:

```powershell
npm test -- --run
npm run sanity:typecheck
npm run sanity:build
npm run build
```

Expected: all tests pass; both builds exit 0.

- [ ] **Step 5: Commit deterministic defaults**

```powershell
git add -- tests/routes.test.ts scripts/export-sanity-import.mjs
git commit -m "chore: seed contact page CMS defaults"
```

---

### Task 6: Publish and verify Sanity plus production

**Files:**
- No source files unless live verification reveals a defect.

**Interfaces:**
- Consumes: all completed commits.
- Produces: deployed Studio schema, deployed website, and evidence from the live contact page.

- [ ] **Step 1: Update the live Sanity singleton**

Patch document ID `siteSettings` in dataset `production` with the confirmed `contactPage` default object. Do not replace the whole singleton and do not modify protected contact fields.

- [ ] **Step 2: Deploy the Sanity Studio schema**

Run from `sanity` with the authenticated Bebur profile:

```powershell
npx sanity deploy
```

Expected: Studio `bebur-japan` deploy succeeds and the new contact-page fields appear under the contact settings group.

- [ ] **Step 3: Push the implementation branch to the connected production branch**

Push the reviewed commits to the repository path used by Cloudflare Pages. Confirm the newest Cloudflare deployment is green before live inspection.

- [ ] **Step 4: Verify the live contact page**

Open `https://www.bebur-jp.com/contact` and confirm:

- `電話で相談` points to `tel:080-5189-8663`.
- `メールでお問い合わせ` points to `info@newtree-i.com`.
- `オンライン相談（メール）` is absent.
- The guide heading, steps, and link are clearly readable against the deep-blue background.
- Desktop and mobile layouts have no overlap or overflow.

- [ ] **Step 5: Verify editing and webhook deployment**

In Sanity, make one harmless contact-page text or preset change, publish it, confirm the Cloudflare deploy hook runs, verify the production change, then restore and publish the approved default. Confirm the restored production page matches the design.

- [ ] **Step 6: Final status check**

Run `git status --short`, confirm only the user's pre-existing unrelated dirty files remain, and report exact commits plus live verification results.
