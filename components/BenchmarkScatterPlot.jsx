'use client';

import { useMemo, useState } from 'react';
import { Chart } from '@tanstack/react-charts';
import * as chartDefinition from '@/lib/benchmarkChartDefinition';

function formatPrice(value) {
  return typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : 'N/A';
}

function metricIdFor(metric) {
  if (metric?.id) return metric.id;
  if (metric?.label?.startsWith('Geekbench AI')) return 'ai';
  if (metric?.label?.startsWith('AnTuTu')) return 'antutu';
  if (metric?.label?.startsWith('3DMark')) return 'gpu';
  return 'cpu';
}

function BenchmarkPointTable({ points }) {
  const [sort, setSort] = useState(null);
  const columns = [
    { key: 'brand', label: 'Brand', value: (point) => point.phoneBrand || 'Unknown' },
    { key: 'performance', label: 'Performance', value: (point) => point.x },
    { key: 'price', label: 'Price', value: (point) => point.priceInr },
  ];
  const sortedPoints = sort
    ? [...points].sort((first, second) => {
      const firstValue = columns.find((column) => column.key === sort.key).value(first);
      const secondValue = columns.find((column) => column.key === sort.key).value(second);
      const comparison = typeof firstValue === 'number'
        ? firstValue - secondValue
        : firstValue.localeCompare(secondValue);
      return sort.direction === 'asc' ? comparison : -comparison;
    })
    : points;
  const toggleSort = (key) => setSort((current) => ({
    key,
    direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  }));

  return <div className="benchmark-table-wrap"><table aria-label="Benchmark points">
    <thead><tr>
      <th>Device</th>
      {columns.map((column) => {
        const activeSort = sort?.key === column.key ? sort.direction : null;
        return <th key={column.key} aria-sort={activeSort === 'asc' ? 'ascending' : activeSort === 'desc' ? 'descending' : 'none'}>
          <button type="button" className="benchmark-sort-button" onClick={() => toggleSort(column.key)}>
            {column.label}<span aria-hidden="true">{activeSort === 'asc' ? ' ↑' : activeSort === 'desc' ? ' ↓' : ' ↕'}</span>
          </button>
        </th>;
      })}
    </tr></thead>
    <tbody>{sortedPoints.map((point) => <tr key={point.id}>
      <td>{point.phoneName}</td>
      <td>{point.phoneBrand || 'Unknown'}</td>
      <td>{typeof point.x === 'number' ? point.x.toLocaleString('en-IN') : 'N/A'}</td>
      <td>{formatPrice(point.priceInr)}</td>
    </tr>)}</tbody>
  </table></div>;
}

export default function BenchmarkScatterPlot({ metric, theme = 'dark' }) {
  const chartInputKey = chartDefinition.benchmarkChartInputKey(metric, theme);
  const definition = useMemo(
    () => chartDefinition.createBenchmarkChartDefinition({ metric, theme }),
    // The semantic key intentionally replaces object identity for equivalent metric objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartInputKey],
  );
  const metricId = metricIdFor(metric);
  const chartLabel = metric.chartLabel || metric.label;
  const chartDescription = `${metric.label || chartLabel} plotted against price in INR. Lines connect sibling variants within the same generation; they are not trend or regression lines.`;

  const metadata = useMemo(() => metric.points.map((point) => ({
    id: point.id,
    phoneName: point.phoneName,
    rows: [
      { label: metric.xLabel || metric.label, value: typeof point.x === 'number' ? point.x.toLocaleString('en-IN') : 'N/A' },
      { label: 'Price', value: formatPrice(point.priceInr) },
      ...chartDefinition.tooltipRows(point, metricId),
    ],
  })), [metric, metricId]);

  const emptyLabel = metric.label.startsWith('3DMark') ? '3DMark' : metric.label;
  if (!metric.points.length) return <section className="graph-empty-state">{emptyLabel} data is not available yet.</section>;

  return <figure className="benchmark-graph" aria-label={`${chartLabel} price versus performance chart`}>
    <figcaption>{chartDescription}</figcaption>
    <div className="benchmark-canvas" data-chart-theme={theme}>
      <Chart
        definition={definition}
        height={520}
        ariaLabel={`${chartLabel} price versus performance chart`}
        ariaDescription={chartDescription}
      />
    </div>
    <aside className="benchmark-point-metadata" aria-label="Benchmark point metadata">
      {metadata.map((item) => <div key={item.id}>
        <strong>{item.phoneName}</strong>
        <ul>{item.rows.map((row) => <li key={row.label}>{row.label}: {row.value}</li>)}</ul>
      </div>)}
    </aside>
    <BenchmarkPointTable points={metric.points} />
  </figure>;
}
