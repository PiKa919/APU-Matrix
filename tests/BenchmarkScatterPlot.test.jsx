import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import * as chartDefinition from '@/lib/benchmarkChartDefinition';
import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';

vi.mock('@tanstack/react-charts', () => ({
  Chart: ({ definition, ariaLabel, ariaDescription }) => (
    <div data-testid="tanstack-chart" aria-label={ariaLabel} aria-description={ariaDescription}>
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

  it('keeps CPU tooltip metadata in the adjacent HTML path', () => {
    render(<BenchmarkScatterPlot metric={cpuMetric} />);

    expect(screen.getByLabelText('Benchmark point metadata')).toHaveTextContent('Single-core: 1,914');
    expect(screen.getByLabelText('Benchmark point metadata')).toHaveTextContent('Processor: Snapdragon 8 Elite');
  });

  it('keeps AI backend, accelerator, precision, and processor metadata available', () => {
    render(<BenchmarkScatterPlot metric={aiMetric} />);
    const metadata = screen.getByLabelText('Benchmark point metadata');

    expect(metadata).toHaveTextContent('Backend: NNAPI');
    expect(metadata).toHaveTextContent('Accelerator: NPU');
    expect(metadata).toHaveTextContent('Precision: Quantized');
    expect(metadata).toHaveTextContent('Processor: Tensor G4');
  });

  it('does not rebuild the chart definition when only the table sort changes', () => {
    const factory = vi.spyOn(chartDefinition, 'createBenchmarkChartDefinition');
    const points = [
      cpuMetric.points[0],
      { ...cpuMetric.points[0], id: 's25-plus', phoneName: 'Galaxy S25+', phoneBrand: 'Samsung', x: 9400, priceInr: 99999 },
    ];
    const { rerender } = render(<BenchmarkScatterPlot metric={{ ...cpuMetric, points }} />);
    const initialCalls = factory.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Brand' }));
    rerender(<BenchmarkScatterPlot metric={{
      ...cpuMetric,
      points: points.map((point) => ({ ...point })),
    }} />);

    expect(factory).toHaveBeenCalledTimes(initialCalls);
    factory.mockRestore();
  });

  it('explains an unavailable GPU metric without mounting a chart', () => {
    render(<BenchmarkScatterPlot metric={gpuMetric} />);

    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('tanstack-chart')).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Benchmark points' })).not.toBeInTheDocument();
  });
});
