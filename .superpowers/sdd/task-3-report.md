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
