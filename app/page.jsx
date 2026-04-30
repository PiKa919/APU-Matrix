'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import PerformanceChart from '@/components/PerformanceChart.jsx';
import ProcessorChart from '@/components/ProcessorChart.jsx';
import { Cpu, RefreshCw, Settings, User, LayoutDashboard, BarChart3, Binary, FileText } from 'lucide-react';
import Sidebar from '@/components/Filters.jsx';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Assuming cn utility is available

// Known phone manufacturers — filters out chipset names (Dimensity, Exynos, etc.) from the sidebar
const KNOWN_BRANDS = new Set([
  'Samsung', 'Apple', 'OnePlus', 'Google', 'Xiaomi', 'POCO', 'vivo', 'iQOO',
  'OPPO', 'realme', 'HONOR', 'Motorola', 'Red Magic', 'Nothing', 'Asus',
  'TECNO', 'Infinix', 'Huawei', 'Nubia', 'Lenovo'
]);

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [lastScraped, setLastScraped] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedChipsets, setSelectedChipsets] = useState(new Set());
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

        // Extract unique chipset families
        const families = new Set();
        json.data.forEach(d => {
          const chip = d.chipset || '';
          if (chip.includes('Snapdragon')) families.add('Snapdragon');
          else if (chip.includes('Dimensity')) families.add('Dimensity');
          else if (chip.includes('Apple')) families.add('Apple');
          else if (chip.includes('Exynos')) families.add('Exynos');
          else if (chip.includes('Google') || chip.includes('Tensor')) families.add('Google Tensor');
          else if (chip.includes('Kirin')) families.add('Kirin');
          else if (chip !== '') families.add('Other');
        });
        setSelectedChipsets(families);
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

  const chipsetFamilies = useMemo(() => {
    const families = new Set();
    data.forEach(d => {
      const chip = d.chipset || '';
      if (chip.includes('Snapdragon')) families.add('Snapdragon');
      else if (chip.includes('Dimensity')) families.add('Dimensity');
      else if (chip.includes('Apple')) families.add('Apple');
      else if (chip.includes('Exynos')) families.add('Exynos');
      else if (chip.includes('Google') || chip.includes('Tensor')) families.add('Google Tensor');
      else if (chip.includes('Kirin')) families.add('Kirin');
      else if (chip !== '') families.add('Other');
    });
    return Array.from(families).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const brandMatch = selectedBrands.has(d.brand);
      const chip = d.chipset || '';
      let chipFamily = 'Other';
      if (chip.includes('Snapdragon')) chipFamily = 'Snapdragon';
      else if (chip.includes('Dimensity')) chipFamily = 'Dimensity';
      else if (chip.includes('Apple')) chipFamily = 'Apple';
      else if (chip.includes('Exynos')) chipFamily = 'Exynos';
      else if (chip.includes('Google') || chip.includes('Tensor')) chipFamily = 'Google Tensor';
      else if (chip.includes('Kirin')) chipFamily = 'Kirin';

      const chipsetMatch = selectedChipsets.has(chipFamily) || (chip === '' && selectedChipsets.has('Other'));
      return brandMatch && chipsetMatch;
    });
  }, [data, selectedBrands, selectedChipsets]);

  const onToggleBrand = useCallback((brand) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }, []);

  const onToggleChipset = useCallback((chipset) => {
    setSelectedChipsets(prev => {
      const next = new Set(prev);
      if (next.has(chipset)) next.delete(chipset);
      else next.add(chipset);
      return next;
    });
  }, []);

  const onSelectAllBrands = useCallback(() => {
    if (selectedBrands.size === brands.length) setSelectedBrands(new Set());
    else setSelectedBrands(new Set(brands));
  }, [brands, selectedBrands]);

  const onSelectAllChipsets = useCallback(() => {
    if (selectedChipsets.size === chipsetFamilies.length) setSelectedChipsets(new Set());
    else setSelectedChipsets(new Set(chipsetFamilies));
  }, [chipsetFamilies, selectedChipsets]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ═══ HEADER BAR ═══ */}
      <header className="header-bar flex items-center justify-between px-6 h-[60px] flex-shrink-0 z-50 border-b relative">
        {/* Left: Logo + Subtitle */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <Cpu className="text-primary-foreground" size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground leading-none">
              APU Matrix
            </h1>
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide mt-1">
              SoC benchmark explorer
            </span>
          </div>
        </div>

        {/* Center: Nav Tabs (shadcn) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="bg-transparent h-full flex items-center gap-1 border-none">
            {[
              { id: 'Dashboard', icon: LayoutDashboard },
              { id: 'Analysis', icon: BarChart3 },
              { id: 'Compare', icon: Binary },
              { id: 'Reports', icon: FileText }
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-5 text-[12px] font-medium border-b-2 border-transparent transition-all gap-2"
              >
                <tab.icon size={14} />
                {tab.id}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Right: Actions */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleScrape}
              disabled={isScraping}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
              title="Sync Data"
            >
              <RefreshCw className={cn(isScraping && "animate-spin")} size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
              <Settings size={16} />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <User size={18} className="text-primary/60" />
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <p className="text-[12px] text-foreground font-semibold leading-none">Pika Admin</p>
              <Badge variant="outline" className="text-[9px] tracking-tight h-4 mt-1 border-primary/20 text-primary/70 px-1 py-0 leading-none">
                Pro operator
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ BODY: SIDEBAR + MAIN ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {!loading && (
          <Sidebar
            brands={brands}
            selectedBrands={selectedBrands}
            onToggleBrand={onToggleBrand}
            onSelectAllBrands={onSelectAllBrands}
            chipsets={chipsetFamilies}
            selectedChipsets={selectedChipsets}
            onToggleChipset={onToggleChipset}
            onSelectAllChipsets={onSelectAllChipsets}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar relative z-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Cpu className="text-primary animate-spin" size={32} />
              </div>
                <p className="text-[12px] font-semibold text-muted-foreground tracking-wider">Preparing device view...</p>
            </div>
          ) : (
            <Tabs value={activeTab} className="w-full h-full flex flex-col">
                <TabsContent value="Dashboard" className="mt-0 flex-1 space-y-6 animate-fade-in focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                  {/* Graph 1: Performance Timeline */}
                    <Card className="bg-card/80 border-border/60 overflow-hidden shadow-[0_16px_40px_rgba(18,31,33,0.08)] backdrop-blur-xl group flex flex-col animate-fade-in stagger-1 glass-card">
                    <CardHeader className="pb-0 pt-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <div>
                          <CardTitle className="text-foreground font-semibold text-[16px] tracking-tight">Performance vs price</CardTitle>
                          <CardDescription className="text-[11px] font-medium tracking-wide text-muted-foreground mt-0.5">
                            AnTuTu score plotted against retail price
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1 min-h-[400px]">
                      <PerformanceChart data={filteredData} />
                    </CardContent>
                  </Card>

                  {/* Graph 2: Processor Rankings */}
                    <Card className="bg-card/80 border-border/60 overflow-hidden shadow-[0_16px_40px_rgba(18,31,33,0.08)] backdrop-blur-xl group flex flex-col animate-fade-in stagger-2 glass-card">
                    <CardHeader className="pb-0 pt-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <div>
                          <CardTitle className="text-foreground font-semibold text-[16px] tracking-tight">SoC ranking</CardTitle>
                          <CardDescription className="text-[11px] font-medium tracking-wide text-muted-foreground mt-0.5">
                            Peak performance ranking by AnTuTu max
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1 min-h-[400px]">
                      <ProcessorChart data={filteredData} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="Analysis" className="flex-1 flex items-center justify-center border border-dashed border-border/40 rounded-3xl">
                <div className="text-center">
                  <BarChart3 size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium uppercase tracking-[0.3em] text-xs">Deep Analysis Engine Offline</p>
                </div>
              </TabsContent>

              {/* Footer */}
              <footer className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground/70 font-medium tracking-wide border-t border-border/30 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)] animate-pulse" />
                    <span>AnTuTu engine online</span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{filteredData.length} Devices Synced</span>
                </div>
                {lastScraped && <span>Last Sync Terminal Session: {lastScraped}</span>}
              </footer>
            </Tabs>
          )}

          {/* Background Grid Pattern (Subtle) */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none -z-10 bg-[radial-gradient(#7aa5a0_1px,transparent_1px)] [background-size:44px_44px]" />
        </main>
      </div>
    </div>
  );
}
