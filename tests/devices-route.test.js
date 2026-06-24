import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/devices/route.js';

describe('/api/devices', () => {
  it('returns chart-ready phone price performance rows', async () => {
    const response = await GET(new Request('http://localhost/api/devices'));
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0]).toHaveProperty('phoneName');
    expect(json.data[0]).toHaveProperty('processorName');
    expect(json.data[0]).toHaveProperty('antutuScore');
    expect(json.data[0]).toHaveProperty('missingFields');
  });

  it('returns unique ids for React list keys', async () => {
    const response = await GET(new Request('http://localhost/api/devices'));
    const json = await response.json();
    const ids = json.data.map((row) => row.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
