import { describe, expect, it } from 'vitest';
import { getProcessorMetadata, normalizeProcessorName } from '../../lib/extraction/processor-normalization.js';

describe('processor normalization', () => {
  it('normalizes Snapdragon aliases', () => {
    expect(normalizeProcessorName('Qualcomm Snapdragon 8 Elite Gen 5')).toBe('Snapdragon 8 Elite Gen 5');
    expect(normalizeProcessorName('S-8 Elite Gen 5')).toBe('Snapdragon 8 Elite Gen 5');
    expect(normalizeProcessorName('高通 骁龙8 至尊版 Gen5')).toBe('Snapdragon 8 Elite Gen 5');
  });

  it('normalizes MediaTek aliases', () => {
    expect(normalizeProcessorName('联发科技 Helio G99')).toBe('Helio G99');
    expect(normalizeProcessorName('联发科技 Helio G96')).toBe('Helio G96');
    expect(normalizeProcessorName('联发科技 曦力G85')).toBe('Helio G85');
    expect(normalizeProcessorName('联发科技 天玑9500')).toBe('Dimensity 9500');
    expect(normalizeProcessorName('MediaTek Dimensity 9400+')).toBe('Dimensity 9400+');
  });

  it('normalizes Exynos, Tensor, Kirin, Apple, and Unisoc names', () => {
    expect(normalizeProcessorName('Generic Samsung Exynos 2400')).toBe('Exynos 2400');
    expect(normalizeProcessorName('Samsung Exynos 2400')).toBe('Exynos 2400');
    expect(normalizeProcessorName('三星 Exynos 2400')).toBe('Exynos 2400');
    expect(normalizeProcessorName('Generic 谷歌 Tensor G4')).toBe('Tensor G4');
    expect(normalizeProcessorName('Google Tensor G4')).toBe('Tensor G4');
    expect(normalizeProcessorName('谷歌 Tensor G4')).toBe('Tensor G4');
    expect(normalizeProcessorName('Generic HiSilicon Kirin980')).toBe('Kirin 980');
    expect(normalizeProcessorName('HiSilicon Kirin980')).toBe('Kirin 980');
    expect(normalizeProcessorName('KIRIN980')).toBe('Kirin 980');
    expect(normalizeProcessorName('Apple A18 Pro')).toBe('Apple A18 Pro');
    expect(normalizeProcessorName('紫光展锐 T820')).toBe('Unisoc T820');
  });

  it('returns processor metadata for chart filters', () => {
    expect(getProcessorMetadata('Snapdragon 8 Gen 3')).toEqual({
      processorName: 'Snapdragon 8 Gen 3',
      processorBrand: 'Snapdragon',
      processorSeries: 'flagship',
      processorGeneration: '8 Gen 3',
    });

    expect(getProcessorMetadata('Dimensity 7300-Ultra')).toEqual({
      processorName: 'Dimensity 7300-Ultra',
      processorBrand: 'MediaTek',
      processorSeries: 'mid',
      processorGeneration: 'Dimensity 7300',
    });

    expect(getProcessorMetadata('Snapdragon 8s Gen 3')).toEqual({
      processorName: 'Snapdragon 8s Gen 3',
      processorBrand: 'Snapdragon',
      processorSeries: 'flagship',
      processorGeneration: '8s Gen 3',
    });

    expect(getProcessorMetadata('Snapdragon 8s Gen 4')).toEqual({
      processorName: 'Snapdragon 8s Gen 4',
      processorBrand: 'Snapdragon',
      processorSeries: 'flagship',
      processorGeneration: '8s Gen 4',
    });

    expect(getProcessorMetadata('Snapdragon 7s Gen 4')).toEqual({
      processorName: 'Snapdragon 7s Gen 4',
      processorBrand: 'Snapdragon',
      processorSeries: 'premium',
      processorGeneration: '7s Gen 4',
    });

    expect(getProcessorMetadata('Snapdragon 7s Gen 3')).toEqual({
      processorName: 'Snapdragon 7s Gen 3',
      processorBrand: 'Snapdragon',
      processorSeries: 'premium',
      processorGeneration: '7s Gen 3',
    });

    expect(getProcessorMetadata('Snapdragon 4s Gen 2')).toEqual({
      processorName: 'Snapdragon 4s Gen 2',
      processorBrand: 'Snapdragon',
      processorSeries: 'entry',
      processorGeneration: '4s Gen 2',
    });

    expect(getProcessorMetadata('Helio G100')).toEqual({
      processorName: 'Helio G100',
      processorBrand: 'MediaTek',
      processorSeries: 'entry',
      processorGeneration: 'Helio G100',
    });

    expect(getProcessorMetadata('Helio G99')).toEqual({
      processorName: 'Helio G99',
      processorBrand: 'MediaTek',
      processorSeries: 'mid',
      processorGeneration: 'Helio G99',
    });

    expect(getProcessorMetadata('Helio G96')).toEqual({
      processorName: 'Helio G96',
      processorBrand: 'MediaTek',
      processorSeries: 'mid',
      processorGeneration: 'Helio G96',
    });

    expect(getProcessorMetadata('Helio G95')).toEqual({
      processorName: 'Helio G95',
      processorBrand: 'MediaTek',
      processorSeries: 'mid',
      processorGeneration: 'Helio G95',
    });

    expect(getProcessorMetadata('Helio G85')).toEqual({
      processorName: 'Helio G85',
      processorBrand: 'MediaTek',
      processorSeries: 'entry',
      processorGeneration: 'Helio G85',
    });

    expect(getProcessorMetadata('Helio G70')).toEqual({
      processorName: 'Helio G70',
      processorBrand: 'MediaTek',
      processorSeries: 'entry',
      processorGeneration: 'Helio G70',
    });

    expect(getProcessorMetadata('Helio G35')).toEqual({
      processorName: 'Helio G35',
      processorBrand: 'MediaTek',
      processorSeries: 'entry',
      processorGeneration: 'Helio G35',
    });

    expect(getProcessorMetadata('Helio P35')).toEqual({
      processorName: 'Helio P35',
      processorBrand: 'MediaTek',
      processorSeries: 'entry',
      processorGeneration: 'Helio P35',
    });

    expect(getProcessorMetadata('Helio X30')).toEqual({
      processorName: 'Helio X30',
      processorBrand: 'MediaTek',
      processorSeries: 'flagship',
      processorGeneration: 'Helio X30',
    });
  });
});
