import { describe, expect, it } from 'vitest';
import { bestPhoneMatch, normalizePhoneName, scorePhoneMatch } from '../../lib/extraction/phone-matching.js';

describe('phone matching', () => {
  it('normalizes phone names for matching', () => {
    expect(normalizePhoneName('Samsung Galaxy S26 Ultra 12GB/256GB')).toBe('samsung galaxy s26 ultra');
    expect(normalizePhoneName('Poco F8 Ultra (China)')).toBe('poco f8 ultra');
    expect(normalizePhoneName('Xiaomi 14 Pro+')).toBe('xiaomi 14 pro plus');
  });

  it('scores exact and near matches higher than unrelated phones', () => {
    const target = { phoneName: 'Galaxy S26 Ultra', phoneBrand: 'Samsung', processorName: 'Snapdragon 8 Elite Gen 5' };
    const exact = { name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', processorName: 'Snapdragon 8 Elite Gen 5' };
    const unrelated = { name: 'OnePlus 15', brand: 'OnePlus', processorName: 'Snapdragon 8 Elite Gen 5' };

    expect(scorePhoneMatch(target, exact)).toBeGreaterThan(0.9);
    expect(scorePhoneMatch(target, unrelated)).toBeLessThan(0.45);
  });

  it('returns the best match above threshold', () => {
    const result = bestPhoneMatch(
      { phoneName: 'Poco F8 Ultra', phoneBrand: 'POCO', processorName: 'Snapdragon 8 Elite Gen 5' },
      [
        { name: 'Poco F7 Ultra', brand: 'POCO', processorName: 'Snapdragon 8 Elite' },
        { name: 'Poco F8 Ultra', brand: 'POCO', processorName: 'Snapdragon 8 Elite Gen 5' },
      ]
    );

    expect(result.candidate.name).toBe('Poco F8 Ultra');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('matches plus-symbol phone names to plus-word source names', () => {
    const result = bestPhoneMatch(
      { phoneName: 'Xiaomi 14 Pro+', phoneBrand: 'Xiaomi', processorName: 'Snapdragon 8 Gen 3' },
      [
        { name: 'Xiaomi 14 Pro', brand: 'Xiaomi', processorName: 'Snapdragon 8 Gen 3' },
        { name: 'Xiaomi 14 Pro Plus', brand: 'Xiaomi', processorName: 'Snapdragon 8 Gen 3' },
      ]
    );

    expect(result.candidate.name).toBe('Xiaomi 14 Pro Plus');
    expect(result.confidence).toBeGreaterThan(0.9);
  });
});
