# Task 2 Report: Processor Normalization

## Outcome

Implemented the processor normalization utility in `lib/extraction/processor-normalization.js` and added focused regression coverage in `tests/extraction/processor-normalization.test.js`.

## What Changed

- Added raw-prefix normalization for real repo inputs, including leading `Generic` plus English and Chinese brand prefixes.
- Normalized `Generic Samsung Exynos 2400`, `Generic 谷歌 Tensor G4`, and `Generic HiSilicon Kirin980` to the canonical names expected by the review.
- Added support for the English raw prefixes `Samsung`, `Google`, and `HiSilicon` where they appear before known processor families.
- Updated processor series classification so `Snapdragon 8s Gen 3` and `Snapdragon 8s Gen 4` stay in `flagship` instead of falling through to `other`.
- Adjusted Helio tiering to match repo taxonomy for the reviewed cases:
  - `Helio G100` -> `entry`
  - `Helio G95` -> `mid`
  - `Helio X30` -> `flagship`
- Added regression tests for all reviewed cases.

## Verification

- `npm test -- tests/extraction/processor-normalization.test.js`
- Result: passed, 1 file / 4 tests.
- `npm test`
- Result: failed in unrelated `tests/Dashboard.test.jsx` with `Failed to resolve import "../app/page.jsx" from "tests/Dashboard.test.jsx". Does the file exist?`

## Follow-up Fix

Addressed the remaining normalization findings:

- Preserved Helio names under the `联发科技` prefix instead of rewriting every MediaTek raw input to `Dimensity`.
- Kept `联发科技 天玑9500` on the Dimensity path.
- Classified Snapdragon `7s` models as `premium` and `4s` models as `entry`.
- Broadened Helio taxonomy to match the repo examples for `G100`, `G99`, `G96`, `G95`, `G85`, `G70`, `G35`, `P35`, and `X30`.

## Verification

- `npm test -- tests/extraction/processor-normalization.test.js`
- Result: passed, 1 file / 4 tests.
- `npm test`
- Result: still fails in unrelated `tests/Dashboard.test.jsx` with `Failed to resolve import "../app/page.jsx" from "tests/Dashboard.test.jsx". Does the file exist?`

## Third Fix Cycle

Addressed the remaining Task 2 reviewer findings without widening the normalization rules:

- Canonicalized glued repo-real Snapdragon family/model strings by inserting the family separator only when `Snapdragon` is immediately followed by a digit.
- Canonicalized glued repo-real Dimensity family/model strings by inserting the family separator only when `Dimensity` is immediately followed by a digit.
- Canonicalized uppercase raw Tensor names from Chinese-prefixed inputs by mapping leading `TENSOR` to canonical `Tensor`.
- Treated bare canonical family names like `Tensor` as valid generation values instead of falling through to `Other`.
- Added regression coverage for the six exact reviewer cases:
  - `Snapdragon8 Elite Gen 5`
  - `Snapdragon7+ Gen 3`
  - `Dimensity9000+`
  - `Dimensity8100-Max`
  - `谷歌 TENSOR G3`
  - `谷歌 TENSOR`

## Spot Check

Direct module spot-check after implementation using `node --input-type=module`:

- `Snapdragon8 Elite Gen 5` -> name `Snapdragon 8 Elite Gen 5`; brand `Snapdragon`; series `flagship`; generation `8 Elite Gen 5`
- `Snapdragon7+ Gen 3` -> name `Snapdragon 7+ Gen 3`; brand `Snapdragon`; series `premium`; generation `7+ Gen 3`
- `Dimensity9000+` -> name `Dimensity 9000+`; brand `MediaTek`; series `flagship`; generation `Dimensity 9000`
- `Dimensity8100-Max` -> name `Dimensity 8100-Max`; brand `MediaTek`; series `premium`; generation `Dimensity 8100`
- `谷歌 TENSOR G3` -> name `Tensor G3`; brand `Tensor`; series `flagship`; generation `Tensor G3`
- `谷歌 TENSOR` -> name `Tensor`; brand `Tensor`; series `flagship`; generation `Tensor`

## Verification

- `npm test -- tests/extraction/processor-normalization.test.js`
- Result: passed, 1 file / 5 tests.
- `npm test`
- Result: still fails in unrelated `tests/Dashboard.test.jsx` with `Failed to resolve import "../app/page.jsx" from "tests/Dashboard.test.jsx". Does the file exist?`
