import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeToggle from '@/components/ThemeToggle';

function mockSystemTheme(matches) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matches : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('uses the system dark preference and offers a light-mode switch', () => {
    mockSystemTheme(true);
    render(<ThemeToggle />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('persists a manual light choice and updates the root theme', () => {
    mockSystemTheme(true);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('apu-matrix-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });
});
