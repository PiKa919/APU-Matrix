import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Dashboard from '../app/page.js';

vi.mock('@/components/HeroProcessorScene', () => ({
  default: () => <div aria-label="Animated processor lattice" role="img" />,
}));

const data = [{
  id: 'oneplus-15',
  phoneName: 'OnePlus 15',
  processorName: 'Snapdragon 8 Elite Gen 5',
  antutuScore: 3606895,
  plottedPrice: { normalizedINR: 54999, priceType: 'current' },
}];

const benchmarkData = {
  brands: ['Samsung'],
  metrics: {
    cpu: { label: 'Geekbench 6 multi-core', points: [{ id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', deviceFamily: 'Galaxy S', x: 9200, priceInr: 79999, details: {}, series: [] }], series: [] },
    gpu: { label: '3DMark Wild Life Extreme score', points: [], series: [] },
    ai: { label: 'Geekbench AI quantized score', points: [], series: [] },
    antutu: { label: 'AnTuTu score', points: [], series: [] },
  },
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve({
      json: () => Promise.resolve({ success: true, data: url === '/api/benchmarks' ? benchmarkData : data }),
    })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('composes the research homepage around the API-backed device table', async () => {
    render(<Dashboard />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('banner').closest('main')).toBeNull();
    expect(screen.getByLabelText('Devices coming soon')).toHaveTextContent('Coming soon');
    expect(screen.getByRole('link', { name: 'Explore leaderboard' })).toHaveAttribute('href', '#leaderboard');
    expect(await screen.findByRole('table', { name: 'Current device data' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Current device data updated');
    expect(screen.getByText('OnePlus 15')).toBeInTheDocument();
    expect(within(screen.getByRole('figure', { name: 'CPU price versus performance chart' })).getByRole('table', { name: 'Benchmark points' })).toHaveTextContent('Galaxy S25');
    expect(screen.getByRole('heading', { name: 'Field Notes' })).toBeInTheDocument();
  });

  it('shows a useful error state when the device request fails and lets readers retry', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      json: () => Promise.resolve({ success: false, error: 'Device data unavailable' }),
    }));
    render(<Dashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Device data unavailable');
    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Device data unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(await screen.findByRole('table', { name: 'Current device data' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Current device data updated');
  });

  it('updates chart colors when the live theme toggle changes', async () => {
    render(<Dashboard />);

    const figure = await screen.findByRole('figure', { name: 'CPU price versus performance chart' });
    expect(figure.querySelector('[data-chart-theme="dark"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(figure.querySelector('[data-chart-theme="light"]')).toBeInTheDocument();
    expect(within(figure).getByRole('img', { name: 'CPU price versus performance chart' })).toHaveTextContent('price in INR');
  });
});
