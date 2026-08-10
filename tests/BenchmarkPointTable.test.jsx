import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import BenchmarkPointTable from '@/components/BenchmarkPointTable';

function point(overrides = {}) {
  return {
    id: overrides.id || overrides.phoneName || 'pixel-9',
    phoneName: overrides.phoneName || 'Pixel 9',
    phoneBrand: overrides.phoneBrand || 'Google',
    x: overrides.x ?? 3811,
    priceInr: overrides.priceInr ?? 79999,
    details: {
      cpuGeekbench6SingleCore: 1714,
      processorName: 'Tensor G4',
      ...overrides.details,
    },
    ...overrides,
  };
}

function rows() {
  return within(screen.getByRole('table', { name: 'Benchmark points' })).getAllByRole('row');
}

describe('BenchmarkPointTable', () => {
  it('searches case-insensitively across device, brand, and processor', () => {
    render(<BenchmarkPointTable points={[
      point({ phoneName: 'Galaxy S25', phoneBrand: 'Samsung', details: { processorName: 'Snapdragon 8 Elite' } }),
      point({ id: 'iphone-16', phoneName: 'iPhone 16', phoneBrand: 'Apple', details: { processorName: 'A18' } }),
      point({ id: 'edge-50', phoneName: 'Edge 50 Pro', phoneBrand: 'Motorola', details: { processorName: 'Dimensity 7300' } }),
    ]} metricId="cpu" resetKey="cpu" />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search benchmark devices' }), { target: { value: 'MOTOROLA' } });
    expect(rows()).toHaveLength(2);
    expect(screen.getByText('Edge 50 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Galaxy S25')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search benchmark devices' }), { target: { value: 'snapdragon' } });
    expect(rows()).toHaveLength(2);
    expect(screen.getByText('Galaxy S25')).toBeInTheDocument();
  });

  it('sorts Brand, Performance, and Price ascending then descending with stable ties', () => {
    const points = [
      point({ id: 'zeta', phoneName: 'Zeta Phone', phoneBrand: 'Samsung', x: 500, priceInr: 90000 }),
      point({ id: 'alpha', phoneName: 'Alpha Phone', phoneBrand: 'Apple', x: 700, priceInr: 70000 }),
      point({ id: 'beta', phoneName: 'Beta Phone', phoneBrand: 'Apple', x: 700, priceInr: 80000 }),
    ];
    render(<BenchmarkPointTable points={points} metricId="cpu" resetKey="cpu" />);

    const bodyNames = () => rows().slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent);
    const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

    click('Brand');
    expect(bodyNames()).toEqual(['Alpha Phone', 'Beta Phone', 'Zeta Phone']);
    expect(screen.getByRole('columnheader', { name: /Brand/ })).toHaveAttribute('aria-sort', 'ascending');
    click('Brand');
    expect(bodyNames()).toEqual(['Zeta Phone', 'Alpha Phone', 'Beta Phone']);
    expect(screen.getByRole('columnheader', { name: /Brand/ })).toHaveAttribute('aria-sort', 'descending');

    click('Performance');
    expect(bodyNames()).toEqual(['Zeta Phone', 'Alpha Phone', 'Beta Phone']);
    click('Performance');
    expect(bodyNames()).toEqual(['Alpha Phone', 'Beta Phone', 'Zeta Phone']);

    click('Price');
    expect(bodyNames()).toEqual(['Alpha Phone', 'Beta Phone', 'Zeta Phone']);
    click('Price');
    expect(bodyNames()).toEqual(['Zeta Phone', 'Beta Phone', 'Alpha Phone']);
  });

  it('shows 25 rows per page, result range, and disabled pagination boundaries', () => {
    const points = Array.from({ length: 26 }, (_, index) => point({
      id: `phone-${index}`,
      phoneName: `Phone ${String(index + 1).padStart(2, '0')}`,
      x: index + 1,
    }));
    render(<BenchmarkPointTable points={points} metricId="cpu" resetKey="cpu" />);

    expect(rows()).toHaveLength(26);
    expect(screen.getByRole('status', { name: 'Benchmark result count' })).toHaveTextContent('Showing 1–25 of 26 results');
    expect(screen.getByRole('button', { name: 'Previous benchmark results' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next benchmark results' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next benchmark results' }));
    expect(rows()).toHaveLength(2);
    expect(screen.getByText('Phone 26')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Benchmark result count' })).toHaveTextContent('Showing 26 of 26 results');
    expect(screen.getByRole('button', { name: 'Next benchmark results' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous benchmark results' })).toBeEnabled();
  });

  it('resets the page after search, sort, metric, and filter reset-key changes', () => {
    const points = Array.from({ length: 26 }, (_, index) => point({ id: `phone-${index}`, phoneName: `Phone ${index + 1}` }));
    const { rerender } = render(<BenchmarkPointTable points={points} metricId="cpu" resetKey="all" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next benchmark results' }));
    expect(screen.getByText('Showing 26 of 26 results')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search benchmark devices' }), { target: { value: 'Phone' } });
    expect(screen.getByText('Showing 1–25 of 26 results')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Price' }));
    expect(screen.getByText('Showing 1–25 of 26 results')).toBeInTheDocument();

    rerender(<BenchmarkPointTable points={points.slice(0, 1)} metricId="ai" resetKey="filtered" />);
    expect(screen.getByText('Showing 1 of 1 result')).toBeInTheDocument();
  });

  it('does not resurrect a prior page when a search toggles away and back', () => {
    const points = Array.from({ length: 26 }, (_, index) => point({
      id: `phone-${index}`,
      phoneName: `Phone ${index + 1}`,
    }));
    render(<BenchmarkPointTable points={points} metricId="cpu" resetKey="all" />);

    fireEvent.click(screen.getByRole('button', { name: 'Next benchmark results' }));
    expect(screen.getByText('Showing 26 of 26 results')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: 'Search benchmark devices' });
    fireEvent.change(search, { target: { value: 'Phone 1' } });
    fireEvent.change(search, { target: { value: '' } });

    expect(screen.getByText('Showing 1–25 of 26 results')).toBeInTheDocument();
    expect(screen.getByText('Phone 1')).toBeInTheDocument();
    expect(screen.queryByText('Phone 26')).not.toBeInTheDocument();
  });

  it('resets to page one when the points collection changes', () => {
    const points = Array.from({ length: 26 }, (_, index) => point({
      id: `phone-${index}`,
      phoneName: `Phone ${index + 1}`,
    }));
    const { rerender } = render(<BenchmarkPointTable points={points} metricId="cpu" resetKey="same" />);

    fireEvent.click(screen.getByRole('button', { name: 'Next benchmark results' }));
    expect(screen.getByText('Showing 26 of 26 results')).toBeInTheDocument();

    rerender(<BenchmarkPointTable points={points.slice(0, 1)} metricId="cpu" resetKey="same" />);

    expect(screen.getByText('Showing 1 of 1 result')).toBeInTheDocument();
    expect(screen.getByText('Phone 1')).toBeInTheDocument();
  });

  it('renders metric-specific metadata columns and scoped headers', () => {
    const cases = [
      ['cpu', ['Single-core', 'Processor'], ['Backend', 'Accelerator', 'Precision']],
      ['ai', ['Backend', 'Accelerator', 'Precision', 'Processor'], ['Single-core']],
      ['gpu', ['FPS', 'Processor'], ['Single-core', 'Backend']],
      ['antutu', ['Processor'], ['Single-core', 'FPS', 'Backend']],
    ];

    for (const [metricId, included, excluded] of cases) {
      render(<BenchmarkPointTable points={[point({ details: {
        cpuGeekbench6SingleCore: 2200,
        aiBackend: 'NNAPI',
        aiAccelerator: 'NPU',
        aiPrecision: 'Quantized',
        gpuWildLifeExtremeFps: 42.5,
        processorName: 'Test SoC',
      } })]} metricId={metricId} resetKey={metricId} />);
      const table = screen.getByRole('table', { name: 'Benchmark points' });
      for (const label of included) expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument();
      for (const label of excluded) expect(within(table).queryByRole('columnheader', { name: label })).not.toBeInTheDocument();
      for (const header of within(table).getAllByRole('columnheader')) expect(header).toHaveAttribute('scope', 'col');
      table.remove();
    }
  });

  it('offers a reset action when search returns no results', () => {
    render(<BenchmarkPointTable points={[point()]} metricId="cpu" resetKey="cpu" />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search benchmark devices' }), { target: { value: 'nothing-here' } });

    expect(screen.getByRole('status', { name: 'Benchmark result count' })).toHaveTextContent('Showing 0 of 0 results');
    fireEvent.click(screen.getByRole('button', { name: 'Clear benchmark search' }));
    expect(screen.getByText('Pixel 9')).toBeInTheDocument();
  });
});
