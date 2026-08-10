import { createChartScene } from '@tanstack/charts';
import { describe, expect, it } from 'vitest';
import {
  createBenchmarkChartDefinition,
  selectPersistentLabels,
  tooltipRows,
} from '@/lib/benchmarkChartDefinition';

function point(overrides = {}) {
  return {
    id: overrides.id || overrides.phoneName?.toLowerCase().replace(/\s+/g, '-') || 'phone',
    phoneName: overrides.phoneName || 'Galaxy S25',
    phoneBrand: overrides.phoneBrand || 'Samsung',
    deviceFamily: overrides.deviceFamily || 'Galaxy S',
    x: overrides.x ?? 9000,
    priceInr: overrides.priceInr ?? 79999,
    priceType: 'current',
    details: overrides.details || { processorName: 'Snapdragon 8 Elite' },
    ...overrides,
  };
}

describe('benchmark chart definition', () => {
  it('keeps every point labelled when there are 24 points', () => {
    const points = Array.from({ length: 24 }, (_, index) => point({ id: `phone-${index}`, phoneName: `Phone ${index}`, x: 1000 + index }));

    expect(selectPersistentLabels(points, [])).toHaveLength(24);
    expect(selectPersistentLabels(points, []).map((item) => item.id)).toEqual(
      points.toSorted((a, b) => b.x - a.x || a.phoneName.localeCompare(b.phoneName) || a.id.localeCompare(b.id)).map((item) => item.id),
    );
  });

  it('labels exactly the ten highest-x standalone points in a dense scene', () => {
    const points = Array.from({ length: 40 }, (_, index) => point({ id: `phone-${index}`, phoneName: `Phone ${index}`, x: index + 1 }));

    expect(selectPersistentLabels(points, [])).toHaveLength(10);
    expect(selectPersistentLabels(points, []).map((item) => item.id)).toEqual(
      points.slice(-10).toReversed().map((item) => item.id),
    );
  });

  it('unions sibling endpoints without duplicate labels', () => {
    const points = Array.from({ length: 40 }, (_, index) => point({ id: `phone-${index}`, phoneName: `Phone ${index}`, x: index + 1 }));
    const series = [{
      id: 'Samsung:Galaxy S25',
      points: [points[0], points[1], points[2]],
    }];

    const labels = selectPersistentLabels(points, series);
    const ids = labels.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(['phone-0', 'phone-2']));
  });

  it('keeps every point, one line per valid series, and only selected text labels in the scene', () => {
    const points = Array.from({ length: 40 }, (_, index) => point({ id: `phone-${index}`, phoneName: `Phone ${index}`, x: index + 1 }));
    const series = [
      { id: 'Samsung:Galaxy S25', points: [points[0], points[1], points[2]] },
      { id: 'Google:Pixel 9', points: [points[3], points[4]] },
      { id: 'invalid', points: [points[5]] },
    ];
    const definition = createBenchmarkChartDefinition({
      metric: { id: 'cpu', label: 'Geekbench 6 multi-core', xLabel: 'Geekbench 6 multi-core', points, series },
      theme: 'dark',
    });

    const scene = createChartScene(definition, { width: 720, height: 420 });
    const dotPoints = scene.points.filter((item) => item.markId === 'benchmark-points');
    const linePoints = scene.points.filter((item) => item.markId.startsWith('series-'));
    const textPoints = scene.points.filter((item) => item.markId === 'benchmark-labels');
    const lineMarkIds = new Set(linePoints.map((item) => item.markId));

    expect(dotPoints).toHaveLength(40);
    expect(lineMarkIds).toHaveLength(2);
    expect(textPoints.map((item) => item.datum.id)).toEqual(
      selectPersistentLabels(points, series).map((item) => item.id),
    );
  });

  it('returns metric-specific CPU and AI tooltip rows', () => {
    const cpu = point({
      details: { cpuGeekbench6SingleCore: 1914, processorName: 'Tensor G5' },
    });
    const ai = point({
      details: {
        aiBackend: 'NNAPI',
        aiAccelerator: 'NPU',
        aiPrecision: 'Quantized',
        processorName: 'Tensor G5',
      },
    });

    expect(tooltipRows(cpu, 'cpu')).toEqual(expect.arrayContaining([
      { label: 'Single-core', value: '1,914' },
      { label: 'Processor', value: 'Tensor G5' },
    ]));
    expect(tooltipRows(ai, 'ai')).toEqual(expect.arrayContaining([
      { label: 'Backend', value: 'NNAPI' },
      { label: 'Accelerator', value: 'NPU' },
      { label: 'Precision', value: 'Quantized' },
      { label: 'Processor', value: 'Tensor G5' },
    ]));
  });
});
