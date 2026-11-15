# Dependency Security Remediation Implementation Plan

> Execute sequentially with checkpoints; keep the currently deployed site and Studio available until all release gates pass.

**Goal:** Remove the reproduced dependency vulnerabilities without changing customer content, CMS schemas, Japanese contacts, or account permissions.

**Architecture:** Upgrade direct owners of vulnerable dependency chains before considering narrowly scoped, same-major overrides. Use npm and the committed package-lock as the production source of truth. Preserve the unrelated dirty pnpm/import/report files. Website remains a Next static export on Cloudflare; Studio remains Sanity-hosted with Chinese UI.

**Tech Stack:** Node 22.12+, Next 16, React 19, Sanity 6, Vitest 5, npm workspaces.

## Constraints and rollback
- Baseline release: 4f61beeab68b38d455e92e2c302d4fdd33503008.
- Dependency input backup: .codex-tmp/backups/security-20261115/.
- No content migration, permission change, public development server, or blanket audit-fix-force.
- Credentials stay in existing authenticated stores and are never logged.
- Preserve the previous hosted Studio build and Cloudflare deployment for rollback.

## Task 1: Baseline and reproducible security gate
- [x] Run the existing complete test suite before upgrades: 268/268 passed.
- [x] Add lockfile security regression tests; demonstrated 7 failures against the old lock and the missing CI gate separately.
- [x] Preserve the original audit JSON, dependency inputs, previous Studio output and 195 Sanity documents.

## Task 2: Website-compatible upgrades
Files: package.json, package-lock.json, tests/dependency-security.test.ts.
- [x] Raise Next to 16.4.6 and image-size to 2.1.0 with npm-generated lockfile.
- [x] Run 69 targeted tests, production typecheck and 120-page static export successfully.
- [x] Re-audit: 39→35 affected package findings, critical 5→4; report saved in .codex-tmp/security-audit-stage1.json.

## Task 3: Studio and test-tool upgrade
Files: sanity/package.json, package.json, package-lock.json; rename the test configuration to vitest.config.mts and update its two script consumers for Vite 8 native-ESM compatibility.
- [x] Review official Studio 3→4→5→6 and Vitest 3→4→5 migration requirements.
- [x] Upgrade Sanity/Vision 6.23.0, locale 2.1.40, Vitest 5.1.0, Vite 8.3.8; Node >=22.12 <23. Exact React/React DOM 19.3.1 prevents peer-resolution mismatch reproduced by Studio build and a failing regression test.
- [x] Install without force/legacy-peer-deps. Clean npm ci succeeded with official checksum-verified Node 22.23.5 and npm 10.9.9.
- [x] Final 280/280 tests passed; Studio typecheck/build passed; local authenticated Chinese editor loads. Website builds 120 generated routes; all 117 HTML page content/title/canonical/contact hashes match the first-stage baseline, static audit has zero missing resources.
- [x] Full npm audit: zero findings at every severity. Narrow overrides: Vercel framework YAML3.15.2 and TOML1.9.1 (same-major); oclif4 minimatch11.0.8 (no patched10 release, named CommonJS API compatibility tested). Original deprecated decompress and tinypool chains removed by upstream upgrades.

## Task 4: Release gates and deployment
Files: .github/workflows/verify.yml; record validation outcomes in this implementation log and ignored JSON evidence.
- [x] Add CI audit and Studio validation; run codex branches before production main.
- [x] Verify a clean npm-ci install under production Node 22.
- [ ] Verify desktop/mobile website, main routes, images, contact tel/mail, analytics beacon, sitemap and CMS reading.
- [ ] Deploy updated Studio only after build/UI/schema checks. Check Chinese editor and a reversible isolated test record/image; do not alter existing published content.
- [ ] Push only allowlisted dependency/config/test/report files; wait for GitHub and Cloudflare success, then verify live site and Studio versions.
- [ ] Confirm CMS publish webhook delivery/build workflow using an isolated test that does not create a customer-facing page. Remove test-only data through recoverable mechanisms where available.
- [ ] Record audit before/after counts, verified checks, remaining limits, and rollback pointers. Do not claim untested behavior.
