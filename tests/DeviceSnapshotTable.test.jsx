import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeviceSnapshotTable from '@/components/DeviceSnapshotTable';

const row = {
  id: 'pixel-9-pro',
  phoneName: 'Google Pixel 9 Pro',
  processorName: 'Google Tensor G4',
  antutuScore: 1150000,
  plottedPrice: { normalizedINR: 109999, priceType: 'current' },
};

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
});
