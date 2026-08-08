'use client';

import { createElement as h, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';
import ThemeToggle, { useTheme } from '@/components/ThemeToggle';
import LeaderboardStage from '@/components/LeaderboardStage';
import DeviceSnapshotTable from '@/components/DeviceSnapshotTable';
import FieldNotesPreview from '@/components/FieldNotesPreview';

const HeroProcessorScene = dynamic(() => import('@/components/HeroProcessorScene'), {
  ssr: false,
  loading: () => h('div', { className: 'hero-scene', 'aria-label': 'Processor lattice loading', role: 'img' }),
});

async function requestRows() {
  const response = await fetch('/api/devices');
  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch devices');
  }

  return json.data;
}

async function requestBenchmarks() {
  const response = await fetch('/api/benchmarks');
  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch benchmark data');
  return json.data;
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(true);
  const [benchmarkError, setBenchmarkError] = useState(null);
  const theme = useTheme();

  const fetchData = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestRows();
      if (isActive()) {
        setRows(data);
        setLastUpdated(new Date());
      }
    } catch (fetchError) {
      if (isActive()) {
        setError(fetchError.message);
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

  const fetchBenchmarks = useCallback(async (isActive = () => true) => {
    setBenchmarkLoading(true);
    setBenchmarkError(null);
    try {
      const data = await requestBenchmarks();
      if (isActive()) setBenchmarkData(data);
    } catch (fetchError) {
      if (isActive()) setBenchmarkError(fetchError.message);
    } finally {
      if (isActive()) setBenchmarkLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchData(() => active);
    fetchBenchmarks(() => active);

    return () => {
      active = false;
    };
  }, [fetchData, fetchBenchmarks]);

  return h(
    'div',
    { className: 'site-shell' },
    h(
      'header',
      { className: 'topbar', role: 'banner' },
      h('a', { className: 'wordmark', href: '#top', 'aria-label': 'APU Matrix overview' }, 'APU Matrix'),
      h(
        'nav',
        { 'aria-label': 'Primary navigation' },
        h('a', { href: '#top' }, 'Overview'),
        h('span', { 'aria-label': 'Devices coming soon' }, 'Devices ', h('span', { className: 'coming-soon-badge', 'aria-hidden': true }, 'Coming soon')),
        h('span', { 'aria-label': 'Processors coming soon' }, 'Processors ', h('span', { className: 'coming-soon-badge', 'aria-hidden': true }, 'Coming soon')),
        h('span', { 'aria-label': 'Field Notes coming soon' }, 'Field Notes ', h('span', { className: 'coming-soon-badge', 'aria-hidden': true }, 'Coming soon'))
      ),
      h(
        'div',
        { className: 'topbar-actions' },
        h(ThemeToggle),
        h(
          'button',
          { type: 'button', className: 'refresh-button', onClick: () => { fetchData(); fetchBenchmarks(); }, disabled: loading || benchmarkLoading, 'aria-label': 'Refresh data' },
          h(RefreshCw, { 'aria-hidden': true, size: 15, className: loading ? 'spin' : '' }),
          h('span', null, loading ? 'Refreshing' : 'Refresh')
        )
      )
    ),
    h(
      'main',
      { id: 'top', className: 'page-content' },
      h(
        'section',
        { className: 'hero', 'aria-labelledby': 'hero-heading' },
        h(
          'div',
          { className: 'hero-copy' },
          h('span', { className: 'section-kicker' }, 'Phone performance research'),
          h('h1', { id: 'hero-heading' }, 'Benchmark context, not just a score.'),
          h('p', null, 'APU Matrix brings device performance, processor context, and pricing into one readable research surface.'),
          h('a', { className: 'hero-cta', href: '#leaderboard' }, 'Explore leaderboard')
        ),
        h(HeroProcessorScene)
      ),
      h(LeaderboardStage, { id: 'leaderboard', loading, error, lastUpdated, benchmarkData, benchmarkLoading, benchmarkError, theme }),
      h(
        'section',
        { className: 'insight-strip', 'aria-label': 'How future benchmark views are read' },
        h('article', null, h('h2', null, 'CPU'), h('p', null, 'App responsiveness and sustained general compute.')),
        h('article', null, h('h2', null, 'GPU'), h('p', null, 'Gaming and graphics workloads under comparable tests.')),
        h('article', null, h('h2', null, 'AI'), h('p', null, 'On-device model throughput with the backend identified.'))
      ),
      h(DeviceSnapshotTable, { rows, loading, error }),
      h(FieldNotesPreview)
    )
  );
}
