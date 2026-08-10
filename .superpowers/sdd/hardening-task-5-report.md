# Hardening Task 5 Report

Status: complete

## Scope

- Removed the six private `app/api/scrape/**/route.js` endpoints.
- Removed the now-unreferenced frontend scraper chain: `lib/runScrapeCategory.js`, `lib/mongodb.js`, and `lib/scrapeAntutu.js`.
- Removed the five dead Chart.js components and their three legacy tests.
- Removed the five Chart.js/date-fns runtime dependencies with Bun and refreshed `bun.lock`.
- Added `tests/public-runtime-boundary.test.js` to protect the public runtime boundary.
- Preserved the existing dirty files, including the legacy `.superpowers/sdd/task-5-report.md`, package-lock/pnpm-lock deletions, data, and API edits.

## Import audit

The pre-deletion audit found:

- All six scraper routes imported `@/lib/runScrapeCategory`.
- `lib/runScrapeCategory.js` imported `@/lib/mongodb` and `@/lib/scrapeAntutu`.
- The Chart.js imports were confined to the four deleted Chart.js components and their deleted tests.
- No active application consumer referenced `PhonePricePerformanceChart`.
- No remaining production source under `app`, `components`, or `lib` contains the removed scraper or Chart.js runtime imports.

## Verification

- RED boundary test: expected failure, 4 tests failed because the routes, chain, dead files, imports, and packages existed.
- GREEN boundary test: 4 passed.
- Full Vitest suite: 19 files, 118 tests passed.
- ESLint: passed with no warnings.
- Production build: passed.
- Build route output contains only `/`, `/_not-found`, `/api/benchmarks`, and `/api/devices`.
- Build audit passed: neither `MongoDB credentials not found` nor `/api/scrape/` appears in `/tmp/apu-matrix-hardening-build.log`, `.next/routes-manifest.json`, or `.next/server/app-paths-manifest.json`.

## Commit

Commit: `chore: remove private scraper and chartjs runtime`
