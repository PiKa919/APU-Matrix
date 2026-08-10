import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DeviceSnapshotTable from '@/components/DeviceSnapshotTable';

const row = {
  id: 'pixel-9-pro',
  phoneName: 'Google Pixel 9 Pro',
  processorName: 'Google Tensor G4',
  antutuScore: 1150000,
  plottedPrice: { normalizedINR: 109999, priceType: 'current' },
};

function makeRow(index, overrides = {}) {
  return {
    id: `device-${index}`,
    phoneName: `Device ${String(index).padStart(2, '0')}`,
    processorName: `Processor ${String(index).padStart(2, '0')}`,
    antutuScore: index * 1000,
    plottedPrice: { normalizedINR: index * 1000, priceType: index % 2 ? 'current' : 'launch' },
    ...overrides,
  };
}

function snapshotTable() {
  return screen.getByRole('table', { name: 'Current device data' });
}

describe('DeviceSnapshotTable', () => {
  it('renders the available device fields without fabricating data', () => {
    render(<DeviceSnapshotTable rows={[row]} loading={false} error={null} />);

    expect(screen.getByRole('table', { name: 'Current device data' })).toBeInTheDocument();
    expect(screen.getByText('Google Pixel 9 Pro')).toBeInTheDocument();
    expect(screen.getByText('Google Tensor G4')).toBeInTheDocument();
    expect(screen.getByText('1,150,000')).toBeInTheDocument();
    expect(screen.getByText('₹109,999')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('announces loading, error, and empty states', () => {
    const { rerender } = render(<DeviceSnapshotTable rows={[]} loading error={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading current device data');

    rerender(<DeviceSnapshotTable rows={[]} loading={false} error="Service unavailable" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable');

    rerender(<DeviceSnapshotTable rows={[]} loading={false} error={null} />);
    expect(screen.getByText('No device records are available yet.')).toBeInTheDocument();
  });

  it('searches phone and processor fields case-insensitively', () => {
    render(<DeviceSnapshotTable rows={[row, makeRow(2)]} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search devices' }), { target: { value: 'TENSOR G4' } });

    expect(screen.getByText('Google Pixel 9 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Device 02')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search devices' }), { target: { value: 'device 02' } });

    expect(screen.getByText('Device 02')).toBeInTheDocument();
    expect(screen.queryByText('Google Pixel 9 Pro')).not.toBeInTheDocument();
  });

  it.each([
    ['Phone', 'phone', 'Alpha', 'Zulu'],
    ['AnTuTu', 'antutu', '1,000', '3,000'],
    ['Price', 'price', '₹1,000', '₹3,000'],
  ])('sorts %s ascending and descending', (label, key, firstAscending, firstDescending) => {
    const rows = [
      makeRow(3, { phoneName: 'Zulu' }),
      makeRow(1, { phoneName: 'Alpha' }),
      makeRow(2, { phoneName: 'Middle' }),
    ];
    render(<DeviceSnapshotTable rows={rows} />);
    const table = snapshotTable();
    const button = within(table).getByRole('button', { name: label });

    fireEvent.click(button);
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(firstAscending);

    fireEvent.click(button);
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(firstDescending);

    expect(within(table).getByRole('columnheader', { name: label })).toHaveAttribute('aria-sort', 'descending');
    expect(key).toBeTruthy();
  });

  it('shows 25 records per page and navigates between pages', () => {
    render(<DeviceSnapshotTable rows={Array.from({ length: 26 }, (_, index) => makeRow(index + 1))} />);

    expect(within(snapshotTable()).getAllByRole('row')).toHaveLength(26);
    expect(screen.getByText('Showing 1–25 of 26 devices')).toBeInTheDocument();
    expect(screen.queryByText('Device 26')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(within(snapshotTable()).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Device 26')).toBeInTheDocument();
    expect(screen.getByText('Showing 26–26 of 26 devices')).toBeInTheDocument();
  });

  it('resets to page one after search and sort changes, including returning to prior state', () => {
    const rows = Array.from({ length: 26 }, (_, index) => makeRow(index + 1));
    render(<DeviceSnapshotTable rows={rows} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Device 26')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search devices' }), { target: { value: 'device 01' } });
    expect(screen.getByText('Device 01')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search devices' }), { target: { value: '' } });
    expect(screen.getByText('Device 01')).toBeInTheDocument();
    expect(screen.queryByText('Device 26')).not.toBeInTheDocument();

    fireEvent.click(within(snapshotTable()).getByRole('button', { name: 'Phone' }));
    expect(screen.getByText('Device 01')).toBeInTheDocument();
  });

  it('uses scoped headers and retains complete mobile field labels in each row', () => {
    render(<DeviceSnapshotTable rows={[row]} />);

    const table = snapshotTable();
    expect(within(table).getAllByRole('columnheader')).toHaveLength(5);
    within(table).getAllByRole('columnheader').forEach((header) => expect(header).toHaveAttribute('scope', 'col'));

    const cells = within(table).getAllByRole('cell');
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Phone', 'Processor', 'AnTuTu score', 'Price', 'Price type',
    ]);
    expect(within(table).getByText('Google Tensor G4')).toBeInTheDocument();
    expect(within(table).getByText('₹109,999')).toBeInTheDocument();
    expect(within(table).getByText('Current')).toBeInTheDocument();
  });

  it('shows a reset action when a search has no matches', () => {
    render(<DeviceSnapshotTable rows={[row]} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search devices' }), { target: { value: 'missing device' } });

    expect(screen.getByRole('status')).toHaveTextContent('No device records match');
    fireEvent.click(screen.getByRole('button', { name: 'Reset search' }));
    expect(screen.getByText('Google Pixel 9 Pro')).toBeInTheDocument();
  });
});
