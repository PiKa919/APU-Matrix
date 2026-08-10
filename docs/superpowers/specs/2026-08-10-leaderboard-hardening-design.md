# APU Matrix Leaderboard Hardening Design

## Goal

Finish the first public leaderboard release by correcting responsive defects, reducing initial rendering work, and making the CPU, AI, and AnTuTu views easier to understand without inventing unavailable GPU data.

## Verified baseline

- The isolated leaderboard worktree passes 19 test files and 93 tests, ESLint, and a Next.js production build.
- The CSV currently yields 24 CPU points, 23 AI points, 113 AnTuTu points, and no complete GPU score-and-price pairs.
- A 390 px browser viewport currently produces a 612 px document width and horizontal page overflow.
- Rendering all graph and snapshot rows produces a page over 10,000 px tall.
- The build still discovers scraper API routes and emits repeated MongoDB credential warnings even though scraper dependencies are intentionally absent from the public frontend package.

## Chart-library decision

Retain Chart.js 4.5.1 for this release.

TanStack Charts can express the required layered scatter and line visualization. Its official documentation provides responsive SVG, optional Canvas, keyboard focus, native tooltips, theme inheritance, and framework adapters. However, the current package is version 0.9.0, was published on 2026-08-09, and the core package currently declares 19 dependencies. Migrating a tested chart immediately before release would add API and regression risk without addressing the measured bottlenecks in this application.

The actual bottlenecks are the unbounded HTML tables, label overdraw for 113 AnTuTu points, mobile min-content overflow, and obsolete scraper routes in the frontend build. These will be fixed directly.

Reconsider TanStack Charts after a stable 1.x release and only after a small branch experiment proves visual parity, keyboard interaction parity, label behavior, and a smaller production client bundle than the optimized Chart.js implementation.

References:

- [TanStack Charts overview](https://tanstack.com/charts/latest/docs/overview)
- [TanStack Charts React adapter](https://tanstack.com/charts/latest/docs/framework/react/adapter)
- [TanStack Charts large-data guidance](https://tanstack.com/charts/latest/docs/guides/large-data)

## Responsive layout

All direct children of the page grid, the hero columns, leaderboard stage, chart wrapper, and table wrappers must be allowed to shrink with `min-width: 0` and constrained to `max-width: 100%` where necessary.

At 390 px, 768 px, and desktop widths:

- The document must not overflow horizontally.
- Controls may wrap without clipping labels or making touch targets overlap.
- The hero remains one column below 768 px.
- The graph remains usable through its responsive canvas.
- Device details remain available on mobile instead of hiding processor and price context.

## Graph behavior

### Metric availability

- CPU uses Geekbench 6 multi-core on the x-axis and price in INR on the y-axis.
- AI uses Geekbench AI quantized score on the x-axis and price in INR on the y-axis.
- AnTuTu uses AnTuTu score on the x-axis and price in INR on the y-axis.
- GPU remains an explicit unavailable state until a complete 3DMark Wild Life Extreme score-and-price pair exists.
- Switching metrics resets filters that are not valid for the next metric.

### Filters

Brand and processor filters apply to every populated metric. AI additionally exposes backend, accelerator, and precision filters because values are comparable only when those settings match. Filter options are derived from the selected metric's points and never hard-coded from unavailable data.

### Series lines

Lines connect sibling variants inside one exact phone generation, such as Galaxy S25, Galaxy S25+, and Galaxy S25 Ultra. They must not connect different generations such as S24 to S25, and they must not connect every phone from the same company.

A visible caption states that lines connect sibling variants and are not regression or trend lines.

### Labels and dense data

- CPU and AI keep direct labels because each currently has fewer than 30 points.
- For a metric with more than 30 points, persistent labels are limited to a deterministic useful subset: the ten highest performance points plus endpoints of visible sibling-variant series.
- Every point remains available through pointer and keyboard focus, tooltip content, and the adjacent data table.
- Label reduction affects presentation only; it must not remove points or rows.

### Metric metadata

The table and tooltip expose metadata relevant to the active metric:

- CPU: Geekbench single-core score and processor.
- AI: backend, accelerator, precision, and processor.
- GPU when available: Wild Life Extreme FPS and processor.
- AnTuTu: processor.

The accessible chart caption identifies the benchmark family and explains the sibling-variant lines. Exact values remain available in HTML, not only on canvas.

## Tables

### Benchmark table

- Retain ascending and descending sorting for Brand, Performance, and Price.
- Add case-insensitive device search.
- Show 25 rows per page with Previous and Next controls and a visible result count.
- Reset to page one when the metric, filter, search, or sort changes.
- Add metric-specific metadata columns without placing every possible field in every metric.

### Device snapshot

- Add case-insensitive search and sortable Phone, AnTuTu score, and Price columns.
- Show 25 rows per page with Previous and Next controls.
- Desktop keeps the compact table.
- Mobile uses readable stacked records that retain phone, processor, score, price, and price type.

Both tables use scoped column headers, visible focus styles, and disabled pagination controls at their boundaries.

## Loading, error, and empty states

- Benchmark loading and empty messages use polite status semantics.
- Benchmark errors use alert semantics.
- The existing refresh button retries both device and benchmark requests.
- GPU absence is described as missing data, not as a load failure.
- A zero-result filter or search state clearly offers a reset path.

## Performance changes

- Paginate both tables so the initial DOM contains at most 25 rows from each data surface.
- Keep only the active metric chart mounted.
- Memoize filtered metric data, series, filter options, and sorted/paginated rows.
- Preserve Chart.js lifecycle cleanup and avoid recreating the chart for unrelated table pagination changes.
- Keep the Three.js scene dynamically imported, reduced-motion aware, and isolated from chart/data state.
- Remove the six scraper API routes and their frontend-only import chain from the isolated public frontend worktree. The scraper and datasets in the main checkout remain untouched.
- Remove Chart.js adapters/plugins only if the import audit confirms that the active frontend does not use them.
- The production build must complete without MongoDB credential warnings.

## Scope boundaries

- Do not fabricate GPU values, prices, benchmark scores, sources, or editorial content.
- Do not implement Devices, Processors, or Field Notes routes in this increment.
- Do not migrate to TanStack Charts in this increment.
- Do not modify the main checkout's scraper scripts or datasets.
- Do not change the existing device or benchmark API response contracts except to add optional point metadata already present in the CSV.

## Testing and verification

All behavior changes follow test-first development.

Automated coverage must include:

- exact-generation sibling-series grouping;
- filters for populated metrics and AI compatibility metadata;
- dense-label selection without point removal;
- benchmark-table sorting, search, pagination, and page reset;
- snapshot sorting, search, pagination, and mobile details;
- accessible captions, headers, loading, error, empty, and pagination states;
- chart lifecycle stability when only table pagination changes;
- absence of scraper routes from the production route manifest.

Final verification requires:

- full Vitest suite;
- ESLint;
- Next.js production build with no MongoDB credential warning;
- browser checks in dark and light themes at 390 px, 768 px, and desktop widths;
- `document.documentElement.scrollWidth === window.innerWidth` at the tested mobile widths;
- functional CPU, AI, and AnTuTu filters, labels, tooltips, sorting, search, and pagination;
- an honest GPU empty state.
