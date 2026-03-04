'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import PerformanceChart from '@/components/PerformanceChart';
import ProcessorChart from '@/components/ProcessorChart';
import Sidebar from '@/components/Filters';
import { RefreshCw, Cpu, BarChart3, Zap, Smartphone, Activity } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [lastScraped, setLastScraped] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedChipsets, setSelectedChipsets] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Initialize all brands and chipsets as selected
        const allBrands = new Set(json.data.map(d => d.brand).filter(Boolean));
        const chipsetSet = new Set();
        json.data.forEach(d => {
          if (d.chipset) {
            // Normalize chipset names to short form
            let chip = d.chipset;
            chip = chip.replace(/Qualcomm\s+SM\d+-?\w*\s+/i, '');
            chip = chip.replace(/MediaTek\s+MT\d+\/?\w*\s*/i, '');
            chip = chip.replace(/\s*\(\d+ nm\)/i, '');
            chipsetSet.add(chip);
          }
        });
        setSelectedBrands(allBrands);
        setSelectedChipsets(chipsetSet);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape');
      const json = await res.json();
      if (json.success) {
        setLastScraped(new Date().toLocaleString());
        fetchData();
      }
    } catch (error) {
      console.error('Scrape failed', error);
    } finally {
      setIsScraping(false);
    }
  };

  // Derived lists
  const brands = useMemo(() => {
    return Array.from(new Set(data.map(d => d.brand).filter(Boolean))).sort();
  }, [data]);

  const chipsets = useMemo(() => {
    const chipMap = new Set();
    data.forEach(d => {
      if (d.chipset) {
        let chip = d.chipset;
        chip = chip.replace(/Qualcomm\s+SM\d+-?\w*\s+/i, '');
        chip = chip.replace(/MediaTek\s+MT\d+\/?\w*\s*/i, '');
        chip = chip.replace(/\s*\(\d+ nm\)/i, '');
        chipMap.add(chip);
      }
    });
    return Array.from(chipMap).sort();
  }, [data]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (!selectedBrands.has(d.brand)) return false;
      return true;
    });
  }, [data, selectedBrands]);

  // Toggle handlers
  const onToggleBrand = useCallback((brand) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }, []);

  const onToggleChipset = useCallback((chip) => {
    setSelectedChipsets(prev => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }, []);

  const onSelectAllBrands = useCallback(() => {
    if (selectedBrands.size === brands.length) setSelectedBrands(new Set());
    else setSelectedBrands(new Set(brands));
  }, [brands, selectedBrands]);

  const onSelectAllChipsets = useCallback(() => {
    if (selectedChipsets.size === chipsets.length) setSelectedChipsets(new Set());
    else setSelectedChipsets(new Set(chipsets));
  }, [chipsets, selectedChipsets]);

  // Stats
  const stats = useMemo(() => {
    const withPrice = filteredData.filter(d => d.price);
    return {
      totalDevices: filteredData.length,
      avgScore: filteredData.length > 0 ? Math.round(filteredData.reduce((a, d) => a + (d.score || 0), 0) / filteredData.length) : 0,
      avgPrice: withPrice.length > 0 ? Math.round(withPrice.reduce((a, d) => a + d.price, 0) / withPrice.length) : 0,
      topScore: filteredData.length > 0 ? Math.max(...filteredData.map(d => d.score || 0)) : 0,
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header Bar ─── */}
      <header className="header-bar sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#facc15] to-[#f97316] flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <Cpu className="text-[#030815]" size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#facc15] leading-none">
              APU MATRIX
            </h1>
            <p className="text-[10px] text-[#BDE8F5]/40 font-medium tracking-widest uppercase">
              Benchmark Analytics Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[#BDE8F5]/35 font-mono tracking-wider uppercase">
              Live — {data.length} devices
            </span>
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15]/10 hover:bg-[#facc15]/20 text-[#facc15] rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 border border-[#facc15]/20 hover:border-[#facc15]/40 disabled:opacity-40"
          >
            <RefreshCw className={`${isScraping ? 'animate-spin' : ''}`} size={14} />
            {isScraping ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </header>

      {/* ─── Main Layout ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─── */}
        {!loading && (
          <Sidebar
            brands={brands}
            chipsets={chipsets}
            selectedBrands={selectedBrands}
            selectedChipsets={selectedChipsets}
            onToggleBrand={onToggleBrand}
            onToggleChipset={onToggleChipset}
            onSelectAllBrands={onSelectAllBrands}
            onSelectAllChipsets={onSelectAllChipsets}
          />
        )}

        {/* ─── Content ─── */}
        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#facc15]/50" />
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#facc15]/60" size={20} />
              </div>
              <p className="text-[#facc15]/40 text-xs tracking-[0.2em] uppercase font-mono">
                Loading benchmark data…
              </p>
            </div>
          ) : (
            <>
              {/* ─── Stat Cards ─── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone size={13} className="text-[#4988C4]/50" />
                    <span className="stat-label">Devices</span>
                  </div>
                  <div className="stat-value">{stats.totalDevices}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={13} className="text-[#4988C4]/50" />
                    <span className="stat-label">Avg Score</span>
                  </div>
                  <div className="stat-value">{stats.avgScore.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={13} className="text-[#4988C4]/50" />
                    <span className="stat-label">Top Score</span>
                  </div>
                  <div className="stat-value">{stats.topScore.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={13} className="text-[#4988C4]/50" />
                    <span className="stat-label">Avg Price</span>
                  </div>
                  <div className="stat-value">
                    {stats.avgPrice > 0 ? `₹${stats.avgPrice.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* ─── Chart 1: Phone Brand Performance ─── */}
              <div className="chart-section">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="chart-title flex items-center gap-2">
                      <Smartphone size={16} />
                      Phone Brand Performance
                    </h2>
                    <p className="chart-description mt-1">
                      Scatter plot comparing AnTuTu benchmark scores against market price (₹) for each device.
                      Higher is better for score; further right means more expensive. Identify the best value-for-money phones.
                    </p>
                  </div>
                </div>
                <PerformanceChart data={filteredData} />
              </div>

              {/* ─── Chart 2: Processor Rankings ─── */}
              <div className="chart-section">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="chart-title flex items-center gap-2">
                      <Cpu size={16} />
                      Processor Benchmark Rankings
                    </h2>
                    <p className="chart-description mt-1">
                      Average AnTuTu scores per chipset family across all tested devices.
                      Different phones with the same processor can score differently due to thermal design, RAM, and software optimization.
                    </p>
                  </div>
                </div>
                <ProcessorChart data={filteredData} />
              </div>

              {/* ─── Footer ─── */}
              <div className="flex items-center justify-between text-[10px] text-[#4988C4]/30 font-mono tracking-wider uppercase px-2 pb-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                  AnTuTu Engine v3 · GSMArena ₹ Prices
                </span>
                {lastScraped && <span>Last sync: {lastScraped}</span>}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
