'use client';

import { useState } from 'react';
import { Database, SlidersHorizontal } from 'lucide-react';
import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';

const METRICS = [
  { id: 'cpu', label: 'CPU', color: '#72d7f6' },
  { id: 'gpu', label: 'GPU', color: '#b695ff' },
  { id: 'ai', label: 'AI', color: '#60d6a1' },
  { id: 'antutu', label: 'AnTuTu', color: '#f7ad6a' },
];

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
  const metric = METRICS.find((item) => item.id === metricId) ?? METRICS[0];
  const sourceStatus = formatSourceStatus({ loading, error, lastUpdated });
  const selectedMetric = benchmarkData?.metrics?.[metric.id]
    ? { ...benchmarkData.metrics[metric.id], chartLabel: metric.label }
    : null;

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
              onClick={() => setMetricId(item.id)}
              style={{ '--metric-color': item.color }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="upcoming-filters" aria-label="Future filter availability">
          <SlidersHorizontal aria-hidden="true" size={14} />
          <span>Device filter: upcoming</span>
          <span>Processor filter: upcoming</span>
        </div>
      </div>

      {benchmarkLoading && <div className="graph-empty-state">Loading benchmark data…</div>}
      {!benchmarkLoading && benchmarkError && <div className="graph-empty-state">Benchmark data unavailable: {benchmarkError}</div>}
      {!benchmarkLoading && !benchmarkError && selectedMetric && <BenchmarkScatterPlot metric={selectedMetric} theme={theme} />}
      {!benchmarkLoading && !benchmarkError && !selectedMetric && <div className="graph-empty-state">Benchmark data has not been collected yet.</div>}
    </section>
  );
}
