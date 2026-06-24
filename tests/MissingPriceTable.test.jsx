import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MissingPriceTable from '../components/MissingPriceTable.jsx';

const rows = [
  {
    id: 'red-magic-11-pro',
    phoneName: 'Red Magic 11 Pro',
    phoneBrand: 'Red Magic',
    processorName: 'Snapdragon 8 Elite Gen 5',
    antutuScore: 3963575,
    category: 'android',
    plottedPrice: null,
    sourceMatches: [],
    missingFields: ['price'],
  },
  {
    id: 'oneplus-15',
    phoneName: 'OnePlus 15',
    phoneBrand: 'OnePlus',
    processorName: 'Snapdragon 8 Elite Gen 5',
    antutuScore: 3606895,
    category: 'android',
    plottedPrice: { priceType: 'launch' },
    sourceMatches: [],
    missingFields: [],
  },
];

describe('MissingPriceTable', () => {
  it('shows only rows without plotted price', () => {
    render(<MissingPriceTable rows={rows} />);

    expect(screen.getByText('Missing price review')).toBeInTheDocument();
    expect(screen.getByText('Red Magic 11 Pro')).toBeInTheDocument();
    expect(screen.queryByText('OnePlus 15')).not.toBeInTheDocument();
    expect(screen.getByText('Snapdragon 8 Elite Gen 5')).toBeInTheDocument();
    expect(screen.getByText('3,963,575')).toBeInTheDocument();
  });
});
