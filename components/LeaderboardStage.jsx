'use client';

import { useState } from 'react';
import { Database, SlidersHorizontal } from 'lucide-react';

const METRICS = [
  { id: 'cpu', label: 'CPU', color: '#72d7f6' },
  { id: 'gpu', label: 'GPU', color: '#b695ff' },
  { id: 'ai', label: 'AI', color: '#60d6a1' },
  { id: 'antutu', label: 'AnTuTu', color: '#f7ad6a' },
];

export default function LeaderboardStage({ id = 'leaderboard' }) {
  const [metricId, setMetricId] = useState('cpu');
  const metric = METRICS.find((item) => item.id === metricId) ?? METRICS[0];
  const graphLabel = `${metric.label} benchmark graph awaiting normalized data`;

  return (
    <section id={id} className="leaderboard-stage" aria-labelledby="leaderboard-heading">
      <div className="section-kicker">Performance index</div>
      <div className="stage-heading-row">
        <div>
          <h2 id="leaderboard-heading">Leaderboard</h2>
          <p>Comparable CPU, GPU, AI, and AnTuTu views will appear after source normalization.</p>
        </div>
        <div className="stage-source-status" aria-label="Data collection status">
          <Database aria-hidden="true" size={15} />
          <span>Current table uses available AnTuTu and price data</span>
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

      <div className="graph-reserve" role="img" aria-label={graphLabel}>
        <div className="graph-axis graph-axis-y">Performance score</div>
        <div className="graph-axis graph-axis-x">Normalized benchmark metric</div>
        <div className="graph-reserve-copy">
          <span className="graph-reserve-eyebrow" style={{ color: metric.color }}>{metric.label} view</span>
          <strong>Awaiting normalized benchmark data</strong>
          <span>Weekly collection and source review are being prepared before ranking devices.</span>
        </div>
        <div className="graph-legend" aria-label="Future metric color legend">
          {METRICS.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}</span>)}
        </div>
      </div>
    </section>
  );
}
