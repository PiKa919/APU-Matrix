# Task 1 Report: Currency Parsing And Price Normalization

## Outcome

Implemented the first extraction utility layer for phone price normalization in `lib/extraction/currency.js` and added focused tests in `tests/extraction/currency.test.js`.

## What Changed

- Added `DEFAULT_EXCHANGE_RATES` with the exact supported currency set from the brief.
- Added `parseCurrencyValue(rawValue)` for supported INR, USD, CNY, EUR, GBP, JPY, and KRW price strings.
- Added `normalizePrice(rawValue, source, priceType, rates)` to produce normalized INR and USD values and preserve confidence when provided.
- Added tests covering string parsing, normalization, object inputs, and null/unsupported cases.

## Verification

- `npm test -- --config /tmp/vitest-currency.config.cjs tests/extraction/currency.test.js`
- Result: 1 file passed, 4 tests passed.

## Notes

- The repo’s checked-in Vitest config currently includes only `tests/**/*.test.jsx`, so the new `.js` test file is not discovered by the default test glob. I verified the task with a temporary Vitest config that includes `tests/**/*.test.js` without changing any unrelated repo files.

## Commit

- Created: `3b70f0c`
