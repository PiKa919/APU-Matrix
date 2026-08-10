'use client';

import { useMemo, useState } from 'react';

export const PAGE_SIZE = 25;

const SORT_COLUMNS = new Set(['brand', 'performance', 'price']);

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-IN') : 'N/A';
}

function formatPrice(value) {
  return typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : 'N/A';
}

function processorFor(point) {
  return point.processorName || point.details?.processorName || '';
}

function detailFor(point, key) {
  return point.details?.[key] ?? point[key];
}

function metricColumns(metricId) {
  const columns = {
    cpu: [
      { key: 'singleCore', label: 'Single-core', value: (point) => detailFor(point, 'cpuGeekbench6SingleCore'), format: formatNumber },
      { key: 'processor', label: 'Processor', value: processorFor, format: (value) => value || 'N/A' },
    ],
    ai: [
      { key: 'backend', label: 'Backend', value: (point) => detailFor(point, 'aiBackend'), format: (value) => value || 'N/A' },
      { key: 'accelerator', label: 'Accelerator', value: (point) => detailFor(point, 'aiAccelerator'), format: (value) => value || 'N/A' },
      { key: 'precision', label: 'Precision', value: (point) => detailFor(point, 'aiPrecision'), format: (value) => value || 'N/A' },
      { key: 'processor', label: 'Processor', value: processorFor, format: (value) => value || 'N/A' },
    ],
    gpu: [
      { key: 'fps', label: 'FPS', value: (point) => detailFor(point, 'gpuWildLifeExtremeFps'), format: formatNumber },
      { key: 'processor', label: 'Processor', value: processorFor, format: (value) => value || 'N/A' },
    ],
    antutu: [
      { key: 'processor', label: 'Processor', value: processorFor, format: (value) => value || 'N/A' },
    ],
  };
  return columns[metricId] || columns.cpu;
}

function compareValues(first, second) {
  if (first === second) return 0;
  if (first === null || first === undefined || first === '') return 1;
  if (second === null || second === undefined || second === '') return -1;
  if (typeof first === 'number' && typeof second === 'number') return first - second;
  return String(first).localeCompare(String(second), undefined, { sensitivity: 'base' });
}

function compareRows(first, second, sort) {
  if (!sort) return 0;
  const valueFor = {
    brand: (point) => point.phoneBrand || '',
    performance: (point) => point.x,
    price: (point) => point.priceInr,
  }[sort.key];
  const primary = compareValues(valueFor(first), valueFor(second));
  const tieByPhone = String(first.phoneName || '').localeCompare(String(second.phoneName || ''), undefined, { sensitivity: 'base' });
  const tieById = String(first.id || '').localeCompare(String(second.id || ''), undefined, { sensitivity: 'base' });
  if (primary) return sort.direction === 'desc' ? -primary : primary;
  return tieByPhone || tieById;
}

function searchValue(point) {
  return [point.phoneName, point.phoneBrand, processorFor(point)].filter(Boolean).join(' ').toLocaleLowerCase();
}

function resultLabel(start, end, total) {
  if (!total) return 'Showing 0 of 0 results';
  const noun = total === 1 ? 'result' : 'results';
  return start === end
    ? `Showing ${start} of ${total} ${noun}`
    : `Showing ${start}–${end} of ${total} ${noun}`;
}

export default function BenchmarkPointTable({ points = [], metricId = 'cpu', resetKey = '' }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(null);
  const columns = useMemo(() => metricColumns(metricId), [metricId]);
  const inputSignature = useMemo(() => JSON.stringify({
    metricId,
    resetKey,
    search,
    sort,
    points: points.map((point) => ({
      id: point.id,
      phoneName: point.phoneName,
      phoneBrand: point.phoneBrand,
      processor: processorFor(point),
      x: point.x,
      priceInr: point.priceInr,
      singleCore: detailFor(point, 'cpuGeekbench6SingleCore'),
      backend: detailFor(point, 'aiBackend'),
      accelerator: detailFor(point, 'aiAccelerator'),
      precision: detailFor(point, 'aiPrecision'),
      fps: detailFor(point, 'gpuWildLifeExtremeFps'),
    })),
  }), [metricId, points, resetKey, search, sort]);
  const [pageState, setPageState] = useState({ signature: '', page: 1 });

  const searchedPoints = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return points;
    return points.filter((point) => searchValue(point).includes(query));
  }, [points, search]);

  const sortedPoints = useMemo(() => {
    if (!sort) return searchedPoints;
    return [...searchedPoints].sort((first, second) => compareRows(first, second, sort));
  }, [searchedPoints, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedPoints.length / PAGE_SIZE));
  const page = pageState.signature === inputSignature ? pageState.page : 1;
  const visiblePage = Math.min(page, pageCount);
  const pagedPoints = useMemo(
    () => sortedPoints.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE),
    [sortedPoints, visiblePage],
  );
  const firstResult = sortedPoints.length ? (visiblePage - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = sortedPoints.length ? firstResult + pagedPoints.length - 1 : 0;

  function toggleSort(key) {
    if (!SORT_COLUMNS.has(key)) return;
    setSort((current) => current?.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  }

  function clearSearch() {
    setSearch('');
  }

  function changePage(nextPage) {
    setPageState({ signature: inputSignature, page: nextPage });
  }

  const headers = [
    { key: 'device', label: 'Device' },
    { key: 'brand', label: 'Brand', sortable: true },
    { key: 'performance', label: 'Performance', sortable: true },
    { key: 'price', label: 'Price', sortable: true },
    ...columns,
  ];

  return (
    <section className="benchmark-point-table" aria-labelledby="benchmark-points-heading">
      <div className="benchmark-table-heading">
        <div>
          <div className="section-kicker">Data points</div>
          <h3 id="benchmark-points-heading">Benchmark details</h3>
        </div>
        <label className="benchmark-search">
          <span>Search benchmark devices</span>
          <input
            type="search"
            aria-label="Search benchmark devices"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search device, brand, or processor"
          />
        </label>
      </div>

      <div className="benchmark-result-count" role="status" aria-live="polite" aria-label="Benchmark result count">
        {resultLabel(firstResult, lastResult, sortedPoints.length)}
      </div>

      {sortedPoints.length === 0 && search.trim() ? (
        <div className="benchmark-table-empty" role="status">
          <p>No benchmark devices match “{search}”.</p>
          <button type="button" className="button button-secondary" onClick={clearSearch}>Clear benchmark search</button>
        </div>
      ) : null}

      <div className="benchmark-table-wrap">
        <table aria-label="Benchmark points">
          <thead>
            <tr>
              {headers.map((header) => {
                const activeSort = sort?.key === header.key ? sort.direction : null;
                return (
                  <th key={header.key} scope="col" aria-sort={header.sortable ? (activeSort === 'asc' ? 'ascending' : activeSort === 'desc' ? 'descending' : 'none') : undefined}>
                    {header.sortable ? (
                      <button type="button" className="benchmark-sort-button" onClick={() => toggleSort(header.key)}>
                        {header.label}<span aria-hidden="true">{activeSort === 'asc' ? ' ↑' : activeSort === 'desc' ? ' ↓' : ' ↕'}</span>
                      </button>
                    ) : header.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedPoints.map((point) => (
              <tr key={point.id}>
                <td>{point.phoneName || 'Unknown device'}</td>
                <td>{point.phoneBrand || 'Unknown'}</td>
                <td>{formatNumber(point.x)}</td>
                <td>{formatPrice(point.priceInr)}</td>
                {columns.map((column) => <td key={column.key}>{column.format(column.value(point))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="benchmark-pagination" aria-label="Benchmark pagination">
        <button type="button" className="button button-secondary" onClick={() => changePage(Math.max(1, visiblePage - 1))} disabled={visiblePage <= 1} aria-label="Previous benchmark results">Previous</button>
        <span>Page {visiblePage} of {pageCount}</span>
        <button type="button" className="button button-secondary" onClick={() => changePage(Math.min(pageCount, visiblePage + 1))} disabled={visiblePage >= pageCount} aria-label="Next benchmark results">Next</button>
      </nav>
    </section>
  );
}
