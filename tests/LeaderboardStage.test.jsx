import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import LeaderboardStage from '@/components/LeaderboardStage';

describe('LeaderboardStage', () => {
  const benchmarkData = {
    metrics: {
      cpu: {
        label: 'Geekbench 6 multi-core',
        points: [{ id: 's25', phoneName: 'Galaxy S25', phoneBrand: 'Samsung', deviceFamily: 'Galaxy S', x: 9200, priceInr: 79999, details: {}, series: [] }],
        series: [],
      },
      gpu: { label: '3DMark Wild Life Extreme score', points: [], series: [] },
      ai: { label: 'Geekbench AI quantized score', points: [], series: [] },
      antutu: { label: 'AnTuTu score', points: [], series: [] },
    },
  };

  it('starts on CPU and renders the API-backed graph', () => {
    render(<LeaderboardStage id="leaderboard" benchmarkData={benchmarkData} />);

    expect(screen.getByRole('button', { name: 'CPU' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('CPU price versus performance chart')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S25')).toBeInTheDocument();
    expect(screen.getByText('Device filter: upcoming')).toBeInTheDocument();
  });

  it('updates the graph when a metric is selected', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(screen.getByRole('button', { name: 'AI' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Geekbench AI quantized score data is not available yet.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Geekbench AI quantized score price versus performance chart')).not.toBeInTheDocument();
  });

  it('renders the GPU empty state from live benchmark data', () => {
    render(<LeaderboardStage benchmarkData={benchmarkData} />);
    fireEvent.click(screen.getByRole('button', { name: 'GPU' }));

    expect(screen.getByText('3DMark data is not available yet.')).toBeInTheDocument();
  });

  it('politely announces that current device data is being collected', () => {
    render(<LeaderboardStage loading error={null} lastUpdated={null} />);

    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Collecting current device data');
  });

  it('politely announces when current device data was last updated', () => {
    render(<LeaderboardStage loading={false} error={null} lastUpdated={new Date('2026-08-08T10:15:00')} />);

    expect(screen.getByRole('status', { name: 'Leaderboard data status' })).toHaveTextContent('Current device data updated');
  });

  it('announces unavailable data instead of claiming current data after an error', () => {
    render(<LeaderboardStage loading={false} error="Device data unavailable" lastUpdated={new Date('2026-08-08T10:15:00')} />);

    const status = screen.getByRole('status', { name: 'Leaderboard data status' });
    expect(status).toHaveTextContent('Device data unavailable');
    expect(status).not.toHaveTextContent('Current device data');
  });

  it('shows a neutral empty state before benchmark data is available', () => {
    render(<LeaderboardStage />);

    expect(screen.getByText('Benchmark data has not been collected yet.')).toBeInTheDocument();
  });
});
