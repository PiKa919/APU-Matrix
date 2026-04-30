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
    ScatterController: {},
    LineController: {},
    LineElement: {},
    PointElement: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
  };
});

import { render, screen } from '@testing-library/react';
import { Chart as ChartJS } from 'chart.js';
import PerformanceChart from '../components/PerformanceChart.jsx';

const sampleData = [
  {
    brand: 'Apple',
    modelName: 'iPhone Test',
    chipset: 'Apple A18',
    score: 1500000,
    price: 50000,
  },
];

describe('PerformanceChart', () => {
  it('renders the toggle and builds a scatter chart', () => {
    render(<PerformanceChart data={sampleData} />);

    expect(screen.getByText(/Hide 0 unpriced devices/i)).toBeInTheDocument();
    expect(ChartJS.lastConfig.type).toBe('scatter');
  });

  it('includes score, price, brand, and chip in tooltip labels', () => {
    render(<PerformanceChart data={sampleData} />);

    const labelLines = ChartJS.lastConfig.options.plugins.tooltip.callbacks.label({
      raw: {
        y: 1500000,
        price: 50000,
        brand: 'Apple',
        chipset: 'Apple A18',
      },
    });

    expect(labelLines.join(' ')).toContain('Score:');
    expect(labelLines.join(' ')).toContain('Price:');
    expect(labelLines.join(' ')).toContain('Brand: Apple');
    expect(labelLines.join(' ')).toContain('Chip: Apple A18');
  });
});
