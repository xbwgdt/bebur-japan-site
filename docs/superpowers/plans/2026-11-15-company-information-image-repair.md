# Company information image repair implementation plan

> Execute inline with executing-plans; independent read-only review before publication.

**Goal:** Correct the culture/history image mismatch, audit all six about routes, preserve live Sanity editing and Japanese contacts.

**Approved design:** Culture displays three existing, verified mission/vision/philosophy photographs and copy. History displays the approved five-year timeline without certificate imagery. Reuse the already verified overview block renderer and palette/font controls; do not redesign unrelated pages. Remove expired AS-525 certificate references from the certificate page, consistent with the user's earlier hide-expired decision.

**Architecture:** Add `lib/company-information.ts` to derive two focused fallback documents from the approved overview. Parameterize the existing page normalization fallback without altering overview behavior. Enable build-safe reads and theme controls only for overview/culture/history. Fix legacy about image associations too. No new images, dependencies, permissions or contact changes.

## Tasks
- [ ] Add `tests/company-information.test.tsx`: three culture photographs/no certificates; five history milestones/no certificate; actual published CMS overrides on both; hero-only fallback; six-route image classification; Japanese contacts. Observe RED.
- [ ] Implement focused fallback documents and `getCompanyPage(slug, fallback)`; select the new renderer/metadata only for culture/history. Extend static-read and schema tests to the two slugs; preserve company-profile and all other normal routes.
- [ ] Correct `content/ja/about.json` images and expired certificate prose. Keep source URLs and route counts unchanged.
- [ ] Run targeted tests, Studio typecheck/build, real Sanity-configured Next export and audits. Review independent diff.
- [ ] Back up raw `page--culture`/`page--history` plus drafts; abort divergent drafts. Reuse uploaded overview image refs, add `_type:card`, preserve slug/identity and unrelated documents, revision-guard the scoped patch and read back exact fields. For `page--certifications`, change only verified expired-reference text and retain all unrelated values.
- [ ] Deploy same existing Studio, push feature branch, wait full CI/preview success. Browser QA desktop/390px/320px: both pages, all six about image assignments, navigation/contact actions, Chinese editor fields, actual Sanity image URLs.
- [ ] Promote to main only after QA, wait successful production deployment, read back custom domain and save final screenshots. Verify overview, homepage animation and other key routes remain unchanged.

## Verification
`node node_modules/vitest/vitest.mjs run tests/company-information.test.tsx tests/company-overview.test.tsx tests/company-overview-static-read.test.ts tests/cms-normal-routes.test.tsx tests/routes.test.ts --pool threads --maxWorkers 2`

`node node_modules/typescript/bin/tsc --noEmit -p sanity/tsconfig.json`

`node node_modules/next/dist/bin/next build` with the existing public Sanity configuration; exported culture must contain three Sanity culture photos and history no certificates.

## Image audit inventory
- Overview: 18 correctly classified images, including six current/no-expiry documents.
- Company profile: correct building photograph.
- Certifications: correct AS-300 document; remove stale references to expired AS-525 documents.
- Culture: incorrect AS-525 document; replace with three approved culture photographs.
- History: incorrect ISO document; remove and use the timeline.
- Exhibitions: correct Sichuan exhibition photograph.
