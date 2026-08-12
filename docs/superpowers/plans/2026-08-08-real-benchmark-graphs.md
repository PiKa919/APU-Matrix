# Real Benchmark Graphs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the leaderboard placeholder with real, price-versus-performance CPU, AI, and AnTuTu plots from the manually maintained benchmark CSV.

**Architecture:** A server-side benchmark-data module parses the CSV, validates usable price/metric pairs, deduplicates canonical phone models, and returns metric-specific plot records plus safe family-line groups. A client Chart.js component renders company-coloured scatter points and family lines, while the existing stage continues to own metric selection and shows an explicit GPU empty state.

**Tech Stack:** Next.js App Router, React, Chart.js with react-chartjs-2, Vitest, Bun.

## Global Constraints

- Source the graph data only from `public/data/phone-metrics-pricing.csv` because the feature worktree predates the manually entered data.
- CPU x-axis is Geekbench 6 multi-core; AI x-axis is Geekbench AI quantized score; AnTuTu x-axis is `x_metric_antutu_score`; y-axis is `y_price_inr` in INR.
- Dots are colour-coded by `phone_brand` and a line may join only records with equal non-empty `phone_brand` and `device_family`.
- Sort joined series by release year then numeric phone generation; do not infer series from `processor_series`.
- Preserve a data-aware GPU empty state because the CSV has no 3DMark Wild Life Extreme score or FPS.
- Do not fabricate benchmark values, price values, device families, source URLs, or chart points.
- Use Bun commands for install, test, lint, and build.

---

### Task 1: Serve normalized benchmark plot data

**Files:**
- Create: `lib/benchmarkGraphData.js`
- Create: `app/api/benchmarks/route.js`
- Create: `tests/benchmarkGraphData.test.js`
- Create: `tests/benchmarks-route.test.js`
- Add: `public/data/phone-metrics-pricing.csv`

**Interfaces:**
- Produces `buildBenchmarkGraphData(csvText)` returning `{ metrics: { cpu, ai, antutu, gpu }, brands }`.
- Each non-empty metric has `points`, `series`, `xLabel`, and `xValueLabel`; a point has `{ id, phoneName, phoneBrand, deviceFamily, releaseYear, x, priceInr, priceType, details, sourceUrl }`.
- The endpoint returns `{ success: true, data: buildBenchmarkGraphData(csvText) }`.

- [ ] **Step 1: Write failing data-shaping tests**

```js
it('deduplicates repeated canonical models and groups safe same-brand family lines', () => {
  const data = buildBenchmarkGraphData(csvFixture);
  expect(data.metrics.cpu.points).toHaveLength(3);
  expect(data.metrics.cpu.series).toEqual([
    expect.objectContaining({ id: 'Samsung:Galaxy S', points: [
      expect.objectContaining({ phoneName: 'Galaxy S24' }),
      expect.objectContaining({ phoneName: 'Galaxy S25' }),
    ] }),
  ]);
});

it('keeps GPU empty when no complete 3DMark score and price pair exists', () => {
  expect(buildBenchmarkGraphData(csvFixture).metrics.gpu.points).toEqual([]);
});
```

- [ ] **Step 2: Run the data-shaping test to verify it fails**

Run: `bun run test -- tests/benchmarkGraphData.test.js`

Expected: FAIL because `lib/benchmarkGraphData.js` does not exist.

- [ ] **Step 3: Implement the minimal parser and data model**

```js
export function buildBenchmarkGraphData(csvText) {
  const rows = parseCsv(csvText).map(normalizeRow);
  const deduplicated = deduplicateByCanonicalModel(rows);
  return {
    brands: uniqueBrands(deduplicated),
    metrics: {
      cpu: metricData(deduplicated, { id: 'cpu', value: 'cpuGeekbench6MultiCore', label: 'Geekbench 6 multi-core' }),
      ai: metricData(deduplicated, { id: 'ai', value: 'aiGeekbenchQuantizedScore', label: 'Geekbench AI quantized score' }),
      antutu: metricData(deduplicated, { id: 'antutu', value: 'antutuScore', label: 'AnTuTu score' }),
      gpu: metricData(deduplicated, { id: 'gpu', value: 'gpuWildLifeExtremeScore', label: '3DMark Wild Life Extreme score' }),
    },
  };
}
```

- [ ] **Step 4: Add and test the API route**

```js
export async function GET() {
  const csvText = await readFile(join(process.cwd(), 'public/data/phone-metrics-pricing.csv'), 'utf8');
  return NextResponse.json({ success: true, data: buildBenchmarkGraphData(csvText) });
}
```

Run: `bun run test -- tests/benchmarkGraphData.test.js tests/benchmarks-route.test.js`

Expected: PASS with duplicate removal, safe line groups, real source URL fields, and an empty GPU dataset.

- [ ] **Step 5: Commit**

```bash
git add public/data/phone-metrics-pricing.csv lib/benchmarkGraphData.js app/api/benchmarks/route.js tests/benchmarkGraphData.test.js tests/benchmarks-route.test.js
git commit -m "feat: serve normalized benchmark graph data"
```

### Task 2: Render company-coloured metric plots in the leaderboard

**Files:**
- Create: `components/BenchmarkScatterPlot.jsx`
- Modify: `components/LeaderboardStage.jsx`
- Modify: `app/page.js`
- Modify: `app/globals.css`
- Create: `tests/BenchmarkScatterPlot.test.jsx`
- Modify: `tests/LeaderboardStage.test.jsx`
- Modify: `tests/Dashboard.test.jsx`

**Interfaces:**
- Consumes the Task 1 `metrics` object and renders `BenchmarkScatterPlot({ metric, theme })`.
- `metric.series` draws muted connecting lines; `metric.points` render as individual brand-coloured dots.
- `LeaderboardStage` accepts `benchmarkData`, `benchmarkLoading`, and `benchmarkError` in addition to its existing props.

- [ ] **Step 1: Write failing UI tests**

```jsx
it('renders real brand-coloured points and a same-family connecting series', () => {
  render(<BenchmarkScatterPlot metric={cpuMetric} />);
  expect(screen.getByLabelText('CPU price versus performance chart')).toBeInTheDocument();
  expect(screen.getByText('Galaxy S25')).toBeInTheDocument();
});

it('explains an unavailable GPU metric without a fabricated chart', () => {
  render(<BenchmarkScatterPlot metric={gpuMetric} />);
  expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run: `bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx`

Expected: FAIL because the graph component and benchmark request do not exist.

- [ ] **Step 3: Implement a responsive Chart.js scatter plot and table**

```jsx
export default function BenchmarkScatterPlot({ metric }) {
  if (!metric.points.length) return <section className="graph-empty-state">3DMark data is not available yet.</section>;
  return <section aria-label={`${metric.label} price versus performance chart`}>
    <Scatter data={toChartData(metric)} options={chartOptions(metric)} />
    <BenchmarkPointTable points={metric.points} />
  </section>;
}
```

- [ ] **Step 4: Wire live benchmark data into the page**

```js
async function requestBenchmarks() {
  const response = await fetch('/api/benchmarks');
  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch benchmark data');
  return json.data;
}
```

The page fetches benchmark data alongside the existing device table and gives `LeaderboardStage` the metric data, loading state, and error state.

- [ ] **Step 5: Run the focused UI suite**

Run: `bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx`

Expected: PASS with chart labels, safe GPU empty state, metric-tab updates, and the existing table request behavior intact.

- [ ] **Step 6: Commit**

```bash
git add components/BenchmarkScatterPlot.jsx components/LeaderboardStage.jsx app/page.js app/globals.css tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx tests/Dashboard.test.jsx
git commit -m "feat: render real benchmark price charts"
```

### Task 3: Verify the real-data experience

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents `bun run dev` and identifies `phone-metrics-pricing.csv` as the plot source.

- [ ] **Step 1: Add a concise data-source note**

```md
The leaderboard reads manually reviewed benchmark data from `public/data/phone-metrics-pricing.csv`. CPU and AI are available when present; GPU remains empty until 3DMark data is supplied.
```

- [ ] **Step 2: Run complete checks**

Run: `bun install --frozen-lockfile && bun run test && bun run lint && bun run build`

Expected: zero test failures, zero lint errors, and a successful production build.

- [ ] **Step 3: Inspect the running dark and light views**

Open `http://localhost:3001/`, select CPU, AI, AnTuTu, and GPU, then toggle the theme. Confirm chart dots, family lines, legend, empty state, and table are legible without clipping.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: explain real benchmark graph data"
```
