# Task 2 Report: Real Benchmark Graph Layer

## Status

Implemented Task 2 in the forked workspace. Task 1's `/api/benchmarks` contract is consumed without changing the imported CSV or Task 1 API/data module.

## Changed behavior

- Added `BenchmarkScatterPlot` with a responsive Chart.js scatter plot.
- Rendered each benchmark point as an individual company-coloured dot.
- Rendered only the API-provided `metric.series` as muted lines, preserving same-brand/device-family grouping from Task 1.
- Added a semantic benchmark point table with device, brand, performance, and price values.
- Added tooltip callbacks for device, performance, price, and brand.
- Added the exact GPU empty state: `3DMark data is not available yet.` No fabricated GPU chart is rendered.
- Added live `/api/benchmarks` fetching alongside the existing `/api/devices` request, with independent loading and error states.
- Preserved the existing device table request, refresh behavior, device status messaging, metric tabs, and unrelated working-tree changes.

## TDD evidence

### RED

Command:

```text
bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx
```

Result: failed as expected before implementation. The leaderboard still rendered the old graph reserve and the new graph behaviors were absent.

### GREEN

Command:

```text
bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx
```

Result: 3 test files passed, 11 tests passed.

## Verification

- Focused UI suite: passed — 3 files, 11 tests.
- Full Bun test suite: passed — 19 files, 84 tests.
- `bun run lint`: passed with exit code 0.

## Files in the Task 2 commit

- `components/BenchmarkScatterPlot.jsx`
- `components/LeaderboardStage.jsx`
- `app/page.js`
- `app/globals.css`
- `tests/BenchmarkScatterPlot.test.jsx`
- `tests/LeaderboardStage.test.jsx`
- `tests/Dashboard.test.jsx`

## Concerns

- Chart.js canvas rendering is represented by test mocks in the UI tests; the semantic table and chart configuration are verified, but no screenshot or browser pixel comparison was run.
- The existing worktree contains unrelated modifications and deletions; they were not staged or included in the Task 2 commit.

## Task 2 review-fix addendum

### Scope guard

- Worked only in `the codex/apu-matrix-leaderboard worktree` on branch `codex/apu-matrix-leaderboard`.
- Did not modify the imported CSV, Task 1 API route, or Task 1 data module.
- Existing unrelated worktree changes were preserved and excluded from the fix commit.

### Review findings fixed

- `components/BenchmarkScatterPlot.jsx` now maps the real benchmark metric (`point.x`) to the chart x-axis and normalized INR price (`point.priceInr`) to the y-axis for both scatter dots and family connecting lines.
- Axis titles now match that mapping: the x title is the metric label and the y title is `Price (INR)`.
- Tooltip values now read performance from chart x and price from chart y, matching the plotted coordinates.
- Chart.js receives deterministic dark/light theme colors through the supplied `theme` prop. Axis titles, ticks, grids, tooltip surface/text/border, and the chart-area background all change with the theme. The background uses a Chart.js draw plugin, so the canvas pixels are themed rather than only the surrounding CSS.

### TDD evidence for review fix

#### RED

Command:

```text
bun run test -- tests/BenchmarkScatterPlot.test.jsx
```

Result: failed as expected before the production change — 2 of 3 tests failed. The coordinate assertion received `{ x: 9200, y: 9200 }` instead of `{ x: 9200, y: 79999 }`, and the theme assertion failed because no background theme configuration existed.

#### GREEN

Command:

```text
bun run test -- tests/BenchmarkScatterPlot.test.jsx
```

Result: 1 file passed, 3 tests passed.

Covering focused command:

```text
bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx
```

Result: 3 files passed, 12 tests passed.

Focused lint command:

```text
bun run lint -- components/BenchmarkScatterPlot.jsx tests/BenchmarkScatterPlot.test.jsx
```

Result: passed with exit code 0 and no warnings.

### Review-fix files

- `components/BenchmarkScatterPlot.jsx`
- `tests/BenchmarkScatterPlot.test.jsx`
- `.superpowers/sdd/task-2-report.md`

### Remaining concern

- The component now responds deterministically when its `theme` prop changes. The existing page integration does not yet pass the ThemeToggle state into `LeaderboardStage`/`BenchmarkScatterPlot`, so application-level live theme propagation remains outside this narrowly scoped review fix.
