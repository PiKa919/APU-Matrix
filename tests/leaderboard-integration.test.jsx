import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createChartScene } from '@tanstack/charts';
import Dashboard from '../app/page.js';
import LeaderboardStage from '@/components/LeaderboardStage';
import * as chartDefinition from '@/lib/benchmarkChartDefinition';
import { createBenchmarkChartDefinition } from '@/lib/benchmarkChartDefinition';

vi.mock('@/components/HeroProcessorScene', () => ({
  default: () => <div aria-label="Animated processor lattice" role="img" />,
}));

function point(index, overrides = {}) {
  return {
    id: overrides.id || `phone-${index}`,
    phoneName: overrides.phoneName || `Galaxy S${25 + index}`,
    phoneBrand: overrides.phoneBrand || 'Samsung',
    x: overrides.x ?? 9000 - index * 10,
    priceInr: overrides.priceInr ?? 79999 + index * 100,
    details: overrides.details || { cpuGeekbench6SingleCore: 2200 - index, processorName: 'Snapdragon 8 Elite' },
    ...overrides,
  };
}

const cpuPoints = [
  ...Array.from({ length: 25 }, (_, index) => point(index)),
  point(25, {
    id: 'pixel-9',
    phoneName: 'Pixel 9',
    phoneBrand: 'Google',
    details: { cpuGeekbench6SingleCore: 1914, processorName: 'Tensor G4' },
  }),
];
const benchmarkData = {
  metrics: {
    cpu: {
      label: 'Geekbench 6 multi-core',
      xLabel: 'Geekbench 6 multi-core',
      points: cpuPoints,
      series: [{ id: 'Samsung:Galaxy S25', points: cpuPoints.slice(0, 3) }],
    },
    ai: {
      label: 'Geekbench AI quantized score',
      xLabel: 'Geekbench AI quantized score',
      points: [point(1, { id: 'pixel-9', phoneName: 'Pixel 9', phoneBrand: 'Google', details: { aiBackend: 'NNAPI', aiAccelerator: 'NPU', aiPrecision: 'Quantized', processorName: 'Tensor G4' }, x: 7600 })],
      series: [],
    },
    antutu: {
      label: 'AnTuTu score',
      xLabel: 'AnTuTu score',
      points: [point(2, { id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', details: { processorName: 'A18' }, x: 1800000 })],
      series: [],
    },
    gpu: { label: '3DMark Wild Life Extreme score', points: [], series: [] },
  },
};

const deviceData = [{
  id: 's25',
  phoneName: 'Galaxy S25',
  processorName: 'Snapdragon 8 Elite',
  antutuScore: 1800000,
  plottedPrice: { normalizedINR: 79999, priceType: 'current' },
}];

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

function response(data, success = true) {
  return Promise.resolve({ json: () => Promise.resolve(success ? { success: true, data } : { success: false, error: data }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('leaderboard release integration', () => {
  it('announces loading through a polite status while requests are pending', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    render(<Dashboard />);

    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Collecting current device data');
    expect(screen.getByText('Loading current device data').closest('[role="status"]')).toBeInTheDocument();
  });

  it('exposes errors and retries both data sources after both requests fail', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => response('Device data unavailable', false))
      .mockImplementationOnce(() => response('Benchmark data unavailable', false))
      .mockImplementationOnce(() => response(deviceData))
      .mockImplementationOnce(() => response(benchmarkData));
    vi.stubGlobal('fetch', fetchMock);

    render(<Dashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Device data unavailable');
    expect(screen.getByText('Benchmark data unavailable: Benchmark data unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }));

    await waitFor(() => expect(screen.getByRole('table', { name: 'Current device data' })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mounts only the selected populated chart and keeps GPU as an honest empty state', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);

    expect(screen.getAllByRole('img', { name: 'CPU price versus performance chart' })).toHaveLength(1);
    expect(screen.getByRole('figure', { name: 'CPU price versus performance chart' })).toHaveTextContent('not trend or regression lines');

    fireEvent.click(screen.getByRole('button', { name: 'AI' }));
    expect(screen.getAllByRole('img', { name: 'AI price versus performance chart' })).toHaveLength(1);
    expect(screen.getByRole('figure', { name: 'AI price versus performance chart' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'AnTuTu' }));
    expect(screen.getAllByRole('img', { name: 'AnTuTu price versus performance chart' })).toHaveLength(1);
    expect(screen.getByRole('figure', { name: 'AnTuTu price versus performance chart' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'GPU' }));
    expect(screen.queryAllByTestId('active-tanstack-chart')).toHaveLength(0);
    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
  });

  it('resets a zero-result filter state and returns the selected metric data', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), { target: { value: 'Samsung' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Processor' }), { target: { value: 'Tensor G4' } });

    expect(screen.getByRole('status', { name: 'Benchmark results' })).toHaveTextContent('No benchmark points match');
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByRole('table', { name: 'Benchmark points' })).toHaveTextContent('Galaxy S25');
  });

  it('renders a keyboard-focusable SVG with the shared definition tooltip payload', () => {
    const pointFixture = cpuPoints[0];
    const definition = createBenchmarkChartDefinition({ metric: benchmarkData.metrics.cpu, theme: 'dark' });
    const definitionContent = definition.tooltip.content([{ datum: pointFixture }]);

    expect(definition.pointer).toBe(true);
    expect(definition.keyboard).toBe(true);
    expect(definition.focusRing).toBe(true);
    expect(definitionContent.title).toBe(pointFixture.phoneName);
    expect(definitionContent.rows).toEqual(expect.arrayContaining([
      { label: 'Single-core', value: '2,200' },
      { label: 'Processor', value: 'Snapdragon 8 Elite' },
    ]));

    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    const svg = screen.getByRole('img', { name: 'CPU price versus performance chart' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('tabindex', '0');
    expect(svg.querySelector('desc')).toHaveTextContent('not trend or regression lines');
    expect(screen.getByRole('complementary', { name: 'Benchmark point metadata' })).toHaveTextContent('Galaxy S25');
  });

  it('renders exact-generation sibling connector geometry in the TanStack scene', () => {
    const metric = benchmarkData.metrics.cpu;
    const definition = createBenchmarkChartDefinition({ metric, theme: 'dark' });
    const scene = createChartScene(definition, { width: 720, height: 420 });
    const connectorPoints = scene.points.filter((item) => item.markId === 'series-Samsung:Galaxy S25');

    expect(connectorPoints).toHaveLength(3);
    expect(connectorPoints.map((item) => item.datum.id)).toEqual(metric.series[0].points.map((item) => item.id));
    expect(new Set(connectorPoints.map((item) => `${item.x}:${item.y}`))).toHaveLength(3);
  });

  it('does not rebuild the chart definition when table page, search, or sort changes', () => {
    const chartFactory = vi.spyOn(chartDefinition, 'createBenchmarkChartDefinition');
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    const initialCalls = chartFactory.mock.calls.length;
    const table = screen.getByRole('table', { name: 'Benchmark points' });

    fireEvent.click(screen.getByRole('button', { name: 'Next benchmark results' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search benchmark devices' }), { target: { value: 'Galaxy' } });
    fireEvent.click(within(table).getByRole('button', { name: /Brand/ }));

    expect(chartFactory).toHaveBeenCalledTimes(initialCalls);
  });
});
