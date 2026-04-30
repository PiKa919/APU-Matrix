import { vi } from 'vitest';

vi.mock('chart.js', () => {
  class MockChart {
    static register = vi.fn();
    static lastConfig = null;

    constructor(ctx, config) {
      MockChart.lastConfig = config;
    }

    destroy() {}
  }

  return {
    Chart: MockChart,
    BarController: {},
    BarElement: {},
    CategoryScale: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
  };
});

import { render } from '@testing-library/react';
import { Chart as ChartJS } from 'chart.js';
import ProcessorChart from '../components/ProcessorChart.jsx';

const sampleData = [
  {
    brand: 'Apple',
    modelName: 'iPhone Test',
    chipset: 'Apple A18',
    score: 1500000,
    price: 50000,
  },
];

describe('ProcessorChart', () => {
  it('builds a bar chart with tooltip details', () => {
    render(<ProcessorChart data={sampleData} />);

    expect(ChartJS.lastConfig.type).toBe('bar');

    const labelLines = ChartJS.lastConfig.options.plugins.tooltip.callbacks.label({
      dataIndex: 0,
    });

    expect(labelLines.join(' ')).toContain('Peak Score:');
    expect(labelLines.join(' ')).toContain('Devices:');
  });
});
