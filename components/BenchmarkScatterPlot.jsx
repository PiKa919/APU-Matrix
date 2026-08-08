'use client';

import { useEffect, useRef } from 'react';
import { Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, ScatterController, Tooltip } from 'chart.js';

ChartJS.register(LinearScale, LineController, LineElement, PointElement, ScatterController, Tooltip);

const BRAND_COLORS = { Apple: '#34d399', Samsung: '#60a5fa', Google: '#f472b6', OnePlus: '#fb923c', Xiaomi: '#a78bfa', POCO: '#c084fc', vivo: '#2dd4bf', iQOO: '#38bdf8', OPPO: '#f97316', realme: '#fbbf24', HONOR: '#818cf8', Motorola: '#4ade80', 'Red Magic': '#f87171', Nothing: '#e879f9', Asus: '#facc15', TECNO: '#06b6d4', Infinix: '#fb7185', Huawei: '#ef4444', Nubia: '#a3e635', Lenovo: '#22d3ee', ZTE: '#d946ef' };
const DEFAULT_COLOR = '#94a3b8';
const CHART_THEMES = {
  dark: { background: '#0b1020', text: '#cbd5e1', grid: 'rgba(148, 163, 184, 0.18)', tooltipBackground: '#111827', tooltipBorder: '#334155' },
  light: { background: '#ffffff', text: '#334155', grid: 'rgba(100, 116, 139, 0.24)', tooltipBackground: '#f8fafc', tooltipBorder: '#cbd5e1' },
};
const chartBackgroundPlugin = {
  id: 'benchmark-chart-background',
  beforeDraw(chart, _args, options) {
    if (!chart.chartArea) return;
    const { left, top, right, bottom } = chart.chartArea;
    chart.ctx.save();
    chart.ctx.fillStyle = options.color;
    chart.ctx.fillRect(left, top, right - left, bottom - top);
    chart.ctx.restore();
  },
};

function brandColor(brand) { return BRAND_COLORS[brand] || DEFAULT_COLOR; }
function formatPrice(value) { return typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : 'N/A'; }

function toChartData(metric) {
  const datasets = [{
    type: 'scatter', label: 'Benchmark points', parsing: false,
    data: metric.points.map((point) => ({ x: point.x, y: point.priceInr, ...point })),
    pointRadius: 5, pointHoverRadius: 7, pointBorderWidth: 1,
    pointBackgroundColor: (context) => brandColor(context.raw?.phoneBrand),
    pointBorderColor: (context) => brandColor(context.raw?.phoneBrand),
  }];
  metric.series.forEach((series) => datasets.push({
    type: 'line', label: series.id.replace(':', ' / '), parsing: false,
    data: series.points.map((point) => ({ x: point.x, y: point.priceInr })),
    borderColor: 'rgba(148, 163, 184, 0.48)', borderWidth: 1.5, pointRadius: 0, tension: 0,
  }));
  return { datasets };
}

function BenchmarkPointTable({ points }) {
  return <div className="benchmark-table-wrap"><table aria-label="Benchmark points">
    <thead><tr><th>Device</th><th>Brand</th><th>Performance</th><th>Price</th></tr></thead>
    <tbody>{points.map((point) => <tr key={point.id}><td>{point.phoneName}</td><td>{point.phoneBrand || 'Unknown'}</td><td>{point.x.toLocaleString('en-IN')}</td><td>{formatPrice(point.priceInr)}</td></tr>)}</tbody>
  </table></div>;
}

export default function BenchmarkScatterPlot({ metric, theme = 'dark' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const chartTheme = CHART_THEMES[theme] || CHART_THEMES.dark;

  useEffect(() => {
    if (!metric.points.length || !canvasRef.current) return undefined;
    chartRef.current?.destroy();
    chartRef.current = new ChartJS(canvasRef.current.getContext('2d'), {
      type: 'scatter', data: toChartData(metric), plugins: [chartBackgroundPlugin], options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: metric.xLabel || metric.label, color: chartTheme.text }, ticks: { color: chartTheme.text }, grid: { color: chartTheme.grid } },
          y: { title: { display: true, text: 'Price (INR)', color: chartTheme.text }, ticks: { color: chartTheme.text }, grid: { color: chartTheme.grid } },
        },
        plugins: { legend: { display: false }, 'benchmark-chart-background': { color: chartTheme.background }, tooltip: {
          backgroundColor: chartTheme.tooltipBackground, borderColor: chartTheme.tooltipBorder, borderWidth: 1,
          titleColor: chartTheme.text, bodyColor: chartTheme.text,
          callbacks: {
          title: (items) => items[0]?.raw?.phoneName || '',
          label: (item) => [`Performance: ${item.raw.x.toLocaleString('en-IN')}`, `Price: ${formatPrice(item.raw.y)}`, `Brand: ${item.raw.phoneBrand || 'Unknown'}`],
        } } },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [metric, theme, chartTheme]);

  const emptyLabel = metric.label.startsWith('3DMark') ? '3DMark' : metric.label;
  if (!metric.points.length) return <section className="graph-empty-state">{emptyLabel} data is not available yet.</section>;
  return <section className="benchmark-graph" aria-label={`${metric.chartLabel || metric.label} price versus performance chart`}>
    <div className="benchmark-canvas"><canvas ref={canvasRef} /></div>
    <BenchmarkPointTable points={metric.points} />
  </section>;
}
