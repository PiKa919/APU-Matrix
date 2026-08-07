import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data }),
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('composes the research homepage around the API-backed device table', async () => {
    render(<Dashboard />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toHaveAttribute('aria-label', 'Devices coming soon');
    expect(screen.getByRole('link', { name: 'Explore leaderboard' })).toHaveAttribute('href', '#leaderboard');
    expect(await screen.findByRole('table', { name: 'Current device data' })).toBeInTheDocument();
    expect(screen.getByText('OnePlus 15')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Field Notes' })).toBeInTheDocument();
  });

  it('shows a useful error state when the device request fails and lets readers retry', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: 'Device data unavailable' }),
    });
    render(<Dashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Device data unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('table', { name: 'Current device data' })).toBeInTheDocument();
  });
});
