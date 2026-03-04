'use client';

import { useMemo } from 'react';

// Brand color dots
const BRAND_DOTS = {
    'Apple': '#34d399',
    'Samsung': '#60a5fa',
    'Google': '#f472b6',
    'OnePlus': '#fb923c',
    'Xiaomi': '#a78bfa',
    'POCO': '#c084fc',
    'vivo': '#2dd4bf',
    'iQOO': '#38bdf8',
    'OPPO': '#f97316',
    'realme': '#fbbf24',
    'HONOR': '#818cf8',
    'Motorola': '#4ade80',
    'Red Magic': '#f87171',
    'Nothing': '#e879f9',
    'Asus': '#facc15',
    'TECNO': '#06b6d4',
    'Infinix': '#fb7185',
    'Huawei': '#ef4444',
    'Nubia': '#a3e635',
    'Lenovo': '#22d3ee',
    'ZTE': '#d946ef',
};

export default function Sidebar({ brands, chipsets, selectedBrands, selectedChipsets, onToggleBrand, onToggleChipset, onSelectAllBrands, onSelectAllChipsets }) {
    return (
        <aside className="sidebar h-full overflow-y-auto flex flex-col py-2">
            {/* ── Brand Filters ── */}
            <div className="sidebar-section-title flex items-center justify-between">
                <span>Brands</span>
                <button
                    onClick={onSelectAllBrands}
                    className="text-[9px] text-[#BDE8F5]/40 hover:text-[#facc15] transition-colors tracking-wider"
                >
                    {selectedBrands.size === brands.length ? 'NONE' : 'ALL'}
                </button>
            </div>

            <div className="flex flex-col">
                {brands.map(brand => (
                    <button
                        key={brand}
                        onClick={() => onToggleBrand(brand)}
                        className="flex items-center gap-2.5 px-4 py-[7px] hover:bg-white/[0.03] transition-colors group"
                    >
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                                background: selectedBrands.has(brand)
                                    ? (BRAND_DOTS[brand] || '#94a3b8')
                                    : 'rgba(73, 136, 196, 0.2)',
                                boxShadow: selectedBrands.has(brand)
                                    ? `0 0 6px ${BRAND_DOTS[brand] || '#94a3b8'}60`
                                    : 'none'
                            }}
                        />
                        <span className={`text-[12px] font-medium transition-colors truncate ${selectedBrands.has(brand) ? 'text-[#e2e8f0]' : 'text-[#4988C4]/50'}`}>
                            {brand}
                        </span>
                        <div className={`toggle-track ml-auto ${selectedBrands.has(brand) ? 'active' : ''}`}>
                            <div className="toggle-thumb" />
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Divider ── */}
            <div className="mx-4 my-3 border-t border-[#4988C4]/10" />

            {/* ── Chipset Filters ── */}
            <div className="sidebar-section-title flex items-center justify-between">
                <span>Processors</span>
                <button
                    onClick={onSelectAllChipsets}
                    className="text-[9px] text-[#BDE8F5]/40 hover:text-[#facc15] transition-colors tracking-wider"
                >
                    {selectedChipsets.size === chipsets.length ? 'NONE' : 'ALL'}
                </button>
            </div>

            <div className="flex flex-col pb-4">
                {chipsets.map(chip => (
                    <button
                        key={chip}
                        onClick={() => onToggleChipset(chip)}
                        className="flex items-center gap-2.5 px-4 py-[6px] hover:bg-white/[0.03] transition-colors group"
                    >
                        <span className={`text-[11px] font-medium transition-colors truncate flex-1 text-left ${selectedChipsets.has(chip) ? 'text-[#e2e8f0]' : 'text-[#4988C4]/40'}`}>
                            {chip}
                        </span>
                        <div className={`toggle-track ml-auto ${selectedChipsets.has(chip) ? 'active' : ''}`}>
                            <div className="toggle-thumb" />
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}
