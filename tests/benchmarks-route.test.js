import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/benchmarks/route.js';

describe('/api/benchmarks', () => {
  it('returns normalized benchmark graph data from the reviewed CSV', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.metrics.cpu.points.length).toBeGreaterThan(0);
    expect(json.data.metrics.ai.points.length).toBeGreaterThan(0);
    expect(json.data.metrics.antutu.points.length).toBeGreaterThan(0);
    expect(json.data.metrics.gpu.points).toEqual([]);
    expect(json.data.metrics.cpu.points[0].sourceUrl).toBeTruthy();
  });
});
