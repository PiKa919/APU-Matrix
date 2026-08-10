import { defineChart, dot, lineY, text } from '@tanstack/charts';
import { tooltip } from '@tanstack/charts/tooltip';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

const DENSE_LABEL_COUNT = 10;
const BRAND_COLORS = {
  Apple: '#34d399',
  Samsung: '#60a5fa',
  Google: '#f472b6',
  OnePlus: '#fb923c',
  Motorola: '#4ade80',
  Xiaomi: '#a78bfa',
  POCO: '#c084fc',
  vivo: '#2dd4bf',
  OPPO: '#f97316',
  realme: '#fbbf24',
  HONOR: '#818cf8',
  Nothing: '#e879f9',
  Asus: '#facc15',
};
const DEFAULT_COLOR = '#94a3b8';
const THEMES = {
  dark: {
    foreground: '#cbd5e1',
    muted: '#94a3b8',
    grid: '#334155',
    background: '#0b1020',
    palette: Object.values(BRAND_COLORS),
  },
  light: {
    foreground: '#334155',
    muted: '#64748b',
    grid: '#cbd5e1',
    background: '#ffffff',
    palette: Object.values(BRAND_COLORS),
  },
};

function comparePoints(first, second) {
  return (second.x ?? Number.NEGATIVE_INFINITY) - (first.x ?? Number.NEGATIVE_INFINITY)
    || String(first.phoneName || '').localeCompare(String(second.phoneName || ''))
    || String(first.id || '').localeCompare(String(second.id || ''));
}

function pointId(point) {
  return String(point.id || `${point.phoneName}:${point.x}:${point.priceInr}`);
}

function sortedPoints(points = []) {
  return [...points].sort(comparePoints);
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-IN') : 'N/A';
}

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

function presentValue(value) {
  return value === null || value === undefined || value === '' ? null : String(value);
}

export function selectPersistentLabels(points = [], series = [], limit = 30) {
  const ordered = sortedPoints(points);
  if (ordered.length <= limit) return ordered;

  const selected = new Map(ordered.slice(0, DENSE_LABEL_COUNT).map((point) => [pointId(point), point]));
  for (const siblingSeries of series.filter((candidate) => (candidate?.points || []).length > 1)) {
    const siblingPoints = sortedPoints(siblingSeries?.points || []);
    for (const endpoint of [siblingPoints.at(-1), siblingPoints[0]]) {
      if (endpoint) selected.set(pointId(endpoint), endpoint);
    }
  }
  return ordered.filter((point) => selected.has(pointId(point)));
}

export function tooltipRows(point, metricId) {
  const details = point?.details || {};
  const fieldRows = {
    cpu: [
      ['Single-core', details.cpuGeekbench6SingleCore],
      ['Processor', details.processorName],
    ],
    ai: [
      ['Backend', details.aiBackend],
      ['Accelerator', details.aiAccelerator],
      ['Precision', details.aiPrecision],
      ['Processor', details.processorName],
    ],
    gpu: [
      ['FPS', details.gpuWildLifeExtremeFps],
      ['Processor', details.processorName],
    ],
    antutu: [['Processor', details.processorName]],
  }[metricId] || [];

  return fieldRows
    .map(([label, value]) => [label, presentValue(value)])
    .filter(([, value]) => value !== null)
    .map(([label, value]) => ({ label, value: typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) ? formatNumber(Number(value)) : value }));
}

function chartPointRows(point, metric) {
  return [
    { label: metric.xLabel || metric.label, value: formatNumber(point.x) },
    { label: 'Price', value: formatPrice(point.priceInr) },
    ...tooltipRows(point, metricIdFor(metric)),
  ];
}

function brandColor(brand) {
  return BRAND_COLORS[brand] || DEFAULT_COLOR;
}

function validSiblingSeries(series = []) {
  return series
    .map((siblingSeries) => ({
      ...siblingSeries,
      points: sortedPoints(siblingSeries.points || []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.priceInr)),
    }))
    .filter((siblingSeries) => siblingSeries.points.length > 1);
}

export function createBenchmarkChartDefinition({ metric, theme = 'dark' }) {
  const points = sortedPoints(metric?.points || []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.priceInr));
  const series = validSiblingSeries(metric?.series || []);
  const labels = selectPersistentLabels(points, series);
  const brands = [...new Set(points.map((point) => point.phoneBrand || 'Unknown'))];
  const themeTokens = THEMES[theme] || THEMES.dark;
  const metricId = metricIdFor(metric);

  return defineChart({
    marks: [
      ...series.map((siblingSeries) => lineY(siblingSeries.points, {
        id: `series-${siblingSeries.id}`,
        x: 'x',
        y: 'priceInr',
        key: 'id',
        stroke: (point) => brandColor(point.phoneBrand),
        strokeWidth: 1.5,
        points: false,
      })),
      dot(points, {
        id: 'benchmark-points',
        x: 'x',
        y: 'priceInr',
        key: 'id',
        color: 'phoneBrand',
        r: 5,
        stroke: themeTokens.background,
        strokeWidth: 1,
      }),
      text(labels, {
        id: 'benchmark-labels',
        x: 'x',
        y: 'priceInr',
        key: 'id',
        text: 'phoneName',
        fill: (point) => brandColor(point.phoneBrand),
        fontSize: 12,
        fontWeight: 600,
        anchor: 'start',
        dx: 8,
        dy: -8,
      }),
    ],
    x: {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: { label: metric?.xLabel || metric?.label || 'Performance' },
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: { label: 'Price (INR)' },
    },
    color: {
      scale: () => scaleOrdinal().domain(brands).range(brands.map(brandColor)),
    },
    theme: themeTokens,
    focusRing: true,
    pointer: true,
    keyboard: true,
    tooltip: {
      use: tooltip,
      content: (focusedPoints) => {
        const point = focusedPoints[0]?.datum;
        return point ? {
          title: point.phoneName,
          color: brandColor(point.phoneBrand),
          rows: chartPointRows(point, { ...metric, id: metricId }),
        } : { rows: [] };
      },
    },
  });
}
