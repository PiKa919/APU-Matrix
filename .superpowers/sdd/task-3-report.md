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

## Controller Fix: Mixed Currency Tie-Breaks And Plus Variant Guard

Applied after re-review found two remaining gaps:
- Price selection compared `normalizedINR` and `normalizedUSD` values as the same unit during equal-confidence tie-breaks.
- Phone matching still allowed a Plus target to attach to a non-Plus candidate above threshold when no Plus candidate existed.

Changes:
- Added a unit-rank tie-break so INR-normalized prices win mixed-unit ties, while USD-only candidates remain valid fallbacks.
- Added a Plus-variant guard so the `plus` token must agree between target and candidate names.
- Added regression tests for mixed INR/USD tie-breaks and Plus-to-non-Plus overmatching.

Verification:
- RED before implementation: `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js` failed with the two expected regressions.
- GREEN after implementation: `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js` passed, 2 files and 11 tests passed.

## Controller Fix: Broader Phone Variant Compatibility

Applied after re-review found phone matching could still attach prices across distinct base/Ultra/Max variants and adjacent model generations. The same review also noted that the Plus guard broke spaced `One Plus` brand spellings.

Changes:
- Added regression tests for base-to-Ultra, Pro-to-Pro-Max, adjacent generation, and spaced `One Plus` brand matching.
- Normalized known spaced brand prefixes before variant comparison.
- Replaced the single Plus guard with variant-signature and numeric-model compatibility checks.

Verification:
- RED before implementation: `npm test -- tests/extraction/phone-matching.test.js` failed on the new overmatch and `One Plus` cases.
- GREEN after implementation: `npm test -- tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js` passed, 2 files and 13 tests passed.
