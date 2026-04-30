import { render, screen } from '@testing-library/react';
import Sidebar from '../components/Filters.jsx';

const noop = () => {};

describe('Sidebar', () => {
  it('renders filter header and summary copy', () => {
    render(
      <Sidebar
        brands={['Apple', 'Samsung']}
        selectedBrands={new Set(['Apple'])}
        onToggleBrand={noop}
        onSelectAllBrands={noop}
        chipsets={['Apple', 'Snapdragon']}
        selectedChipsets={new Set(['Apple'])}
        onToggleChipset={noop}
        onSelectAllChipsets={noop}
      />
    );

    expect(screen.getByText('Data filters')).toBeInTheDocument();
    expect(screen.getByText('Filters combined')).toBeInTheDocument();
  });
});
