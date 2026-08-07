import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LeaderboardStage from '@/components/LeaderboardStage';

describe('LeaderboardStage', () => {
  it('starts on CPU and clearly identifies the graph reserve as awaiting data', () => {
    render(<LeaderboardStage id="leaderboard" />);

    expect(screen.getByRole('button', { name: 'CPU' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'CPU benchmark graph awaiting normalized data' })).toBeInTheDocument();
    expect(screen.getByText('Awaiting normalized benchmark data')).toBeInTheDocument();
    expect(screen.getByText('Device filter: upcoming')).toBeInTheDocument();
    expect(screen.queryByTestId('benchmark-point')).not.toBeInTheDocument();
  });

  it('updates the graph reserve label when a metric is selected', () => {
    render(<LeaderboardStage />);
    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(screen.getByRole('button', { name: 'AI' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'AI benchmark graph awaiting normalized data' })).toBeInTheDocument();
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

  it('uses semantic foreground text for the selected metric eyebrow', () => {
    render(<LeaderboardStage />);

    expect(screen.getByText('CPU view')).not.toHaveAttribute('style');
  });
});
