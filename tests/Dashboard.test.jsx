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
import Dashboard from '../app/page.js';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: [
          {
            id: 'oneplus-15',
            phoneName: 'OnePlus 15',
            phoneBrand: 'OnePlus',
            processorName: 'Snapdragon 8 Elite Gen 5',
            processorBrand: 'Snapdragon',
            processorSeries: 'flagship',
            processorGeneration: '8 Elite Gen 5',
            antutuScore: 3606895,
            category: 'android',
            plottedPrice: { normalizedINR: 54999, normalizedUSD: 632.17, priceType: 'launch', source: 'manual-seed' },
            missingFields: [],
          },
          {
            id: 'missing',
            phoneName: 'Missing Price Phone',
            phoneBrand: 'Example',
            processorName: 'Dimensity 9500',
            processorBrand: 'MediaTek',
            processorSeries: 'flagship',
            processorGeneration: 'Dimensity 9500',
            antutuScore: 3000000,
            category: 'android',
            plottedPrice: null,
            missingFields: ['price'],
          },
        ],
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the price performance chart and missing review table after data loads', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Phone price performance')).toBeInTheDocument();
    expect(screen.getByText('Missing price review')).toBeInTheDocument();
  });
});
