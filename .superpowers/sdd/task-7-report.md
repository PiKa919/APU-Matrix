# Task 7 Report: Phone Price Performance Scatter Chart

## Implemented

- Added `components/PhonePricePerformanceChart.jsx`.
- Added `tests/PhonePricePerformanceChart.test.jsx`.

## Behavior Covered

- Renders the dark chart surface for AnTuTu score vs phone price.
- Shows plotted, current-fallback, and missing-price summary counts.
- Filters rows by processor brand.
- Excludes missing-price rows from plotted points while still counting them.
- Uses processor-brand colors and current-price fallback markers.

## Verification

- RED before implementation: `npm test -- tests/PhonePricePerformanceChart.test.jsx` failed because the component did not exist.
- GREEN after implementation: `npm test -- tests/PhonePricePerformanceChart.test.jsx` passed, 1 file and 2 tests passed.
- GREEN focused integration check: `npm test -- tests/PhonePricePerformanceChart.test.jsx tests/MissingPriceTable.test.jsx tests/devices-route.test.js` passed, 3 files and 4 tests passed.
