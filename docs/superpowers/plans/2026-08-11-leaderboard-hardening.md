# APU Matrix Leaderboard Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan task-by-task. Every behavior change follows `superpowers:test-driven-development`; every completion claim follows `superpowers:verification-before-completion`.

**Goal:** Ship a responsive, accessible, performant first-release phone leaderboard using TanStack Charts for CPU, AI, and AnTuTu price-performance views, while keeping GPU as an honest empty state.

**Architecture:** Keep CSV normalization and metric semantics in pure helpers under `lib/`, keep TanStack chart-scene construction in one pure chart-definition module, and keep React components responsible for interaction state and accessible HTML. The graph and its adjacent table receive the same filtered point collection, while their memoized state is independent so table pagination does not rebuild the graph. Remove scraper-only API routes and the complete Chart.js dependency/import chain only after TanStack parity tests pass.

**Tech Stack:** Next.js 16, React 19, Bun, Vitest, Testing Library, TanStack Charts `0.9.0`, TanStack React Charts `0.9.0`, D3 Scale `4.0.2`, CSS.

## Global Constraints

- Work only in `the codex/apu-matrix-leaderboard worktree` on `codex/apu-matrix-leaderboard`; do not modify `the main working tree`.
- Preserve all pre-existing dirty files and unrelated user changes. Do not reset, restore, or rewrite history.
- Use Bun for all package and script commands. Never use npm, npx, Yarn, or pnpm.
- Do not fabricate benchmark scores, prices, GPU data, sources, or editorial content.
- CPU plots Geekbench 6 multi-core against INR price; AI plots Geekbench AI quantized against INR price; AnTuTu plots AnTuTu score against INR price; GPU remains an explicit unavailable-data state.
- Brand and processor filters apply to every populated metric. AI additionally filters backend, accelerator, and precision. Switching metrics resets filters invalid for the new metric.
- Lines connect sibling variants inside one exact generation only, never adjacent generations and never a whole brand. A visible caption explains that the connectors are not trends or regressions.
- At 30 or fewer visible points, label every point. Above 30, label the ten highest-performance points plus both endpoints of every visible sibling series. Label selection must never remove chart points or table rows.
- Use TanStack's default SVG adapter and built-in `lineY`, `dot`, and `text` marks. Keep every point keyboard-focusable and expose the same tooltip metadata to pointer and keyboard users.
- Benchmark and snapshot tables show at most 25 records initially, reset to page one after relevant state changes, use scoped headers, and retain full mobile details.
- Memoize filtered data, options, chart definition, sorted rows, and pages. Benchmark-table sort/search/page changes must not recreate the chart definition.
- At 390 px, 768 px, and desktop widths, there must be no document-level horizontal overflow. Test both themes.
- Remove all six `app/api/scrape/**/route.js` endpoints and only the now-unreferenced frontend scraper import chain. Leave the main checkout's scrapers and datasets untouched.
- Remove Chart.js packages and dead Chart.js components/tests after TanStack parity. Do not retain a hidden fallback.
- Production build output must not contain `MongoDB credentials not found`, and its route manifest must contain no `/api/scrape/` route.

## File Responsibility Map

- `lib/benchmarkGraphData.js`: CSV normalization, metric-specific point metadata, exact-generation sibling grouping.
- `lib/benchmarkChartDefinition.js`: deterministic label selection, tooltip rows, TanStack definition/scene inputs, and theme token mapping; no React state.
- `components/BenchmarkScatterPlot.jsx`: memoized TanStack React chart, caption, and chart accessibility shell.
- `components/BenchmarkPointTable.jsx`: benchmark search, sort, metric-aware columns, pagination, and reset behavior.
- `components/LeaderboardStage.jsx`: metric selection and metric-valid filters; passes filtered data to chart and table.
- `components/DeviceSnapshotTable.jsx`: device search, sort, pagination, desktop table, and complete mobile records.
- `app/globals.css`: shrink constraints, responsive chart/table/card presentation, focus, status, and pagination styles.
- `tests/*.test.*`: behavior and accessibility contracts. Prefer pure scene tests for geometry and Testing Library for interactions.

## Task 1: Replace the active Chart.js renderer with a tested TanStack chart core

**Files:**
- Create: `lib/benchmarkChartDefinition.js`
- Create: `tests/benchmarkChartDefinition.test.js`
- Modify: `components/BenchmarkScatterPlot.jsx`
- Modify: `tests/BenchmarkScatterPlot.test.jsx`
- Modify: `package.json`
- Modify: `bun.lock`

**Interfaces:**

```js
export function selectPersistentLabels(points, series, limit = 30)
export function tooltipRows(point, metricId)
export function createBenchmarkChartDefinition({ metric, theme })
```

`createBenchmarkChartDefinition` returns one `defineChart` definition with a linear x scale, linear INR y scale, one `lineY` mark per valid sibling series, one `dot` mark containing every visible point, and one `text` mark containing only `selectPersistentLabels(...)`. The React wrapper renders `<Chart definition={definition} height={...} ariaLabel={...} ariaDescription={...} />` from `@tanstack/react-charts` and exports no Chart.js lifecycle code.

- [ ] **RED:** Add pure tests proving: 24 points all remain labelled; 40 standalone points yield exactly the ten highest-x labels; sibling endpoints are unioned without duplicates; the scene includes every point, one line per supplied series, and only selected text labels. Add component tests proving caption/ARIA text and tooltip metadata for CPU and AI.
- [ ] Run `bun run test -- tests/benchmarkChartDefinition.test.js tests/BenchmarkScatterPlot.test.jsx`. Expected: failure because the new helper and TanStack renderer do not exist.
- [ ] Run `bun add @tanstack/charts@0.9.0 @tanstack/react-charts@0.9.0 d3-scale@4.0.2`.
- [ ] Implement `lib/benchmarkChartDefinition.js` with stable deterministic ordering (`x` descending, then `phoneName`, then `id`), sibling endpoint unioning, metric-aware tooltip rows, theme tokens, and built-in marks.
- [ ] Replace the Chart.js `canvas` effect in `BenchmarkScatterPlot.jsx` with `useMemo` around `createBenchmarkChartDefinition`. Keep a visible `<figcaption>` that names the benchmark and explains sibling-variant connectors. Keep an adjacent HTML metadata path so exact values are not SVG-only.
- [ ] Add a regression test that rerenders the component with table-only state unchanged and proves the definition factory is not called again for an equivalent metric object.
- [ ] **GREEN:** Run `bun run test -- tests/benchmarkChartDefinition.test.js tests/BenchmarkScatterPlot.test.jsx`. Expected: all focused tests pass with no warnings.
- [ ] Run `bun run test`. Expected: full suite passes before commit.
- [ ] Commit: `feat: render leaderboard with tanstack charts`.

## Task 2: Complete metric metadata and metric-valid filtering

**Files:**
- Modify: `lib/benchmarkGraphData.js`
- Modify: `tests/benchmarkGraphData.test.js`
- Modify: `components/LeaderboardStage.jsx`
- Modify: `tests/LeaderboardStage.test.jsx`

**Interfaces:**

Each normalized point exposes `processorName`. CPU details expose `cpuGeekbench6SingleCore` and `processorName`; AI details expose `aiBackend`, `aiAccelerator`, `aiPrecision`, and `processorName`; GPU details expose `gpuWildLifeExtremeFps` and `processorName`; AnTuTu details expose `processorName`.

`LeaderboardStage` owns a filter object:

```js
{ brand: 'all', processor: 'all', backend: 'all', accelerator: 'all', precision: 'all' }
```

It derives every option from the selected metric's points, filters by exact normalized values, and resets the complete filter object on metric changes.

- [ ] **RED:** Extend data tests for processor metadata on all metrics and exact-generation grouping (`S25`, `S25+`, `S25 Ultra` connect; `S24` does not). Extend stage tests for brand/processor filters on CPU and AnTuTu, AI compatibility filters, combined filters, option derivation, zero results, reset, and metric-switch reset.
- [ ] Run `bun run test -- tests/benchmarkGraphData.test.js tests/LeaderboardStage.test.jsx`. Expected: failures because populated CPU/AI filters and processor metadata are incomplete.
- [ ] Update `METRICS` detail lists and point normalization in `benchmarkGraphData.js`; keep `seriesKey` generation-specific and make its tests the contract.
- [ ] Refactor `LeaderboardStage.jsx` to derive filter controls for every populated metric, show AI-only compatibility controls, memoize visible points/series/options, remove filtered-out series points, and keep only series with at least two visible siblings.
- [ ] Render a polite zero-result status with a Reset filters button. Keep GPU's no-data message distinct from a network error.
- [ ] **GREEN:** Run `bun run test -- tests/benchmarkGraphData.test.js tests/LeaderboardStage.test.jsx`. Expected: all focused tests pass with no warnings.
- [ ] Run `bun run test`. Expected: full suite passes before commit.
- [ ] Commit: `feat: filter benchmark metrics consistently`.

## Task 3: Add the paginated metric-aware benchmark table

**Files:**
- Create: `components/BenchmarkPointTable.jsx`
- Create: `tests/BenchmarkPointTable.test.jsx`
- Modify: `components/BenchmarkScatterPlot.jsx`
- Modify: `components/LeaderboardStage.jsx`
- Modify: `tests/BenchmarkScatterPlot.test.jsx`
- Modify: `app/globals.css`

**Interfaces:**

```jsx
<BenchmarkPointTable points={points} metricId={metricId} resetKey={resetKey} />
```

The component uses a fixed `PAGE_SIZE = 25`. Sort buttons cycle only between ascending and descending after their first activation. Search is case-insensitive across device, brand, and processor. Columns are Device, Brand, Performance, Price plus CPU single-core/processor; AI backend/accelerator/precision/processor; GPU FPS/processor; or AnTuTu processor. It resets page to one whenever `points`, `metricId`, search, or sort changes.

- [ ] **RED:** Add tests for case-insensitive search, Brand/Performance/Price sorting in both directions, 25-row pagination, Previous/Next boundaries, visible result range, page reset after search/sort/metric/filter changes, metric-specific columns, scoped headers, and a search-empty reset action.
- [ ] Run `bun run test -- tests/BenchmarkPointTable.test.jsx tests/BenchmarkScatterPlot.test.jsx`. Expected: failure because the extracted table and required interactions do not exist.
- [ ] Implement `BenchmarkPointTable.jsx` with memoized searched/sorted/page slices, stable tie-breaker by phone name, `scope="col"`, `aria-sort`, disabled boundary controls, and a polite result-count status.
- [ ] Remove the inline table from `BenchmarkScatterPlot.jsx`; render the new component from `LeaderboardStage.jsx` beside the active chart so its state cannot affect chart-definition memoization.
- [ ] Add compact search/pagination styles and visible focus states without introducing a second horizontal document scroller.
- [ ] **GREEN:** Run `bun run test -- tests/BenchmarkPointTable.test.jsx tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx`. Expected: all focused tests pass with no warnings.
- [ ] Run `bun run test`. Expected: full suite passes before commit.
- [ ] Commit: `feat: paginate benchmark details`.

## Task 4: Make the device snapshot complete, sortable, paginated, and responsive

**Files:**
- Modify: `components/DeviceSnapshotTable.jsx`
- Modify: `tests/DeviceSnapshotTable.test.jsx`
- Modify: `app/globals.css`
- Modify: `tests/Dashboard.test.jsx`

**Interfaces:**

`DeviceSnapshotTable` keeps its existing data-loading contract and adds local search/sort/page state. Desktop renders a table. Below 768 px, CSS presents the same paginated records as stacked cards with labels for phone, processor, AnTuTu, price, and price type; no field is removed from the accessibility tree.

- [ ] **RED:** Add tests for case-insensitive phone/processor search, Phone/AnTuTu/Price ascending and descending sort, fixed 25-row pagination, page resets, scoped headers, loading `role="status"`, error `role="alert"`, empty/reset semantics, and complete mobile field labels.
- [ ] Run `bun run test -- tests/DeviceSnapshotTable.test.jsx tests/Dashboard.test.jsx`. Expected: failures for missing search, pagination, sorting, and complete mobile details.
- [ ] Implement memoized search/sort/pagination and accessible controls. Use one row model for desktop and mobile so values cannot drift.
- [ ] In `app/globals.css`, add `min-width: 0` and `max-width: 100%` to page-grid children, hero columns, leaderboard/chart/table wrappers; remove document-level min-content expansion; keep table overflow local on desktop; render mobile rows as labelled blocks without `.hide-on-mobile` data loss.
- [ ] Add a DOM-level regression assertion that page containers use shrink-safe classes/styles and that mobile records contain processor, price, and price type.
- [ ] **GREEN:** Run `bun run test -- tests/DeviceSnapshotTable.test.jsx tests/Dashboard.test.jsx`. Expected: all focused tests pass with no warnings.
- [ ] Run `bun run test`. Expected: full suite passes before commit.
- [ ] Commit: `feat: harden snapshot and mobile layout`.

## Task 5: Remove the scraper route and Chart.js runtime chains

**Files:**
- Delete: `app/api/scrape/android-ai-llm/route.js`
- Delete: `app/api/scrape/android-ai/route.js`
- Delete: `app/api/scrape/android-pad/route.js`
- Delete: `app/api/scrape/android-smartphone/route.js`
- Delete: `app/api/scrape/android-soc/route.js`
- Delete: `app/api/scrape/ios/route.js`
- Delete if unreferenced after import audit: `lib/runScrapeCategory.js`
- Delete if unreferenced after import audit: `lib/mongodb.js`
- Delete if unreferenced after import audit: `lib/scrapeAntutu.js`
- Delete: `components/PerformanceChart.js`
- Delete: `components/PerformanceChart.jsx`
- Delete: `components/ProcessorChart.js`
- Delete: `components/ProcessorChart.jsx`
- Delete: `components/PhonePricePerformanceChart.jsx`
- Delete: `tests/PerformanceChart.test.jsx`
- Delete: `tests/ProcessorChart.test.jsx`
- Delete: `tests/PhonePricePerformanceChart.test.jsx`
- Create: `tests/public-runtime-boundary.test.js`
- Modify: `package.json`
- Modify: `bun.lock`

- [ ] **RED:** Add `public-runtime-boundary.test.js` to assert the six route files are absent, production source contains no imports of `chart.js`, `react-chartjs-2`, adapters/plugins, or the scraper runtime chain, and `package.json` contains none of the five old chart dependencies.
- [ ] Run `bun run test -- tests/public-runtime-boundary.test.js`. Expected: failure while routes, imports, components, and dependencies remain.
- [ ] Run `rg -n "runScrapeCategory|mongodb|scrapeAntutu|chart\.js|react-chartjs-2|chartjs-adapter-date-fns|chartjs-plugin-datalabels|date-fns" app components lib tests package.json` and record all consumers before deletion.
- [ ] Delete the six routes and only scraper libraries with no remaining non-scraper consumer. Delete dead Chart.js components and their tests after confirming no active import.
- [ ] Run `bun remove chart.js react-chartjs-2 chartjs-adapter-date-fns chartjs-plugin-datalabels date-fns`.
- [ ] **GREEN:** Run `bun run test -- tests/public-runtime-boundary.test.js`. Expected: boundary test passes.
- [ ] Run `bun run test && bun run lint`. Expected: full suite and lint pass before commit.
- [ ] Run `bun run build 2>&1 | tee /tmp/apu-matrix-hardening-build.log`; then run `! rg -n "MongoDB credentials not found|/api/scrape/" /tmp/apu-matrix-hardening-build.log .next/routes-manifest.json .next/server/app-paths-manifest.json`. Expected: build succeeds and the audit command exits zero.
- [ ] Commit: `chore: remove private scraper and chartjs runtime`.

## Task 6: Close accessibility, integration, performance, and responsive gaps

**Files:**
- Modify as required by failures: `components/BenchmarkScatterPlot.jsx`
- Modify as required by failures: `components/BenchmarkPointTable.jsx`
- Modify as required by failures: `components/LeaderboardStage.jsx`
- Modify as required by failures: `components/DeviceSnapshotTable.jsx`
- Modify as required by failures: `app/globals.css`
- Create: `tests/leaderboard-integration.test.jsx`
- Append: `.superpowers/sdd/progress.md`

- [ ] **RED:** Add an integration test covering loading status, alert error, retry, CPU/AI/AnTuTu tab switching, honest GPU empty state, zero-result reset, chart caption, sibling-line explanation, keyboard-focus tooltip parity, and the requirement that only one active chart is mounted. Add a memoization spy proving table page/search/sort changes do not rebuild the TanStack definition.
- [ ] Run `bun run test -- tests/leaderboard-integration.test.jsx`. Expected: failure for any remaining integration or accessibility gap.
- [ ] Make only the smallest component/CSS changes required by those failures. Do not add new product sections, routes, datasets, chart modes, or dependencies.
- [ ] **GREEN:** Run `bun run test -- tests/leaderboard-integration.test.jsx`. Expected: integration tests pass with no warnings.
- [ ] Run `bun run test && bun run lint && bun run build`. Expected: all commands pass, no MongoDB warning, and no scraper route in build output.
- [ ] Start one Bun dev server with `bun run dev -- --port 3002`; reuse it for all browser checks.
- [ ] In the in-app browser, verify dark and light themes at 390 px, 768 px, and desktop: CPU/AI/AnTuTu controls, labels, pointer and keyboard metadata, table sort/search/pagination, snapshot sort/search/pagination, and GPU empty state.
- [ ] At 390 px and 768 px evaluate `document.documentElement.scrollWidth === window.innerWidth`; expected `true` in both themes.
- [ ] Save final browser screenshots under `.superpowers/sdd/evidence/` and record dimensions/results in `.superpowers/sdd/progress.md`.
- [ ] Commit: `test: verify leaderboard release readiness`.

## Final Review and Branch Completion

- [ ] Generate one whole-branch review package from the hardening-plan base commit to `HEAD` and dispatch a fresh Luna reviewer for spec compliance, correctness, accessibility, performance, and scope.
- [ ] Fix every Critical and Important finding with a fresh Luna implementer, rerun focused and full verification, and re-review until approved.
- [ ] Run final `git status --short`, `bun run test`, `bun run lint`, and `bun run build` locally. Report pre-existing dirty files separately from new hardening changes.
- [ ] Use `superpowers:finishing-a-development-branch` to present the verified branch outcome; do not merge, push, or open a PR without the user's explicit instruction for that action.
