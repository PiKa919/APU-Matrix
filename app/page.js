'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import PhonePricePerformanceChart from '@/components/PhonePricePerformanceChart';
import MissingPriceTable from '@/components/MissingPriceTable';
import { Button } from '@/components/ui/button';

const h = React.createElement;

async function requestRows() {
  const response = await fetch('/api/devices');
  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch devices');
  }

  return json.data;
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      setRows(await requestRows());
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    requestRows()
      .then((data) => {
        if (active) {
          setRows(data);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return h(
    'main',
    { className: 'min-h-screen bg-[#121212] text-foreground' },
    h(
      'header',
      { className: 'flex h-16 items-center justify-between border-b border-[#282828] px-6' },
      h(
        'div',
        { className: 'flex items-center gap-3' },
        h(
          'div',
          { className: 'flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground' },
          h(Cpu, { size: 18 })
        ),
        h(
          'div',
          null,
          h('h1', { className: 'text-lg font-semibold' }, 'APU Matrix'),
          h('p', { className: 'text-xs text-muted-foreground' }, 'Launch-price value analysis')
        )
      ),
      h(
        Button,
        { variant: 'outline', size: 'sm', onClick: fetchData, disabled: loading },
        h(RefreshCw, { className: loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4' }),
        'Refresh'
      )
    ),
    h(
      'div',
      { className: 'space-y-6 p-6' },
      loading && h(
        'div',
        { className: 'flex h-[420px] items-center justify-center border border-[#303030] bg-[#171717] text-sm text-muted-foreground' },
        'Preparing phone price data...'
      ),
      error && h(
        'div',
        { className: 'border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200' },
        error
      ),
      !loading && !error && h(
        React.Fragment,
        null,
        h(PhonePricePerformanceChart, { rows }),
        h(MissingPriceTable, { rows })
      )
    )
  );
}
