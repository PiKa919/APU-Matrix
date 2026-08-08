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
    render(<BenchmarkScatterPlot metric={{ ...cpuMetric, series: [{ id: 'Samsung:Galaxy S', points: cpuMetric.points }] }} />);

    expect(screen.getByLabelText('CPU price versus performance chart')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S25')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toBeInTheDocument();
    expect(ChartJS.lastConfig.data.datasets[0].pointBackgroundColor({ raw: cpuMetric.points[0] })).toBe('#60a5fa');
    expect(ChartJS.lastConfig.data.datasets[1].label).toBe('Samsung / Galaxy S');
  });

  it('explains an unavailable GPU metric without a fabricated chart', () => {
    render(<BenchmarkScatterPlot metric={gpuMetric} />);

    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Benchmark points' })).not.toBeInTheDocument();
    expect(ChartJS.lastConfig).not.toBeNull();
  });
});
