'use client';

import { useMemo, useState } from 'react';
import { Database, SlidersHorizontal } from 'lucide-react';
import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';
import BenchmarkPointTable from '@/components/BenchmarkPointTable';

const METRICS = [
  { id: 'cpu', label: 'CPU', color: '#72d7f6' },
  { id: 'gpu', label: 'GPU', color: '#b695ff' },
  { id: 'ai', label: 'AI', color: '#60d6a1' },
  { id: 'antutu', label: 'AnTuTu', color: '#f7ad6a' },
];

const INITIAL_FILTERS = Object.freeze({
  brand: 'all',
  processor: 'all',
  backend: 'all',
  accelerator: 'all',
  precision: 'all',
});

const FILTER_FIELDS = {
  brand: { label: 'Brand', value: (point) => point.phoneBrand },
  processor: { label: 'Processor', value: (point) => point.details?.processorName },
  backend: { label: 'Backend', value: (point) => point.details?.aiBackend },
  accelerator: { label: 'Accelerator', value: (point) => point.details?.aiAccelerator },
  precision: { label: 'Precision', value: (point) => point.details?.aiPrecision },
};

const AI_FILTER_KEYS = ['brand', 'processor', 'backend', 'accelerator', 'precision'];
const STANDARD_FILTER_KEYS = ['brand', 'processor'];

function formatSourceStatus({ loading, error, lastUpdated }) {
  if (error) return `Device data unavailable: ${error}`;
  if (loading) return 'Collecting current device data…';
  if (lastUpdated) {
    return `Current device data updated ${new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(lastUpdated)}`;
  }
  return 'Device data has not been collected yet.';
}

export default function LeaderboardStage({ id = 'leaderboard', loading = false, error = null, lastUpdated = null, benchmarkData = null, benchmarkLoading = false, benchmarkError = null, theme = 'dark' }) {
  const [metricId, setMetricId] = useState('cpu');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const metric = METRICS.find((item) => item.id === metricId) ?? METRICS[0];
  const sourceStatus = formatSourceStatus({ loading, error, lastUpdated });
  const rawMetric = benchmarkData?.metrics?.[metric.id] ?? null;

  const filterKeys = metricId === 'ai' ? AI_FILTER_KEYS : STANDARD_FILTER_KEYS;
  const filterOptions = useMemo(() => Object.fromEntries(filterKeys.map((key) => [key, [...new Set(
    (rawMetric?.points ?? []).map(FILTER_FIELDS[key].value).filter(Boolean),
  )].sort((first, second) => first.localeCompare(second))])), [filterKeys, rawMetric]);

  const selectedMetric = useMemo(() => {
    if (!rawMetric) return null;
    const matchesFilters = (point) => filterKeys.every((key) => {
      const selectedValue = filters[key];
      return selectedValue === 'all' || FILTER_FIELDS[key].value(point) === selectedValue;
    });
    const points = rawMetric.points.filter(matchesFilters);
    const series = rawMetric.series
      .map((seriesItem) => ({ ...seriesItem, points: seriesItem.points.filter(matchesFilters) }))
      .filter((seriesItem) => seriesItem.points.length > 1);
    return { ...rawMetric, id: metricId, chartLabel: metric.label, points, series };
  }, [filterKeys, filters, metric.label, metricId, rawMetric]);

  const hasActiveFilters = filterKeys.some((key) => filters[key] !== 'all');

  function selectMetric(nextMetricId) {
    setMetricId(nextMetricId);
    setFilters({ ...INITIAL_FILTERS });
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section id={id} className="leaderboard-stage" aria-labelledby="leaderboard-heading">
      <div className="section-kicker">Performance index</div>
      <div className="stage-heading-row">
        <div>
          <h2 id="leaderboard-heading">Leaderboard</h2>
          <p>Compare real benchmark scores and current prices across device families.</p>
        </div>
        <div className="stage-source-status" role="status" aria-live="polite" aria-label="Leaderboard data status">
          <Database aria-hidden="true" size={15} />
          <span>{sourceStatus}</span>
        </div>
      </div>

      <div className="stage-controls" aria-label="Leaderboard metric">
        <div className="metric-tabs" role="group" aria-label="Metric selection">
          {METRICS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === metricId}
              className="metric-tab"
              onClick={() => selectMetric(item.id)}
              style={{ '--metric-color': item.color }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {rawMetric?.points?.length ? (
          <div className="benchmark-filters" aria-label={`${metric.label} filters`}>
            <SlidersHorizontal aria-hidden="true" size={14} />
            {filterKeys.map((key) => (
              <label key={key}>
                <span>{FILTER_FIELDS[key].label}</span>
                <select aria-label={FILTER_FIELDS[key].label} value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)}>
                  <option value="all">All {FILTER_FIELDS[key].label.toLowerCase()}s</option>
                  {(filterOptions[key] ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {benchmarkLoading && <div className="graph-empty-state">Loading benchmark data…</div>}
      {!benchmarkLoading && benchmarkError && <div className="graph-empty-state">Benchmark data unavailable: {benchmarkError}</div>}
      {!benchmarkLoading && !benchmarkError && selectedMetric && selectedMetric.points.length === 0 && hasActiveFilters && (
        <div className="graph-empty-state" role="status" aria-label="Benchmark results">
          <p>No benchmark points match the selected filters.</p>
          <button type="button" className="button button-secondary" onClick={() => setFilters({ ...INITIAL_FILTERS })}>Reset filters</button>
        </div>
      )}
      {!benchmarkLoading && !benchmarkError && selectedMetric && (selectedMetric.points.length > 0 || !hasActiveFilters) && (
        <BenchmarkScatterPlot metric={selectedMetric} theme={theme}>
          <BenchmarkPointTable
            points={selectedMetric.points}
            metricId={metricId}
            resetKey={`${metricId}:${filterKeys.map((key) => filters[key]).join('|')}`}
          />
        </BenchmarkScatterPlot>
      )}
      {!benchmarkLoading && !benchmarkError && !selectedMetric && <div className="graph-empty-state">Benchmark data has not been collected yet.</div>}
    </section>
  );
}
