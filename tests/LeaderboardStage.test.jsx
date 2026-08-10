import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import LeaderboardStage from '@/components/LeaderboardStage';

vi.mock('@/components/BenchmarkScatterPlot', async () => {
  const actual = await vi.importActual('@/components/BenchmarkScatterPlot');
  return { ...actual, default: vi.fn(actual.default) };
});

import BenchmarkScatterPlot from '@/components/BenchmarkScatterPlot';

describe('LeaderboardStage', () => {
  const benchmarkData = {
    metrics: {
      cpu: {
        label: 'Geekbench 6 multi-core',
        points: [
          { id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', deviceFamily: 'Galaxy S', x: 9200, priceInr: 79999, details: { cpuGeekbench6SingleCore: 2300, processorName: 'Snapdragon 8 Elite' }, series: [] },
          { id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', deviceFamily: 'iPhone', x: 8200, priceInr: 69999, details: { cpuGeekbench6SingleCore: 2200, processorName: 'A18' }, series: [] },
        ],
        series: [],
      },
      gpu: { label: '3DMark Wild Life Extreme score', points: [], series: [] },
      ai: {
        label: 'Geekbench AI quantized score',
        points: [
          { id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', x: 1400, priceInr: 79999, details: { aiBackend: 'Geekbench AI', aiAccelerator: 'Hexagon', aiPrecision: 'quantized', processorName: 'Snapdragon 8 Elite' } },
          { id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', x: 1300, priceInr: 69999, details: { aiBackend: 'Core ML', aiAccelerator: 'Neural Engine', aiPrecision: 'quantized', processorName: 'A18' } },
        ],
        series: [],
      },
      antutu: {
        label: 'AnTuTu score',
        points: [
          { id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', x: 1800000, priceInr: 79999, details: { processorName: 'Snapdragon 8 Elite' } },
          { id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', x: 1700000, priceInr: 69999, details: { processorName: 'A18' } },
        ],
        series: [],
      },
    },
  };

  it('starts on CPU and renders the API-backed graph', () => {
    render(<LeaderboardStage id="leaderboard" benchmarkData={benchmarkData} />);

    expect(screen.getByRole('button', { name: 'CPU' })).toHaveAttribute('aria-pressed', 'true');
    const figure = screen.getByRole('figure', { name: 'CPU price versus performance chart' });
    expect(figure).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Benchmark points' });
    expect(table).toHaveTextContent('Galaxy S25');
    expect(figure).not.toContainElement(table);
    expect(screen.getByRole('combobox', { name: 'Brand' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Processor' })).toBeInTheDocument();
  });

  it('filters CPU by brand and processor and derives options from CPU points', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);

    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A18' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'Snapdragon 8 Elite' } });

    expect(within(screen.getByRole('table', { name: 'Benchmark points' })).getByText('Galaxy S25')).toBeInTheDocument();
    expect(screen.queryByText('iPhone 16')).not.toBeInTheDocument();
  });

  it('rebuilds sibling series after filtering and drops connectors with one visible variant', () => {
    const siblingPoints = [
      { id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', x: 9200, priceInr: 79999, details: { processorName: 'Snapdragon 8 Elite' } },
      { id: 's25-plus', phoneName: 'Galaxy S25+', phoneBrand: 'Samsung', x: 9400, priceInr: 89999, details: { processorName: 'Snapdragon 8 Elite' } },
      { id: 's25-ultra', phoneName: 'Galaxy S25 Ultra', phoneBrand: 'Samsung', x: 9600, priceInr: 109999, details: { processorName: 'Tensor Test Fixture' } },
    ];
    const data = {
      ...benchmarkData,
      metrics: {
        ...benchmarkData.metrics,
        cpu: { ...benchmarkData.metrics.cpu, points: siblingPoints, series: [{ id: 'Samsung:Galaxy S25', points: siblingPoints }] },
      },
    };

    render(<LeaderboardStage benchmarkData={data} />);

    expect(BenchmarkScatterPlot.mock.calls.at(-1)[0].metric.series[0].points).toHaveLength(3);
    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'Tensor Test Fixture' } });

    const latestMetric = BenchmarkScatterPlot.mock.calls.at(-1)[0].metric;
    expect(latestMetric.points.map((point) => point.phoneName)).toEqual(['Galaxy S25 Ultra']);
    expect(latestMetric.series).toEqual([]);
  });

  it('shows data-driven AnTuTu filters and applies them to the graph and table', () => {
    const antutuPoints = [
      { id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', x: 1450000, priceInr: 79999, details: { processorName: 'A18' } },
      { id: 'galaxy-s25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', x: 1800000, priceInr: 69999, details: { processorName: 'Snapdragon 8 Elite' } },
      { id: 'pixel-9', phoneName: 'Pixel 9', phoneBrand: 'Google', x: 1250000, priceInr: 59999, details: { processorName: 'Tensor G4' } },
    ];
    render(<LeaderboardStage benchmarkData={{ ...benchmarkData, metrics: { ...benchmarkData.metrics, antutu: { label: 'AnTuTu score', points: antutuPoints, series: [] } } }} />);

    fireEvent.click(screen.getByRole('button', { name: 'AnTuTu' }));

    expect(screen.getByRole('combobox', { name: 'Brand' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Processor' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Samsung' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Snapdragon 8 Elite' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4);

    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(within(screen.getByRole('table', { name: 'Benchmark points' })).getByText('Galaxy S25')).toBeInTheDocument();
    expect(screen.queryByText('iPhone 16')).not.toBeInTheDocument();
    expect(screen.queryByText('Pixel 9')).not.toBeInTheDocument();
    expect(screen.getByRole('figure', { name: 'AnTuTu price versus performance chart' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'Snapdragon 8 Elite' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toHaveTextContent('Galaxy S25');
  });

  it('exposes all AI compatibility filters and applies combined filtering', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(screen.getByRole('combobox', { name: 'Backend' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Accelerator' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Precision' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Core ML' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'Snapdragon 8 Elite' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Backend' }), { target: { value: 'Geekbench AI' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Accelerator' }), { target: { value: 'Hexagon' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Precision' }), { target: { value: 'quantized' } });

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toHaveTextContent('Galaxy S25');
    expect(screen.queryByText('iPhone 16')).not.toBeInTheDocument();
  });

  it('offers a reset path for zero-result combinations', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'A18' } });

    expect(screen.getByRole('status', { name: 'Benchmark results' })).toHaveTextContent('No benchmark points match');
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toHaveTextContent('Galaxy S25');
  });

  it('resets the complete filter object when switching metrics', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(screen.getByRole('combobox', { name: 'Brand' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Processor' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Backend' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Accelerator' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Precision' })).toHaveValue('all');
  });

  it('updates the graph when a metric is selected', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(screen.getByRole('button', { name: 'AI' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('figure', { name: 'AI price versus performance chart' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Backend' })).toBeInTheDocument();
  });

  it('renders the GPU empty state from live benchmark data', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.click(screen.getByRole('button', { name: 'GPU' }));

    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
  });

  it('politely announces that current device data is being collected', () => {
    render(<LeaderboardStage loading error={null} lastUpdated={null} />);

    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Collecting current device data');
  });

  it('politely announces when current device data was last updated', () => {
    render(<LeaderboardStage loading={false} error={null} lastUpdated={new Date('2026-08-08T10:15:00')} />);

    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Current device data updated');
  });

  it('announces unavailable data instead of claiming current data after an error', () => {
    render(<LeaderboardStage loading={false} error="Device data unavailable" lastUpdated={new Date('2026-08-08T10:15:00')} />);

    const status = screen.getByRole('status', { name: 'Leaderboard data status' });
    expect(status).toHaveTextContent('Device data unavailable');
    expect(status).not.toHaveTextContent('Current device data');
  });

  it('shows a neutral empty state before benchmark data is available', () => {
    render(<LeaderboardStage />);

    expect(screen.getByText('Benchmark data has not been collected yet.')).toBeInTheDocument();
  });
});
