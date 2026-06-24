# Task 3 Report: Phone Matching And Price Selection

## Implemented

- Added `lib/extraction/phone-matching.js` with:
  - `normalizePhoneName(value)`
  - `scorePhoneMatch(target, candidate)`
  - `bestPhoneMatch(target, candidates, threshold = 0.55)`
- Added `lib/extraction/price-selection.js` with:
  - `selectPlottedPrice(launchPrices, currentPrices)`
- Added focused tests for both modules under `tests/extraction/`.

## Behavior Covered

- Phone names are normalized by removing storage suffixes, bracketed qualifiers, and punctuation noise.
- Phone match scoring favors exact and near-identical devices, while unrelated phones stay well below the threshold.
- Best-match selection returns the top candidate only when it clears the confidence threshold.
- Price selection prefers launch prices over current prices and picks the highest-confidence candidate within the chosen bucket.

## Verification

- `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js`
- `npm test`

## Notes

- The focused extraction suites passed.
- The full repo test run still fails in `tests/Dashboard.test.jsx` because `app/page.jsx` is missing in the current workspace. That failure is outside the files owned by this task.

## Controller Fix: Price Candidate Currency And Plus Matching

Applied after Task 3 review found two gaps:
- `selectPlottedPrice()` rejected valid candidates that had `normalizedUSD` but no `normalizedINR`.
- `normalizePhoneName()` stripped `+` instead of preserving it as `plus`.

Changes:
- Added `normalizedUSD` fallback validation/comparison in price selection.
- Preserved `+` as `plus` after memory-configuration stripping in phone matching.
- Added regression tests for USD-only launch candidates and `Pro+` / `Pro Plus` matching.

Verification:
- RED before implementation: `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js` failed with three expected regressions.
- GREEN after implementation: `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js` passed, 2 files and 9 tests passed.
