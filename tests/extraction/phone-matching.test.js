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

  it('does not match a plus target to a non-plus candidate above threshold', () => {
    const result = bestPhoneMatch(
      { phoneName: 'Xiaomi 14 Pro+', phoneBrand: 'Xiaomi', processorName: 'Snapdragon 8 Gen 3' },
      [
        { name: 'Xiaomi 14 Pro', brand: 'Xiaomi', processorName: 'Snapdragon 8 Gen 3' },
      ]
    );

    expect(result).toBeNull();
  });

  it('does not match base, ultra, max, or adjacent generation variants above threshold', () => {
    expect(bestPhoneMatch(
      { phoneName: 'Galaxy S26', phoneBrand: 'Samsung', processorName: 'Exynos 2600' },
      [{ name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', processorName: 'Exynos 2600' }]
    )).toBeNull();

    expect(bestPhoneMatch(
      { phoneName: 'iPhone 16 Pro', phoneBrand: 'Apple', processorName: 'A18 Pro' },
      [{ name: 'Apple iPhone 16 Pro Max', brand: 'Apple', processorName: 'A18 Pro' }]
    )).toBeNull();

    expect(bestPhoneMatch(
      { phoneName: 'Galaxy S26 Ultra', phoneBrand: 'Samsung', processorName: 'Snapdragon 8 Elite Gen 5' },
      [{ name: 'Samsung Galaxy S25 Ultra', brand: 'Samsung', processorName: 'Snapdragon 8 Elite Gen 5' }]
    )).toBeNull();
  });

  it('matches spaced One Plus brand spelling to OnePlus', () => {
    const result = bestPhoneMatch(
      { phoneName: 'OnePlus 15', phoneBrand: 'OnePlus', processorName: 'Snapdragon 8 Elite Gen 5' },
      [{ name: 'One Plus 15', brand: 'One Plus', processorName: 'Snapdragon 8 Elite Gen 5' }]
    );

    expect(result.candidate.name).toBe('One Plus 15');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('does not match different alphanumeric model series above threshold', () => {
    expect(bestPhoneMatch(
      { phoneName: 'Galaxy A55', phoneBrand: 'Samsung', processorName: 'Exynos 1480' },
      [{ name: 'Samsung Galaxy S55', brand: 'Samsung', processorName: 'Exynos 1480' }]
    )).toBeNull();

    expect(bestPhoneMatch(
      { phoneName: 'iPhone 16', phoneBrand: 'Apple', processorName: 'A18' },
      [{ name: 'Apple iPhone 16e', brand: 'Apple', processorName: 'A18' }]
    )).toBeNull();
  });

  it('matches compact and spaced model aliases', () => {
    const realme = bestPhoneMatch(
      { phoneName: 'Realme GT 7 Pro', phoneBrand: 'Realme', processorName: 'Snapdragon 8 Elite' },
      [{ name: 'Realme GT7 Pro', brand: 'Realme', processorName: 'Snapdragon 8 Elite' }]
    );
    const oneplus = bestPhoneMatch(
      { phoneName: 'OnePlus 12R', phoneBrand: 'OnePlus', processorName: 'Snapdragon 8 Gen 2' },
      [{ name: 'OnePlus 12 R', brand: 'OnePlus', processorName: 'Snapdragon 8 Gen 2' }]
    );

    expect(realme.candidate.name).toBe('Realme GT7 Pro');
    expect(realme.confidence).toBeGreaterThan(0.75);
    expect(oneplus.candidate.name).toBe('OnePlus 12 R');
    expect(oneplus.confidence).toBeGreaterThan(0.75);
  });

  it('matches FE and Fan Edition variant aliases', () => {
    const result = bestPhoneMatch(
      { phoneName: 'Galaxy S24 FE', phoneBrand: 'Samsung', processorName: 'Exynos 2400e' },
      [{ name: 'Samsung Galaxy S24 Fan Edition', brand: 'Samsung', processorName: 'Exynos 2400e' }]
    );

    expect(result.candidate.name).toBe('Samsung Galaxy S24 Fan Edition');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('does not match different subseries with the same number above threshold', () => {
    expect(bestPhoneMatch(
      { phoneName: 'Redmi Note 13 Pro', phoneBrand: 'Redmi', processorName: 'Snapdragon 7s Gen 2' },
      [{ name: 'Xiaomi Redmi 13 Pro', brand: 'Xiaomi', processorName: 'Snapdragon 7s Gen 2' }]
    )).toBeNull();

    expect(bestPhoneMatch(
      { phoneName: 'Redmi Note 13', phoneBrand: 'Redmi', processorName: 'MediaTek Dimensity 6080' },
      [{ name: 'Xiaomi Redmi 13', brand: 'Xiaomi', processorName: 'MediaTek Dimensity 6080' }]
    )).toBeNull();
  });

  it('matches longer compact and spaced model aliases', () => {
    const realme = bestPhoneMatch(
      { phoneName: 'Realme GT Neo 6 SE', phoneBrand: 'Realme', processorName: 'Snapdragon 7+ Gen 3' },
      [{ name: 'Realme GT Neo6 SE', brand: 'Realme', processorName: 'Snapdragon 7+ Gen 3' }]
    );
    const fold = bestPhoneMatch(
      { phoneName: 'Galaxy Z Fold 7', phoneBrand: 'Samsung', processorName: 'Snapdragon 8 Elite' },
      [{ name: 'Samsung Galaxy ZFold7', brand: 'Samsung', processorName: 'Snapdragon 8 Elite' }]
    );
    const razr = bestPhoneMatch(
      { phoneName: 'Razr 50 Ultra', phoneBrand: 'Motorola', processorName: 'Snapdragon 8s Gen 3' },
      [{ name: 'Motorola Razr50 Ultra', brand: 'Motorola', processorName: 'Snapdragon 8s Gen 3' }]
    );

    expect(realme.candidate.name).toBe('Realme GT Neo6 SE');
    expect(realme.confidence).toBeGreaterThan(0.75);
    expect(fold.candidate.name).toBe('Samsung Galaxy ZFold7');
    expect(fold.confidence).toBeGreaterThan(0.75);
    expect(razr.candidate.name).toBe('Motorola Razr50 Ultra');
    expect(razr.confidence).toBeGreaterThan(0.75);
  });

  it('does not match XL variants to non-XL models above threshold', () => {
    expect(bestPhoneMatch(
      { phoneName: 'Pixel 10 Pro XL', phoneBrand: 'Google', processorName: 'Tensor G6' },
      [{ name: 'Google Pixel 10 Pro', brand: 'Google', processorName: 'Tensor G6' }]
    )).toBeNull();
  });

  it('matches phones when connectivity suffixes are omitted in one source', () => {
    const result = bestPhoneMatch(
      { phoneName: 'Moto G Power 5G', phoneBrand: 'Motorola', processorName: 'Snapdragon 7s Gen 2' },
      [{ name: 'Motorola Moto G Power', brand: 'Motorola', processorName: 'Snapdragon 7s Gen 2' }]
    );

    expect(result.candidate.name).toBe('Motorola Moto G Power');
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('matches compact variant suffix aliases', () => {
    const pixel = bestPhoneMatch(
      { phoneName: 'Pixel 10 Pro XL', phoneBrand: 'Google', processorName: 'Tensor G6' },
      [{ name: 'Google Pixel 10 ProXL', brand: 'Google', processorName: 'Tensor G6' }]
    );
    const iphone = bestPhoneMatch(
      { phoneName: 'iPhone 16 Pro Max', phoneBrand: 'Apple', processorName: 'A18 Pro' },
      [{ name: 'Apple iPhone 16 ProMax', brand: 'Apple', processorName: 'A18 Pro' }]
    );
    const galaxy = bestPhoneMatch(
      { phoneName: 'Galaxy S24 FE', phoneBrand: 'Samsung', processorName: 'Exynos 2400e' },
      [{ name: 'Samsung Galaxy S24FE', brand: 'Samsung', processorName: 'Exynos 2400e' }]
    );

    expect(pixel.candidate.name).toBe('Google Pixel 10 ProXL');
    expect(pixel.confidence).toBeGreaterThan(0.75);
    expect(iphone.candidate.name).toBe('Apple iPhone 16 ProMax');
    expect(iphone.confidence).toBeGreaterThan(0.75);
    expect(galaxy.candidate.name).toBe('Samsung Galaxy S24FE');
    expect(galaxy.confidence).toBeGreaterThan(0.75);
  });

  it('does not treat the OnePlus brand token as a plus variant', () => {
    expect(bestPhoneMatch(
      { phoneName: 'OnePlus 15', phoneBrand: 'OnePlus', processorName: 'Snapdragon 8 Elite Gen 5' },
      [{ name: 'OnePlus 15 Plus', brand: 'OnePlus', processorName: 'Snapdragon 8 Elite Gen 5' }]
    )).toBeNull();
  });
});
