# Task 4 Report: Chart-Ready Dataset Pipeline

## Implemented

- Added `lib/extraction/build-chart-dataset.js` with `buildPhonePricePerformanceDataset(options)`.
- Added `scripts/build-phone-price-performance.mjs`.
- Added `public/data/price-overrides.json`.
- Added generated outputs:
  - `public/data/phone-price-performance.json`
  - `public/data/phone-price-performance-report.json`
- Added `data:build-phone-performance` npm script.
- Added `tests/extraction/build-chart-dataset.test.js`.

## Behavior Covered

- Builds one row per benchmark phone with processor metadata, AnTuTu score, price candidates, selected plotted price, source matches, and missing fields.
- Prefers launch price over current market price.
- Falls back to current market price when launch price is unavailable.
- Keeps unpriced rows in the dataset with `plottedPrice: null` for the review table.
- Requires processor-compatible overrides so same-name regional/chipset variants do not attach the wrong source price.
- Uses existing benchmark `priceINR` and `priceUSD` as lower-confidence current-price candidates.

## Verification

- RED before builder implementation: `npm test -- tests/extraction/build-chart-dataset.test.js` failed because `lib/extraction/build-chart-dataset.js` did not exist.
- RED after adding processor-disambiguation test: `npm test -- tests/extraction/build-chart-dataset.test.js` failed because same-name wrong-processor overrides still attached.
- GREEN after implementation: `npm test -- tests/extraction/build-chart-dataset.test.js` passed, 1 file and 3 tests passed.
- GREEN integration check: `npm test -- tests/extraction/currency.test.js tests/extraction/processor-normalization.test.js tests/extraction/phone-matching.test.js tests/extraction/price-selection.test.js tests/extraction/build-chart-dataset.test.js` passed, 5 files and 39 tests passed.
- Build command: `npm run data:build-phone-performance` wrote 315 rows, 48 plotted rows, and 267 missing-price rows.

## Notes

- `package.json` now declares `"type": "module"` so the Node CLI can import repo ESM modules without warnings.
- `npm install --package-lock-only --ignore-scripts` reported existing audit issues, but no lockfile changes were kept.
