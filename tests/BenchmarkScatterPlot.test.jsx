import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import * as chartDefinition from '@/lib/benchmarkChartDefinition';
import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';
import BenchmarkPointTable from '@/components/BenchmarkPointTable';

vi.mock('@tanstack/react-charts', () => ({
  Chart: ({ definition, ariaLabel, ariaDescription, height }) => (
    <div data-testid="tanstack-chart" aria-label={ariaLabel} aria-description={ariaDescription} data-height={height}>
      {definition.marks?.map((mark, index) => <span key={`${index}`} data-mark={index}>{mark.data?.length ?? 0}</span>)}
    </div>
  ),
}));

const cpuMetric = {
  id: 'cpu',
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
      details: { cpuGeekbench6SingleCore: 1914, processorName: 'Snapdragon 8 Elite' },
      sourceUrl: 'https://example.com/s25',
    },
  ],
  series: [],
};

const aiMetric = {
  id: 'ai',
  chartLabel: 'AI',
  label: 'Geekbench AI quantized score',
  xLabel: 'Geekbench AI quantized score',
  points: [{
    ...cpuMetric.points[0],
    id: 'pixel-9-pro',
    phoneName: 'Pixel 9 Pro',
    phoneBrand: 'Google',
    x: 8128,
    details: {
      aiBackend: 'NNAPI',
      aiAccelerator: 'NPU',
      aiPrecision: 'Quantized',
      processorName: 'Tensor G4',
    },
  }],
  series: [],
};

const gpuMetric = {
  id: 'gpu',
  label: '3DMark Wild Life Extreme score',
  points: [],
  series: [],
};

describe('BenchmarkScatterPlot', () => {
  it('renders a caption and accessible TanStack chart description', () => {
    render(<BenchmarkScatterPlot metric={cpuMetric} />);

    expect(screen.getByRole('figure', { name: 'CPU price versus performance chart' })).toBeInTheDocument();
    expect(screen.getByText(/Geekbench 6 multi-core.*sibling variants/i)).toBeInTheDocument();
    expect(screen.getByTestId('tanstack-chart')).toHaveAttribute('aria-description', expect.stringContaining('sibling variants'));
  });

  it('keeps the chart accessible summary without duplicating point metadata in the page DOM', () => {
    render(<BenchmarkScatterPlot metric={cpuMetric} />);

    expect(screen.getByTestId('tanstack-chart')).toHaveAttribute('aria-description', expect.stringContaining('1 benchmark point'));
    expect(screen.queryByLabelText('Benchmark point metadata')).not.toBeInTheDocument();
  });

  it('does not render a metadata node for every point in a dense metric', () => {
    const points = Array.from({ length: 113 }, (_, index) => ({
      ...cpuMetric.points[0],
      id: `phone-${index}`,
      phoneName: `Phone ${index}`,
      x: 8000 + index,
    }));

    render(<BenchmarkScatterPlot metric={{ ...cpuMetric, points }} />);

    expect(screen.getByTestId('tanstack-chart')).toHaveAttribute('aria-description', expect.stringContaining('113 benchmark points'));
    expect(screen.queryByLabelText('Benchmark point metadata')).not.toBeInTheDocument();
  });

  it('keeps AI compatibility metadata in the chart accessible summary', () => {
    render(<BenchmarkScatterPlot metric={aiMetric} />);
    const chart = screen.getByTestId('tanstack-chart');

    expect(chart).toHaveAttribute('aria-description', expect.stringContaining('1 benchmark point'));
    expect(screen.queryByLabelText('Benchmark point metadata')).not.toBeInTheDocument();
  });

  it('keeps the chart host height aligned with the responsive canvas fallback', () => {
    render(<BenchmarkScatterPlot metric={cpuMetric} />);

    expect(screen.getByTestId('tanstack-chart')).toHaveAttribute('data-height', '384');
  });

  it('does not rebuild the chart definition when only the table sort changes', () => {
    const factory = vi.spyOn(chartDefinition, 'createBenchmarkChartDefinition');
    const points = [
      cpuMetric.points[0],
      { ...cpuMetric.points[0], id: 's25-plus', phoneName: 'Galaxy S25+', phoneBrand: 'Samsung', x: 9400, priceInr: 99999 },
    ];
    const renderWithTable = (metric) => <>
      <BenchmarkScatterPlot metric={metric} />
      <BenchmarkPointTable points={metric.points} metricId="cpu" resetKey="cpu" />
    </>;
    const { rerender } = render(renderWithTable({ ...cpuMetric, points }));
    const initialCalls = factory.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Brand' }));
    rerender(renderWithTable({
      ...cpuMetric,
      points: points.map((point) => ({ ...point })),
    }));

    expect(factory).toHaveBeenCalledTimes(initialCalls);
    factory.mockRestore();
  });

  it('explains an unavailable GPU metric without mounting a chart', () => {
    render(<BenchmarkScatterPlot metric={gpuMetric} />);

    expect(screen.getByRole('status', { name: 'Benchmark availability' })).toHaveTextContent('3DMark data is not available yet.');
    expect(screen.queryByTestId('tanstack-chart')).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Benchmark points' })).not.toBeInTheDocument();
  });
});
