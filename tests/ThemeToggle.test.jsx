import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ThemeToggle from '@/components/ThemeToggle';

const globalStyles = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

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

  it('honors an existing light preference over the dark system preference', () => {
    window.localStorage.setItem('apu-matrix-theme', 'light');
    mockSystemTheme(true);
    render(<ThemeToggle />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it('uses Space Grotesk as the effective global font', () => {
    const globalRule = globalStyles.match(/html,\s*body\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(globalRule).toContain("font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;");
    expect(globalRule).not.toContain('--font-geist-sans');
  });

  it('keeps legacy decorative colors behind semantic theme tokens', () => {
    expect(globalStyles).not.toMatch(/rgba\(47, 183, 166|rgba\(228, 207, 160|rgba\(255, 255, 255|rgba\(245, 245, 241|rgba\(18, 31, 33/);
  });
});
