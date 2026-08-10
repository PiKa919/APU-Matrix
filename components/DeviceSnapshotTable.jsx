import { useMemo, useState } from 'react';

const PAGE_SIZE = 25;

const SORT_COLUMNS = [
  { key: 'phone', label: 'Phone', value: (row) => row.phoneName, type: 'text' },
  { key: 'antutu', label: 'AnTuTu', value: (row) => row.antutuScore, type: 'number' },
  { key: 'price', label: 'Price', value: (row) => row.price, type: 'number' },
];

const numberFormatter = new Intl.NumberFormat('en-US');

function isNumber(value) {
  return Number.isFinite(value);
}

function number(value) {
  return isNumber(value) ? numberFormatter.format(value) : 'Not available';
}

function price(value) {
  return isNumber(value) ? `₹${numberFormatter.format(value)}` : 'Not available';
}

function label(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Not available';
}

function normalizedText(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en-IN');
}

function compareValues(first, second, type) {
  if (type === 'number') {
    const firstMissing = !isNumber(first);
    const secondMissing = !isNumber(second);
    if (firstMissing || secondMissing) {
      if (firstMissing && secondMissing) return 0;
      return firstMissing ? 1 : -1;
    }
    return first - second;
  }

  return normalizedText(first).localeCompare(normalizedText(second), 'en', { numeric: true });
}

function createRowModel(row, index) {
  const plottedPrice = row.plottedPrice ?? {};
  return {
    id: row.id ?? `device-${index}`,
    phoneName: row.phoneName ?? 'Not available',
    processorName: row.processorName ?? 'Not available',
    antutuScore: isNumber(row.antutuScore) ? row.antutuScore : null,
    price: isNumber(plottedPrice.normalizedINR) ? plottedPrice.normalizedINR : null,
    priceType: plottedPrice.priceType ?? null,
  };
}

function pageSignature(rows, search, sortKey, sortDirection) {
  return [
    normalizedText(search),
    sortKey ?? 'none',
    sortDirection,
    rows.map((row) => `${row.id}:${row.phoneName}:${row.processorName}:${row.antutuScore}:${row.price}`).join('|'),
  ].join('::');
}

export default function DeviceSnapshotTable({ rows = [], loading = false, error = null }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [pageState, setPageState] = useState({ page: 1, signature: null });

  const rowModels = useMemo(() => rows.map(createRowModel), [rows]);
  const resetSignature = pageSignature(rowModels, search, sortKey, sortDirection);

  const filteredRows = useMemo(() => {
    const query = normalizedText(search);
    if (!query) return rowModels;

    return rowModels.filter((row) => [row.phoneName, row.processorName].some((value) => normalizedText(value).includes(query)));
  }, [rowModels, search]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = SORT_COLUMNS.find((item) => item.key === sortKey);
    if (!column) return filteredRows;

    return [...filteredRows].sort((first, second) => {
      const comparison = compareValues(column.value(first), column.value(second), column.type);
      if (comparison !== 0) return sortDirection === 'asc' ? comparison : -comparison;
      return normalizedText(first.phoneName).localeCompare(normalizedText(second.phoneName), 'en', { numeric: true });
    });
  }, [filteredRows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const page = pageState.signature === resetSignature ? pageState.page : 1;
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [safePage, sortedRows]);
  const firstResult = sortedRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(safePage * PAGE_SIZE, sortedRows.length);

  function sortBy(nextKey) {
    setPageState({ page: 1, signature: null });
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(nextKey);
    setSortDirection('asc');
  }

  function clearSearch() {
    setSearch('');
    setPageState({ page: 1, signature: null });
  }

  function updateSearch(value) {
    setSearch(value);
    setPageState({ page: 1, signature: null });
  }

  if (loading) return <section className="snapshot-panel shrink-safe" role="status">Loading current device data</section>;
  if (error) return <section className="snapshot-panel snapshot-error shrink-safe" role="alert">{error}</section>;

  const hasRows = rowModels.length > 0;
  const hasSearchResults = sortedRows.length > 0;

  return (
    <section className="snapshot-panel shrink-safe" aria-labelledby="device-snapshot-heading">
      <div className="snapshot-heading">
        <div><span className="section-kicker">Available dataset</span><h2 id="device-snapshot-heading">Device snapshot</h2></div>
        <p>{rowModels.length} device records from the current local dataset</p>
      </div>
      {hasRows && (
        <div className="snapshot-controls">
          <label className="snapshot-search">
            <span>Search devices</span>
            <input
              type="search"
              aria-label="Search devices"
              placeholder="Phone or processor"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </label>
          <p className="snapshot-result-count" aria-live="polite">
            {hasSearchResults ? `Showing ${firstResult}–${lastResult} of ${sortedRows.length} devices` : 'No device records match the current search'}
          </p>
        </div>
      )}
      {!hasRows ? <p>No device records are available yet.</p> : !hasSearchResults ? (
        <div className="snapshot-empty" role="status">
          <p>No device records match the current search.</p>
          <button type="button" className="button button-secondary" onClick={clearSearch}>Reset search</button>
        </div>
      ) : (
        <>
          <div className="snapshot-scroll shrink-safe">
            <table className="snapshot-table" aria-label="Current device data">
              <thead>
                <tr>
                  {['phone', 'processor', 'antutu', 'price', 'priceType'].map((columnKey) => {
                    if (columnKey === 'processor' || columnKey === 'priceType') {
                      return <th key={columnKey} scope="col" aria-sort="none">{columnKey === 'processor' ? 'Processor' : 'Price type'}</th>;
                    }
                    const column = SORT_COLUMNS.find((item) => item.key === columnKey);
                    const active = sortKey === column.key;
                    return (
                      <th key={column.key} scope="col" aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" className="snapshot-sort-button" aria-label={column.label} onClick={() => sortBy(column.key)}>
                          {column.label}
                          <span aria-hidden="true">{active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((device) => (
                  <tr key={device.id}>
                    <td data-label="Phone">{device.phoneName}</td>
                    <td data-label="Processor">{device.processorName}</td>
                    <td data-label="AnTuTu score">{number(device.antutuScore)}</td>
                    <td data-label="Price">{price(device.price)}</td>
                    <td data-label="Price type">{label(device.priceType)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav className="snapshot-pagination" aria-label="Device snapshot pagination">
              <button type="button" className="button button-secondary" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPageState({ page: Math.max(1, safePage - 1), signature: resetSignature })}>Previous</button>
              <span aria-live="polite">Page {safePage} of {totalPages}</span>
              <button type="button" className="button button-secondary" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPageState({ page: Math.min(totalPages, safePage + 1), signature: resetSignature })}>Next</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
