# Task 6 Report: Missing-Price Review Table

## Implemented

- Added `components/MissingPriceTable.jsx`.
- Added `tests/MissingPriceTable.test.jsx`.

## Behavior Covered

- Renders only rows with `plottedPrice: null`.
- Displays phone name, processor, formatted AnTuTu score, category, and missing fields.
- Returns `null` when no rows need price review.

## Verification

- RED before implementation: `npm test -- tests/MissingPriceTable.test.jsx` failed because the component did not exist.
- GREEN after implementation: `npm test -- tests/MissingPriceTable.test.jsx` passed, 1 file and 1 test passed.
- GREEN focused integration check: `npm test -- tests/MissingPriceTable.test.jsx tests/devices-route.test.js` passed, 2 files and 2 tests passed.
