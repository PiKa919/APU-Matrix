import { describe, expect, it } from 'vitest';
import { selectPlottedPrice } from '../../lib/extraction/price-selection.js';

const launch = { normalizedINR: 69999, normalizedUSD: 804.59, priceType: 'launch', source: 'launch-source', confidence: 0.8 };
const current = { normalizedINR: 54999, normalizedUSD: 632.17, priceType: 'current', source: 'current-source', confidence: 0.9 };

describe('price selection', () => {
  it('prefers launch price over current price', () => {
    expect(selectPlottedPrice([launch], [current])).toBe(launch);
  });

  it('falls back to current price when launch price is unavailable', () => {
    expect(selectPlottedPrice([], [current])).toBe(current);
  });

  it('uses the highest confidence candidate for the selected price type', () => {
    const weakLaunch = { ...launch, normalizedINR: 71999, confidence: 0.55 };
    const strongLaunch = { ...launch, normalizedINR: 69999, confidence: 0.91 };

    expect(selectPlottedPrice([weakLaunch, strongLaunch], [current])).toBe(strongLaunch);
  });

  it('accepts candidates with USD normalization when INR normalization is absent', () => {
    const usdOnlyLaunch = {
      normalizedUSD: 799,
      priceType: 'launch',
      source: 'usd-source',
      confidence: 0.88,
    };

    expect(selectPlottedPrice([usdOnlyLaunch], [current])).toBe(usdOnlyLaunch);
  });

  it('does not compare INR and USD amounts as the same unit for tie-breaks', () => {
    const inrLaunch = {
      normalizedINR: 65000,
      priceType: 'launch',
      source: 'inr-source',
      confidence: 0.88,
    };
    const usdOnlyLaunch = {
      normalizedUSD: 799,
      priceType: 'launch',
      source: 'usd-source',
      confidence: 0.88,
    };

    expect(selectPlottedPrice([inrLaunch, usdOnlyLaunch], [])).toBe(inrLaunch);
  });

  it('returns null when no price is available', () => {
    expect(selectPlottedPrice([], [])).toBeNull();
  });
});
