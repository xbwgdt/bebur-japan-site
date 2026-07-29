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

## Concerns

No release-blocking concerns. The only intentionally retained English-like text is source OCR terminology explicitly marked `原文表記・要確認`; changing it would violate the instruction not to invent corrections.
