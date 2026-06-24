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
