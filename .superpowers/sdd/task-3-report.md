# Task 3: Japanese Content Model and Complete Source Mapping — Completion Report

## Scope and record totals

- Japanese catalog records: 110
  - Products: 45 — cleanliness 3, dosing 7, water-quality 18, gas-detection 14, flow-level 3
  - Applications: 31
  - Articles: 17
  - About pages: 6
  - Static pages: 11
- Approved source records: 112
- Represented source URLs: 112, each represented exactly once
- Canonical routes: 110, all unique
- Consolidated aliases: 2 (`/en/list_37_2` → product index and `/en/list_39_2` → insight index)

## Gas-detection and flow/level completion

The prior review identified 17 corrected gas-detection and flow/level product records. I matched every correction by both `sourceUrl` and `slug`, verified model/category equality, and merged the reviewed source-derived specifications into `content/ja/products.json`.

All non-anomalous English prose in those records is now Japanese, including gas names, calibration intervals, reference-pressure wording, wiring/output wording, ranges, dimensions, and flow-meter connection/application wording. Values, model identifiers, formulas, standards, and numeric ranges remain intact. I also localized residual public English phrases in the rest of the product catalog and untranslated certificate labels in `about.json`.

Independent review found that the AS-300 first technical-parameter table had been underrepresented. I restored the source pressure, standard configuration, and accessory facts for all five AS-300 variants (infrared, multi-gas, VOC, combustible, and toxic), including detector host, audible-visual warning light, remote control, instructions, mounting bracket, and rain cover. The new regression reads the first manifest table and guards those public Japanese facts. The review also found public editor notes in SCM520 and UVSense; I removed the note from the retained SCM520 source value and omitted the unresolvable UVSense model-by-model table instead of publishing a guessed mapping.

The following source OCR/text anomalies remain intentionally verbatim and explicitly marked `原文表記・要確認`, as required: `HCI`, `C2H3CI`, `Soil 0.3%FS`, `<5w<>`, and `feric chloide`. They were not silently corrected or inferred.

## AS-300 regression evidence

### RED (captured before the merge)

Focused command:

```powershell
& $node .\node_modules\vitest\vitest.mjs run tests/content.test.ts tests/routes.test.ts
```

Result: 27/29 tests passed; 2 failed.

- `publishes every source gas range as actual product data` failed for `as-300-toxic`: source value `SO2` was absent because the catalog had a placeholder summary rather than the source rows.
- `does not expose raw English prose in localized product fields` failed on `standard atmospheric pressure`.

### GREEN (after merge, localization, and review fixes)

The same focused command passed: 30/30 tests, including the AS-300/AS-525/AT-2000 gas-range regression, the new AS-300 first-table regression, and raw-English check. The regressions deliberately exclude the traceability-only `sourceUrl` from public-prose assertions; they still check every required source table fact against the public product record.

## Five-file Japanese content inspection

Files checked: `products.json`, `applications.json`, `about.json`, `insights.json`, and `pages.json`.

- Forbidden-contact/platform scan: zero matches for the required banned strings.
- Public-prose scan: zero matches for the established raw-English phrase set.
- Exact UTF-8 contact strings confirmed in the `/contact` record:
  - `Bebur 日本総代理店｜新樹産業株式会社`
  - `〒340-0043 埼玉県草加市草加2－13－21－7`
  - `080-5189-8663`
  - `info@newtree-i.com`
- Mapping gaps, duplicate mappings/routes, unresolved product relations, missing images, missing localized metadata, and invalid dates: zero (audit results below).

## Verification

The environment provides the bundled `node.exe` but not an `npm` executable on `PATH`; the following are the direct equivalents of the requested package scripts.

```powershell
# audit:content
& $node scripts/audit-content.mjs
# result: exit 0; 112 source records, 112 represented, 110 unique routes,
# 0 unmapped, 0 multiply mapped, 0 missing images, 0 forbidden contacts,
# 0 invalid dates, 0 unresolved references, 0 duplicate routes

# focused tests
& $node .\node_modules\vitest\vitest.mjs run tests/content.test.ts tests/routes.test.ts
# result: exit 0; 2 files, 30 tests passed

# full tests
& $node .\node_modules\vitest\vitest.mjs run
# result: exit 0; 3 files, 32 tests passed

# production build
& $node .\node_modules\next\dist\bin\next build
# result: exit 0; compiled, TypeScript completed, static page generated
```

## Files changed

- `lib/types.ts`
- `lib/content.ts`
- `lib/routes.ts`
- `content/ja/products.json`
- `content/ja/applications.json`
- `content/ja/about.json`
- `content/ja/insights.json`
- `content/ja/pages.json`
- `scripts/audit-content.mjs`
- `tests/content.test.ts`
- `tests/routes.test.ts`

## Self-review against the Task 3 brief

- Content types, immutable lookup API, category route helpers, and canonical origin are present.
- Product and page classification/counts match the approved source inventory; Exhibition Site remains outside products.
- All sources are traceable, with only documented index aliases consolidated.
- Japanese titles/descriptions, local images with Japanese alt text, publication-date format, relations, contact restrictions, AS-300 first-table facts, and omission of internal source-review notes are covered by tests and audit.
- The audit script performs the required structural, contact, asset, mapping, relation, metadata, and route checks without importing TypeScript.
- The required focused tests, full suite, and Next production build were rerun after the final content changes.

## Review-fix reconciliation addendum (2026-07-29)

### Scope

Completed a source-to-catalog reconciliation for all 45 structured product records. The pass included a source-model/numeric-token comparison and direct review of the named records. Source-specific facts were either restored to the matching model or removed when they belonged to a different model or variant.

- BT8500: restored the 60/120 ml/min range association and installation accessories.
- SCM520: removed controller/other-model values; retained its source-specific 220VAC/50HZ and 310mm(W) x 388mm(H) x 165mm(D) data.
- BT6308-DO / BT6308-SS: restored customizable membrane temperature sensor and FC-B210; BT6308-SS applications are exactly sewage treatment, industrial/cooling water, waterworks, and surface water.
- BT-7000, GT-3200H, AT-2000, AS-300/AS-525, and MSF8000: restored the reviewed parameter, calibration, communication, alarm, sensor, record, and formula facts.
- Localization audit: expanded from a narrow blacklist to multiword raw-English public prose detection, with a technical-term allowlist only for legitimate product/standard identifiers.
- Canonical URLs now normalize protocol-relative input as an origin-relative path.

### RED

The first source-specific regression treated `石油化学` as an AT-2000
application because that text appeared in the captured page record. The
second-review body-only audit proved it came from navigation/related content,
so the assertion and unsupported application were removed.

### GREEN

After the body-evidence correction, the source-specific regression passed.
The catalog regression suite covers the reviewed BT8500, SCM520, BT6308-DO,
BT6308-SS, BT-7000, GT-3200H, AT-2000, AS-300/AS-525, and MSF8000 facts; it
also checks the AS-300 `<30s<>` source anomaly is visibly marked as source
text requiring confirmation.

### Final verification

```powershell
# Direct audit
& $node scripts/audit-content.mjs
# exit 0: 112 source records, 112 represented, 110 canonical routes;
# all mapping, image, contact, raw-English, metadata, relation, and route errors: 0

# Focused review tests (content and routes)
& $node .\node_modules\vitest\vitest.mjs run tests/content.test.ts tests/routes.test.ts
# semantic assertions green; a parallel run exceeded Vitest's 5-second default in
# unrelated filesystem/child-process checks under shared-machine CPU contention.

# Full test suite, single worker to avoid that external contention
& $node .\node_modules\vitest\vitest.mjs run --pool=forks --poolOptions.forks.singleFork --testTimeout=30000
# exit 0: 3 files, 33 tests passed

# Production build (telemetry disabled)
$env:NEXT_TELEMETRY_DISABLED='1'; & $node .\node_modules\next\dist\bin\next build
# exit 0: compiled successfully, TypeScript completed, static page generated
```

### Source anomalies retained explicitly

- AS-300 infrared source text `T90:<30s<>` and related malformed source notation are shown with `原文表記・要確認`; they were not silently corrected.
- MSF8000's source-derived 4-20mA load text is likewise marked `原文表記・要確認`.

## Concerns

No release-blocking concerns. The only intentionally retained English-like text is source OCR terminology explicitly marked `原文表記・要確認`; changing it would violate the instruction not to invent corrections.

## Second-review source-fidelity completion (2026-07-29)

### Scope and outcome

Reconciled the final structured catalog against all 45 product-detail source
records, including product-body applications, model/component identifiers,
standards, protocols, numeric facts, and visibly marked source anomalies.

- Restored source-body applications and operating facts across particle,
  dosing, water-quality, gas-detection, and flow/level products.
- Completed the source-dense BT-7000 and GT-3280-OU records, including
  controller/sensor construction, response/repeatability, communication,
  installation, storage, standards, and industry applications.
- Restored the BT6308 product-family application sets and standard-supply
  component identifiers, including `FC01`, `FC-TU910`, `FC-B830`, and
  `FC-B210`.
- Removed the unsupported `石油化学` application from AT-2000; its final
  applications are exactly water treatment, wastewater treatment, food,
  chemical, and metallurgy.
- Preserved source ambiguities instead of silently repairing them. Examples
  include BT-7000 `Norl`, `0.51bs`, and `約500m/min`; GT-3200H's unlabeled
  `≤60S`; and MSF8000 `m³p` plus the source formula `E=B-V-D-K`. Each is
  explicitly marked `原文表記・要確認`.
- Replaced the phrase-only English audit with token-level scanning of every
  public string in all five Japanese content files. The allowlist is limited
  to model identifiers, acronyms, units, trade names, and proper names.
- Added a generic 45-product source check for model/component tokens found in
  body-owned titles/tables plus standards and communication protocols. The
  only exclusions are documented SCM520 controller-block and SCM530
  comparison-row contamination.
- Generated the ignored scratch reconciliation at
  `.superpowers/sdd/product-source-reconciliation.json`; it contains one
  checklist entry for each of the 45 products.
- Used the checklist's finite residual queue to restore every remaining
  body-supported application, model association, numeric qualifier, wiring,
  alarm/output, and measurement-matrix fact. The refreshed artifact has 45
  unique product/source matches, 0 omitted facts, 0 unsupported catalog
  claims, and 0 navigation-derived application evidence.

### RED evidence

The new focused regression was run before the catalog fixes and failed with
five finding groups:

1. the first generic identifier pass surfaced SCM520 `RS485` from the
   unrelated controller block, proving the test needed body ownership and a
   documented narrow exclusion;
2. AT-2000 applications did not match its product-body list;
3. BT-7000 omitted the source `<40s` response fact;
4. GT-3280-OU omitted 24-hour continuous monitoring; and
5. the token-level localization scan found raw English public copy and units.

After those corrections, expanding model extraction to product composition
tables produced a further intentional RED for missing standard-supply
component identifiers (`FC01`, `FC-TU910`, and `FC-B830`). Those identifiers
were then restored to their matching product records.

### GREEN and final verification

```powershell
# Focused content and route regressions
& $node .\node_modules\vitest\vitest.mjs run `
  tests/content.test.ts tests/routes.test.ts `
  --pool=forks --poolOptions.forks.singleFork --testTimeout=30000
# exit 0: 2 files, 35 tests passed

# Direct source/content audit
& $node .\scripts\audit-content.mjs
# exit 0:
# source records 112; represented source URLs 112; canonical routes 110
# products 45; applications 31; articles 17; about 6; pages 11
# unmapped 0; multiply mapped 0; unexpected 0; missing images 0
# forbidden contacts 0; raw English public prose 0
# invalid dates 0; unresolved references 0; duplicate routes 0

# Full suite
& $node .\node_modules\vitest\vitest.mjs run `
  --pool=forks --poolOptions.forks.singleFork --testTimeout=30000
# exit 0: 3 files, 37 tests passed

# Production build
$env:NEXT_TELEMETRY_DISABLED='1'
& $node .\node_modules\next\dist\bin\next build
# exit 0 in 11.1 seconds: compiled successfully; TypeScript finished;
# static pages generated; page optimization finalized
```

Final counts after closing the reconciliation queue were 35/35 focused tests
and 37/37 full-suite tests. The first pre-closure build attempt reached a
successful export artifact but exceeded the 240-second command timeout before
returning a terminal status, so it was not counted as passing. A
telemetry-disabled pre-closure rerun completed normally, and the required
post-closure build above completed with exit code 0 in 11.1 seconds.

### Remaining concerns

No release-blocking concern remains. The refreshed 45-product checklist has
0 omitted facts and 0 unsupported claims. Source/OCR anomalies are
intentionally visible and flagged for technical confirmation; SCM520/SCM530
cross-record capture contamination is documented and excluded narrowly rather
than copied into the wrong product.
