# Hardening Task 2 Report

## Status

Complete. Task 2 implements metric metadata and metric-valid filtering without changing the benchmark table, snapshot layout, Chart.js cleanup, or scraper routes.

## RED evidence

Command:

```text
bun run test -- tests/benchmarkGraphData.test.js tests/LeaderboardStage.test.jsx
```

The focused suite failed with 7 failures across 19 tests. The failures covered missing CPU/AI filter controls, missing AI processor metadata, missing zero-result reset behavior, and the metric-switch reset contract. The pre-existing AI-empty-state assertion also failed after the fixture was expanded with real AI points; it was updated as part of the Task 2 test contract.

## GREEN evidence

Focused suite:

```text
bun run test -- tests/benchmarkGraphData.test.js tests/LeaderboardStage.test.jsx
2 test files passed
19 tests passed
```

Full suite and lint:

```text
bun run test
20 test files passed
104 tests passed

bun run lint
eslint completed with zero errors and zero warnings
```

## Changes

- `lib/benchmarkGraphData.js`
  - Adds `processorName` to AI detail metadata.
  - Excludes `undefined` detail values so every metric exposes only valid metadata.
  - Keeps CPU single-core, processor, AI compatibility metadata, GPU FPS/processor, and AnTuTu processor metadata in the metric detail contract.
- `components/LeaderboardStage.jsx`
  - Owns the complete `{ brand, processor, backend, accelerator, precision }` filter object.
  - Derives options from the selected metric points.
  - Applies exact normalized-value matching to CPU, AI, and AnTuTu; AI receives all five controls.
  - Filters series points and removes series with fewer than two visible siblings.
  - Resets all filters on metric changes and offers a reset action for zero-result combinations.
  - Retains GPU's distinct no-data state when no GPU points exist.
- `tests/benchmarkGraphData.test.js` and `tests/LeaderboardStage.test.jsx`
  - Cover metadata, exact-generation sibling grouping, populated-metric filters, AI compatibility filters, combined filters, option derivation, zero results, reset, and metric-switch reset.

## Self-review

- `rg` confirms no `upcoming` filter placeholder remains in `LeaderboardStage.jsx`.
- Filter options are derived from `rawMetric.points`; no benchmark values or filter options are fabricated.
- Metric switches always restore all five fields to `all`.
- Filtering changes chart points and sibling series together; a visible series survives only with at least two matching siblings.
- `git diff --check` is clean.

## Dirty-boundary notes

The worktree contained approved uncommitted changes before Task 2, including `components/LeaderboardStage.jsx` and `tests/LeaderboardStage.test.jsx`. The existing partial AnTuTu-only filter implementation in `LeaderboardStage.jsx` had to be replaced by the approved all-metric implementation. The existing baseline assertions and fixture changes in `tests/LeaderboardStage.test.jsx` overlap the new Task 2 coverage and travel with the Task 2 commit; unrelated dirty files remain unstaged.

## Commit

`feat: filter benchmark metrics consistently` (final commit hash is reported in the handoff)
