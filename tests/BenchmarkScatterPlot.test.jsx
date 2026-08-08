import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chart as ChartJS } from 'chart.js';
import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';

vi.mock('chart.js', () => {
  class MockChart {
    static register = vi.fn();
    static lastConfig = null;
    constructor(ctx, config) { MockChart.lastConfig = config; }
    destroy() {}
  }
  return { Chart: MockChart, LinearScale: {}, LineController: {}, LineElement: {}, PointElement: {}, ScatterController: {}, Tooltip: {} };
});

const cpuMetric = {
  chartLabel: 'CPU',
  label: 'Geekbench 6 multi-core',
  xLabel: 'Geekbench 6 multi-core',
  points: [
    {
      id: 's25',
      phoneName: 'Galaxy S25',
      phoneBrand: 'Samsung',
      deviceFamily: 'Galaxy S',
      x: 9200,
      priceInr: 79999,
      priceType: 'current',
      details: { processorName: 'Snapdragon 8 Elite' },
      sourceUrl: 'https://example.com/s25',
    },
  ],
  series: [],
};

const gpuMetric = {
  label: '3DMark Wild Life Extreme score',
  points: [],
  series: [],
};

describe('BenchmarkScatterPlot', () => {
  it('renders real brand-coloured points and a same-family connecting series', () => {
    const familyPoints = [
      cpuMetric.points[0],
      { ...cpuMetric.points[0], id: 's24', phoneName: 'Galaxy S24', x: 7800, priceInr: 59999 },
    ];
    render(<BenchmarkScatterPlot metric={{ ...cpuMetric, series: [{ id: 'Samsung:Galaxy S', points: familyPoints }] }} />);

    expect(screen.getByLabelText('CPU price versus performance chart')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S25')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toBeInTheDocument();
    expect(ChartJS.lastConfig.data.datasets[0].pointBackgroundColor({ raw: cpuMetric.points[0] })).toBe('#60a5fa');
    expect(ChartJS.lastConfig.data.datasets[1].label).toBe('Samsung / Galaxy S');
    expect(ChartJS.lastConfig.data.datasets[0].data[0]).toEqual(expect.objectContaining({ x: 9200, y: 79999 }));
    expect(ChartJS.lastConfig.data.datasets[1].data).toEqual([
      { x: 9200, y: 79999 },
      { x: 7800, y: 59999 },
    ]);
    expect(ChartJS.lastConfig.options.scales.x.title.text).toBe('Geekbench 6 multi-core');
    expect(ChartJS.lastConfig.options.scales.y.title.text).toBe('Price (INR)');
  });

  it('changes canvas-facing Chart.js colors for the supplied theme', () => {
    const { rerender } = render(<BenchmarkScatterPlot metric={cpuMetric} theme="dark" />);
    const dark = ChartJS.lastConfig;

    rerender(<BenchmarkScatterPlot metric={cpuMetric} theme="light" />);
    const light = ChartJS.lastConfig;

    expect(dark.options.scales.x.ticks.color).not.toBe(light.options.scales.x.ticks.color);
    expect(dark.options.scales.x.grid.color).not.toBe(light.options.scales.x.grid.color);
    expect(dark.options.plugins.tooltip.backgroundColor).not.toBe(light.options.plugins.tooltip.backgroundColor);
    expect(dark.options.plugins['benchmark-chart-background'].color).not.toBe(light.options.plugins['benchmark-chart-background'].color);
  });

  it('renders direct phone labels through the chart drawing plugin', () => {
    render(<BenchmarkScatterPlot metric={cpuMetric} />);

    expect(ChartJS.lastConfig.plugins.some((plugin) => plugin.id === 'benchmark-point-labels')).toBe(true);
    expect(ChartJS.lastConfig.data.datasets[0].data[0].phoneName).toBe('Galaxy S25');
  });

  it('keeps each secondary point label below its model name and inside the chart area', () => {
    const secondPoint = { ...cpuMetric.points[0], id: 's25-plus', phoneName: 'Galaxy S25+', x: 9300, priceInr: 99999 };
    render(<BenchmarkScatterPlot metric={{ ...cpuMetric, points: [cpuMetric.points[0], secondPoint] }} />);

    const labelPlugin = ChartJS.lastConfig.plugins.find((plugin) => plugin.id === 'benchmark-point-labels');
    const fillText = vi.fn();
    const context = {
      save: vi.fn(), restore: vi.fn(), fillText, measureText: vi.fn(() => ({ width: 80 })),
      set textBaseline(_value) {}, set font(_value) {}, set shadowColor(_value) {}, set shadowBlur(_value) {},
      set textAlign(_value) {}, set fillStyle(_value) {}, set globalAlpha(_value) {},
    };
    const chart = {
      ctx: context,
      chartArea: { left: 20, top: 20, right: 180, bottom: 180 },
      data: { datasets: [{ data: [cpuMetric.points[0], secondPoint] }] },
      getDatasetMeta: () => ({ data: [
        { getProps: () => ({ x: 25, y: 24 }) },
        { getProps: () => ({ x: 175, y: 176 }) },
      ] }),
    };

    labelPlugin.afterDatasetsDraw(chart, {}, {});

    expect(fillText).toHaveBeenNthCalledWith(1, 'Galaxy S25', expect.any(Number), expect.any(Number));
    expect(fillText).toHaveBeenNthCalledWith(2, 'Samsung · ₹79,999', expect.any(Number), expect.any(Number));
    expect(fillText.mock.calls[1][2]).toBeGreaterThan(fillText.mock.calls[0][2]);
    expect(fillText).toHaveBeenNthCalledWith(3, 'Galaxy S25+', expect.any(Number), expect.any(Number));
    expect(fillText).toHaveBeenNthCalledWith(4, 'Samsung · ₹99,999', expect.any(Number), expect.any(Number));
    expect(fillText.mock.calls[3][2]).toBeGreaterThan(fillText.mock.calls[2][2]);
    expect(fillText.mock.calls[0][1]).toBeGreaterThanOrEqual(chart.chartArea.left);
    expect(fillText.mock.calls[0][1]).toBeLessThanOrEqual(chart.chartArea.right);
    expect(fillText.mock.calls[3][2]).toBeLessThanOrEqual(chart.chartArea.bottom);
  });

  it('keeps connecting series lines quieter than benchmark dots', () => {
    const metricWithSeries = {
      ...cpuMetric,
      series: [{ id: 'Samsung:Galaxy S', points: [cpuMetric.points[0], { ...cpuMetric.points[0], id: 's24', phoneName: 'Galaxy S24', x: 7800, priceInr: 59999 }] }],
    };
    render(<BenchmarkScatterPlot metric={metricWithSeries} />);

    expect(ChartJS.lastConfig.data.datasets[1].borderWidth).toBeLessThan(ChartJS.lastConfig.data.datasets[0].pointRadius);
  });

  it('explains an unavailable GPU metric without a fabricated chart', () => {
    render(<BenchmarkScatterPlot metric={gpuMetric} />);

    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Benchmark points' })).not.toBeInTheDocument();
    expect(ChartJS.lastConfig).not.toBeNull();
  });
});
