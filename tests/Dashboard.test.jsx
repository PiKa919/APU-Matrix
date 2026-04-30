import { vi } from 'vitest';

vi.mock('chart.js', () => {
  class MockChart {
    static register = vi.fn();
    static lastConfig = null;

    constructor(ctx, config) {
      MockChart.lastConfig = config;
    }

    destroy() {}
  }

  return {
    Chart: MockChart,
    ScatterController: {},
    LineController: {},
    LineElement: {},
    PointElement: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
    BarController: {},
    BarElement: {},
    CategoryScale: {},
  };
});

import { render, screen } from '@testing-library/react';
import Dashboard from '../app/page.jsx';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: [
          {
            brand: 'Apple',
            modelName: 'iPhone Test',
            chipset: 'Apple A18',
            score: 1500000,
            price: 50000,
          },
        ],
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the main dashboard cards after data loads', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Performance vs price')).toBeInTheDocument();
    expect(screen.getByText('SoC ranking')).toBeInTheDocument();
  });
});
