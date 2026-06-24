import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PhonePricePerformanceChart from '../components/PhonePricePerformanceChart.jsx';

const rows = [
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
    id: 'red-magic-11-pro',
    phoneName: 'Red Magic 11 Pro',
    phoneBrand: 'Red Magic',
    processorName: 'Snapdragon 8 Elite Gen 5',
    processorBrand: 'Snapdragon',
    processorSeries: 'flagship',
    processorGeneration: '8 Elite Gen 5',
    antutuScore: 3963575,
    category: 'android',
    plottedPrice: { normalizedINR: 65163, normalizedUSD: 749, priceType: 'current', source: 'manual-seed' },
    missingFields: [],
  },
  {
    id: 'unpriced',
    phoneName: 'Unpriced Phone',
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
];

describe('PhonePricePerformanceChart', () => {
  it('renders summary counts and chart canvas', () => {
    render(<PhonePricePerformanceChart rows={rows} />);

    expect(screen.getByText('Phone price performance')).toBeInTheDocument();
    expect(screen.getByText('2 plotted')).toBeInTheDocument();
    expect(screen.getByText('1 current fallback')).toBeInTheDocument();
    expect(screen.getByLabelText('phone price performance scatter plot')).toBeInTheDocument();
  });

  it('filters by processor brand', () => {
    render(<PhonePricePerformanceChart rows={rows} />);

    fireEvent.click(screen.getByRole('button', { name: 'MediaTek' }));
    expect(screen.getByText('0 plotted')).toBeInTheDocument();
  });
});
