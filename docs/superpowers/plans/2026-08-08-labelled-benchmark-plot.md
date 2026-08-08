# Labelled Benchmark Plot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the benchmark plot as a minimal, directly labelled leaderboard chart.

**Architecture:** Extend `BenchmarkScatterPlot` with a small Chart.js drawing plugin that renders each phone name and a compact price/brand line next to the actual scatter point. CSS removes excess card chrome while the accessible point table remains unchanged.

**Tech Stack:** React, Chart.js, Vitest, CSS.

## Global Constraints

- Place a visible model label beside every benchmark dot.
- Keep X as benchmark performance and Y as normalized INR price.
- Preserve generation-only series connections and company-coloured dots.
- Keep series lines visually quieter than labels and points.
- Do not replace the existing accessible table or tooltip behavior.

---

### Task 1: Render direct point labels and refine plot chrome

**Files:**
- Modify: `components/BenchmarkScatterPlot.jsx`
- Modify: `app/globals.css`
- Modify: `tests/BenchmarkScatterPlot.test.jsx`

**Interfaces:**
- Consumes: benchmark point fields `phoneName`, `phoneBrand`, `x`, and `priceInr`.
- Produces: a chart configuration whose custom plugin renders phone labels beside points.

- [ ] **Step 1: Write the failing tests**

```jsx
it('renders direct phone labels through the chart drawing plugin', () => {
  render(<BenchmarkScatterPlot metric={metric} />);
  const config = MockChart.mock.calls[0][1];
  expect(config.plugins.some((plugin) => plugin.id === 'benchmark-point-labels')).toBe(true);
  expect(config.data.datasets[0].data[0].phoneName).toBe('Galaxy S25');
});

it('keeps connecting series lines quieter than benchmark dots', () => {
  render(<BenchmarkScatterPlot metric={metricWithSeries} />);
  const config = MockChart.mock.calls[0][1];
  expect(config.data.datasets[1].borderWidth).toBeLessThan(config.data.datasets[0].pointRadius);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- tests/BenchmarkScatterPlot.test.jsx`

Expected: FAIL because no direct-label plugin exists.

- [ ] **Step 3: Add the minimal label plugin and visual hierarchy**

```jsx
const pointLabelPlugin = {
  id: 'benchmark-point-labels',
  afterDatasetsDraw(chart) {
    chart.data.datasets[0].data.forEach((point, index) => {
      const position = chart.getDatasetMeta(0).data[index].getProps(['x', 'y'], true);
      chart.ctx.fillStyle = brandColor(point.phoneBrand);
      chart.ctx.fillText(point.phoneName, position.x + 9, position.y - 8);
      chart.ctx.fillText(`${point.phoneBrand} · ${formatPrice(point.priceInr)}`, position.x + 9, position.y + 8);
    });
  },
};
```

Use alternate vertical offsets for nearby points, register the plugin with the chart instance, reduce line emphasis, and soften plot/card CSS.

- [ ] **Step 4: Run focused tests and lint**

Run: `bun run test -- tests/BenchmarkScatterPlot.test.jsx tests/LeaderboardStage.test.jsx && bun run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BenchmarkScatterPlot.jsx app/globals.css tests/BenchmarkScatterPlot.test.jsx
git commit -m "feat: label benchmark chart points"
```
