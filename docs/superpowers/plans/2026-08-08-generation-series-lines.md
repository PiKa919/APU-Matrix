# Generation-level Series Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw benchmark lines only between variants of one phone generation.

**Architecture:** Keep dot data unchanged. Replace broad `phoneBrand:deviceFamily` line grouping with a deterministic `phoneBrand:seriesKey` derived from `phoneName`; a key includes the model prefix and first generation number, excluding variant suffixes.

**Tech Stack:** JavaScript, Vitest, Next.js API route, Chart.js.

## Global Constraints

- Keep X as benchmark performance and Y as normalized INR price.
- Preserve company-coloured dots and existing API point payloads.
- Connect only sibling variants within a single phone generation.
- Do not infer a relationship when a reliable generation key cannot be created.

---

### Task 1: Derive generation-level line groups

**Files:**
- Modify: `lib/benchmarkGraphData.js`
- Modify: `tests/benchmarkGraphData.test.js`

**Interfaces:**
- Consumes: normalized points with `phoneName`, `phoneBrand`, and `deviceFamily`.
- Produces: `metrics.<id>.series`, where each `series.id` groups only sibling variants of one model generation.

- [ ] **Step 1: Write the failing test**

```js
it('connects only sibling variants within one phone generation', () => {
  const series = buildBenchmarkGraphData(seriesFixture).metrics.cpu.series;

  expect(series).toContainEqual(expect.objectContaining({
    id: 'Samsung:Galaxy S26',
    points: expect.arrayContaining([
      expect.objectContaining({ phoneName: 'Galaxy S26' }),
      expect.objectContaining({ phoneName: 'Galaxy S26+' }),
      expect.objectContaining({ phoneName: 'Galaxy S26 Ultra' }),
    ]),
  }));
  expect(series.map((item) => item.id)).not.toContain('Samsung:Galaxy S');
  expect(series.flatMap((item) => item.points.map((point) => point.phoneName))).not.toContain('Galaxy S25');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/benchmarkGraphData.test.js`

Expected: FAIL because the existing broad `Samsung:Galaxy S` family grouping includes distinct generations.

- [ ] **Step 3: Write minimal implementation**

```js
function seriesKey(point) {
  const match = point.phoneName.match(/^(.*?\b\d+)/);
  return match?.[1]?.trim() || null;
}

const key = seriesKey(point);
if (key && point.phoneBrand) {
  const id = `${point.phoneBrand}:${key}`;
  // Group only points with this same generation-level key.
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- tests/benchmarkGraphData.test.js tests/benchmarks-route.test.js`

Expected: PASS with the new generation-line test and existing API data assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/benchmarkGraphData.js tests/benchmarkGraphData.test.js
git commit -m "fix: group chart lines by phone generation"
```
