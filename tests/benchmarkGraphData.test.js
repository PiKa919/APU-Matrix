import { describe, expect, it } from 'vitest';
import { buildBenchmarkGraphData } from '../lib/benchmarkGraphData.js';

const csvFixture = `id,phone_name,phone_brand,release_year,device_family,canonical_model,y_price_inr,y_price_type,processor_name,x_metric_antutu_score,cpu_geekbench6_single_core,cpu_geekbench6_multi_core,cpu_source_url,ai_geekbench_quantized_score,ai_backend,ai_accelerator,ai_precision,ai_source_url,gpu_3dmark_wild_life_extreme_score,gpu_3dmark_wild_life_extreme_fps,source_urls
galaxy-s24,Samsung Galaxy S24,Samsung,2024,Galaxy S,Galaxy S24,79999,launch,Snapdragon 8 Gen 3,1800000,2100,6800,https://cpu.example/s24,1200,Geekbench AI,Hexagon,quantized,https://ai.example/s24,,,https://price.example/s24
galaxy-s24-duplicate,Samsung Galaxy S24,Samsung,2024,Galaxy S,Galaxy S24,79999,launch,Snapdragon 8 Gen 3,1800000,2100,6800,,,,,,,,https://price.example/s24-old
galaxy-s25,Samsung Galaxy S25,Samsung,2025,Galaxy S,Galaxy S25,84999,current,Snapdragon 8 Elite,2100000,2300,7500,https://cpu.example/s25,1400,Geekbench AI,Hexagon,quantized,https://ai.example/s25,,,https://price.example/s25
iphone-16, iPhone 16,Apple,2024,iPhone,iPhone 16,79900,current,A18,1700000,2200,7200,https://cpu.example/iphone-16,1300,Geekbench AI,Neural Engine,quantized,https://ai.example/iphone-16,,,https://price.example/iphone-16`;

describe('buildBenchmarkGraphData', () => {
  it('deduplicates repeated canonical models and groups safe same-brand family lines', () => {
    const data = buildBenchmarkGraphData(csvFixture);

    expect(data.metrics.cpu.points).toHaveLength(3);
    expect(data.metrics.cpu.series).toEqual([
      expect.objectContaining({
        id: 'Samsung:Galaxy S',
        points: [
          expect.objectContaining({ phoneName: 'Samsung Galaxy S24' }),
          expect.objectContaining({ phoneName: 'Samsung Galaxy S25' }),
        ],
      }),
    ]);
    expect(data.metrics.cpu.points.find((point) => point.phoneName === 'Samsung Galaxy S24')).toEqual(expect.objectContaining({
      phoneBrand: 'Samsung',
      x: 6800,
      priceInr: 79999,
      priceType: 'launch',
      sourceUrl: 'https://cpu.example/s24',
    }));
    expect(data.brands).toEqual(['Apple', 'Samsung']);
  });

  it('keeps GPU empty when no complete 3DMark score and price pair exists', () => {
    expect(buildBenchmarkGraphData(csvFixture).metrics.gpu.points).toEqual([]);
  });

  it('uses the most recently observed row when benchmark completeness ties', () => {
    const csv = `id,phone_name,phone_brand,release_year,canonical_model,y_price_inr,cpu_geekbench6_multi_core,cpu_observed_at,cpu_source_url
pixel-old,Pixel 9,Google,2024,Pixel 9,79999,5000,2026-01-01,https://cpu.example/old
pixel-new,Pixel 9,Google,2024,Pixel 9,79999,5000,2026-02-01,https://cpu.example/new`;

    expect(buildBenchmarkGraphData(csv).metrics.cpu.points[0].sourceUrl).toBe('https://cpu.example/new');
  });
});
