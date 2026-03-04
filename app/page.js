'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import PerformanceChart from '@/components/PerformanceChart';
import ProcessorChart from '@/components/ProcessorChart';
import Sidebar from '@/components/Filters';
import { RefreshCw, Cpu, Settings, User } from 'lucide-react';

// Known phone manufacturers — filters out chipset names (Dimensity, Exynos, etc.) from the sidebar
const KNOWN_BRANDS = new Set([
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'POCO', 'vivo', 'iQOO',
  'OPPO', 'realme', 'HONOR', 'Motorola', 'Red Magic', 'Nothing', 'Asus',
  'TECNO', 'Infinix', 'Huawei', 'Nubia', 'Lenovo', 'ZTE', 'Nokia', 'Sony',
  'Meizu', 'Legion', 'ROG', 'Black Shark', 'HTC', 'LG',
]);

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [lastScraped, setLastScraped] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [activeTab, setActiveTab] = useState('Dashboard');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        const allBrands = new Set(json.data.map(d => d.brand).filter(Boolean));
        setSelectedBrands(allBrands);
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

  const brands = useMemo(() => {
    return Array.from(new Set(data.map(d => d.brand).filter(b => b && KNOWN_BRANDS.has(b)))).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => selectedBrands.has(d.brand));
  }, [data, selectedBrands]);

  const onToggleBrand = useCallback((brand) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }, []);

  const onSelectAllBrands = useCallback(() => {
    if (selectedBrands.size === brands.length) setSelectedBrands(new Set());
    else setSelectedBrands(new Set(brands));
  }, [brands, selectedBrands]);

  const tabs = ['Dashboard', 'Analysis', 'Compare', 'Reports'];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ═══ HEADER BAR ═══ */}
      <header className="header-bar flex items-center justify-between px-6 py-0 h-[52px] flex-shrink-0 z-50">
        {/* Left: Logo + Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#facc15] to-[#f97316] flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.25)]">
            <Cpu className="text-[#060d1f]" size={17} strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[18px] font-extrabold tracking-tight text-[#facc15] leading-none">
              APU MATRIX
            </h1>
            <span className="text-[10px] text-[#BDE8F5]/30 font-medium tracking-wider uppercase">
              Mobile Chipset Performance Benchmark Analyzer
            </span>
          </div>
        </div>

        {/* Center: Nav Tabs */}
        <nav className="flex items-center gap-1 h-full">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-tab h-full flex items-center ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Right: Settings + Avatar */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="flex items-center gap-1.5 text-[11px] text-[#BDE8F5]/40 hover:text-[#facc15] transition-colors"
            title="Force sync data"
          >
            <RefreshCw className={`${isScraping ? 'animate-spin' : ''}`} size={13} />
          </button>
          <Settings size={16} className="text-[#BDE8F5]/25 hover:text-[#BDE8F5]/60 transition-colors cursor-pointer" />
          <div className="flex items-center gap-2 pl-3 border-l border-[#BDE8F5]/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4988C4] to-[#1C4D8D] flex items-center justify-center">
              <User size={14} className="text-white/80" />
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] text-[#BDE8F5]/70 font-medium leading-none">Admin</p>
              <p className="text-[9px] text-[#BDE8F5]/30 leading-none mt-0.5">Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ BODY: SIDEBAR + MAIN ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!loading && (
          <Sidebar
            brands={brands}
            selectedBrands={selectedBrands}
            onToggleBrand={onToggleBrand}
            onSelectAllBrands={onSelectAllBrands}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#facc15]/40" />
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#facc15]/50" size={18} />
              </div>
              <p className="text-[#facc15]/30 text-xs tracking-[0.2em] uppercase font-mono">
                Loading benchmark data…
              </p>
            </div>
          ) : (
            <>
              {/* ─── Chart 1: Phone Brand Performance ─── */}
              <div className="chart-panel animate-fade-in">
                <div className="mb-4">
                  <h2 className="chart-title">Phone Brand Performance</h2>
                  <p className="chart-description">
                    Scatter plot correlating benchmark scores and market price across leading smartphone brands.
                    Data points represent individual device tests.
                  </p>
                </div>
                <PerformanceChart data={filteredData} />
              </div>

              {/* ─── Chart 2: Processor Benchmark Rankings ─── */}
              <div className="chart-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <div className="mb-4">
                  <h2 className="chart-title">Processor Benchmark Rankings</h2>
                  <p className="chart-description">
                    Comparison of peak performance scores across major mobile system-on-chip (SoC) families and specific models.
                  </p>
                </div>
                <ProcessorChart data={filteredData} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[9px] text-[#4988C4]/25 font-mono tracking-wider uppercase px-1 pb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse" />
                  AnTuTu Engine v3 · GSMArena Prices · {filteredData.length} devices
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
