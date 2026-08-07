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
});
