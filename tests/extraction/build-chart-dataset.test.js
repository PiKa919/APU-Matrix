import { describe, expect, it } from 'vitest';
import { buildPhonePricePerformanceDataset } from '../../lib/extraction/build-chart-dataset.js';

const detailedData = [
  {
    processor: 'Snapdragon 8 Elite Gen 5',
    series: 'flagship',
    phones: [
      {
        name: 'OnePlus 15',
        brand: 'OnePlus',
        score: 3606895,
        rank: 4,
        category: 'android',
        releaseDate: null,
      },
      {
        name: 'Red Magic 11 Pro',
        brand: 'Red Magic',
        score: 3963575,
        rank: 1,
        category: 'android',
        releaseDate: null,
      },
    ],
  },
];

const overrides = [
  {
    phoneName: 'OnePlus 15',
    phoneBrand: 'OnePlus',
    processorName: 'Snapdragon 8 Elite Gen 5',
    releaseDate: '2025-10-27',
    launchPrices: [{ amount: 54999, currency: 'INR', rawValue: 'INR 54,999', confidence: 0.95 }],
    currentPrices: [{ amount: 49999, currency: 'INR', rawValue: 'INR 49,999', confidence: 0.8 }],
    source: 'manual-fixture',
  },
  {
    phoneName: 'Red Magic 11 Pro',
    phoneBrand: 'Red Magic',
    processorName: 'Snapdragon 8 Elite Gen 5',
    releaseDate: '2025-11-03',
    currentPrices: [{ amount: 749, currency: 'USD', rawValue: 'USD 749', confidence: 0.9 }],
    source: 'manual-fixture',
  },
];

describe('chart dataset builder', () => {
  it('creates plotted rows with launch-first and current-fallback price policy', () => {
    const { rows, report } = buildPhonePricePerformanceDataset({ detailedData, overrides });

    expect(rows).toHaveLength(2);

    const onePlus = rows.find((row) => row.phoneName === 'OnePlus 15');
    expect(onePlus.plottedPrice.priceType).toBe('launch');
    expect(onePlus.plottedPrice.normalizedINR).toBe(54999);
    expect(onePlus.processorBrand).toBe('Snapdragon');
    expect(onePlus.processorSeries).toBe('flagship');

    const redMagic = rows.find((row) => row.phoneName === 'Red Magic 11 Pro');
    expect(redMagic.plottedPrice.priceType).toBe('current');
    expect(redMagic.plottedPrice.normalizedINR).toBe(65163);

    expect(report.totalRows).toBe(2);
    expect(report.plottedRows).toBe(2);
    expect(report.launchPriceRows).toBe(1);
    expect(report.currentFallbackRows).toBe(1);
    expect(report.missingPriceRows).toBe(0);
  });

  it('keeps unpriced benchmark rows reviewable', () => {
    const { rows, report } = buildPhonePricePerformanceDataset({ detailedData, overrides: [] });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.plottedPrice === null)).toBe(true);
    expect(rows.every((row) => row.missingFields.includes('price'))).toBe(true);
    expect(report.plottedRows).toBe(0);
    expect(report.missingPriceRows).toBe(2);
  });

  it('does not attach same-name overrides from a different processor', () => {
    const { rows } = buildPhonePricePerformanceDataset({
      detailedData,
      overrides: [
        {
          phoneName: 'OnePlus 15',
          phoneBrand: 'OnePlus',
          processorName: 'Dimensity 9500',
          launchPrices: [{ amount: 54999, currency: 'INR', rawValue: 'INR 54,999', confidence: 0.95 }],
          source: 'wrong-processor-fixture',
        },
      ],
    });

    const onePlus = rows.find((row) => row.phoneName === 'OnePlus 15');
    expect(onePlus.plottedPrice).toBeNull();
    expect(onePlus.sourceMatches).toEqual([]);
  });

  it('generates unique row ids when names only differ by plus or source duplication', () => {
    const { rows } = buildPhonePricePerformanceDataset({
      detailedData: [
        {
          processor: 'Snapdragon 8 Elite',
          phones: [
            { name: 'Galaxy S25+', brand: 'Samsung', score: 2774381, category: 'android' },
            { name: 'Galaxy S25', brand: 'Samsung', score: 2646876, category: 'android' },
            { name: 'REDMI Pad 2', brand: 'Xiaomi', score: 602118, category: 'android_lite' },
            { name: 'Redmi Pad 2', brand: 'Xiaomi', score: 600630, category: 'android_lite' },
          ],
        },
      ],
      overrides: [],
    });

    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
