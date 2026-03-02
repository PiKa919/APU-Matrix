'use client';

import { useEffect, useState, useMemo } from 'react';
import PerformanceChart from '@/components/PerformanceChart';
import Filters from '@/components/Filters';
import { motion } from 'framer-motion';
import { RefreshCw, Cpu } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [isScraping, setIsScraping] = useState(false);
  const [lastScraped, setLastScraped] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape');
      const json = await res.json();
      if (json.success) {
        setLastScraped(new Date().toLocaleString());
        fetchData(); // Refresh data with newly scraped items
      }
    } catch (error) {
      console.error('Scrape failed', error);
    } finally {
      setIsScraping(false);
    }
  };

  const brands = useMemo(() => {
    const uniqueBrands = new Set(data.map(d => d.brand).filter(Boolean));
    return Array.from(uniqueBrands).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedBrand === 'All') return data;
    return data.filter(d => d.brand === selectedBrand);
  }, [data, selectedBrand]);

  return (
    <main className="min-h-screen p-6 md:p-12 lg:px-20 max-w-7xl mx-auto flex flex-col pt-16">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6"
      >
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BDE8F5] via-[#4988C4] to-[#1C4D8D] flex items-center gap-4 drop-shadow-[0_0_15px_rgba(73,136,196,0.5)] tracking-tight">
            <Cpu className="text-[#BDE8F5] drop-shadow-[0_0_10px_rgba(189,232,245,0.8)]" size={48} />
            APU MATRIX
          </h1>
          <p className="text-[#4988C4] mt-3 text-lg md:text-xl max-w-2xl font-light tracking-wide">
            Real-time AnTuTu benchmark tracking versus market price analysis.
          </p>
        </div>

        <button
          onClick={handleScrape}
          disabled={isScraping}
          className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#1C4D8D] to-[#0F2854] hover:from-[#4988C4] hover:to-[#1C4D8D] text-white rounded-2xl font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(28,77,141,0.5)] hover:shadow-[0_4px_30px_rgba(73,136,196,0.7)] disabled:opacity-50 border border-[#4988C4]/30 uppercase tracking-widest text-sm"
        >
          <RefreshCw className={`${isScraping ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} size={20} />
          {isScraping ? 'SYNCING AI...' : 'FORCE SYNC'}
        </button>
      </motion.div>

      {loading ? (
        <div className="h-[600px] w-full flex flex-col items-center justify-center glass-panel gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-[#1C4D8D]"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#4988C4] absolute top-4 left-4" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#BDE8F5] absolute top-8 left-8" style={{ animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-[#4988C4] tracking-widest animate-pulse font-mono text-sm">INITIALIZING DATA CORE...</p>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          <Filters
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
          />
          <PerformanceChart data={filteredData} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 flex justify-between text-xs md:text-sm text-[#4988C4]/60 px-4 font-mono uppercase tracking-wider"
          >
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              DATA CONNECTED: ANTUTU ENGINE V3.0
            </p>
            {lastScraped && <p>LATEST SYNC: {lastScraped}</p>}
          </motion.div>
        </div>
      )}
    </main>
  );
}
