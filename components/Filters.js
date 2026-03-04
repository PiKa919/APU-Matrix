'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// Brand icons/logos - first letter styled with brand color
const BRAND_META = {
    'Samsung': { color: '#60a5fa', icon: 'S' },
    'Apple': { color: '#34d399', icon: '' },
    'OnePlus': { color: '#fb923c', icon: '1+' },
    'Google': { color: '#f472b6', icon: 'G' },
    'Xiaomi': { color: '#a78bfa', icon: 'Mi' },
    'POCO': { color: '#c084fc', icon: 'P' },
    'vivo': { color: '#2dd4bf', icon: 'V' },
    'iQOO': { color: '#38bdf8', icon: 'iQ' },
    'OPPO': { color: '#f97316', icon: 'O' },
    'realme': { color: '#fbbf24', icon: 'r' },
    'HONOR': { color: '#818cf8', icon: 'H' },
    'Motorola': { color: '#4ade80', icon: 'M' },
    'Red Magic': { color: '#f87171', icon: 'RM' },
    'Nothing': { color: '#e879f9', icon: '(·)' },
    'Asus': { color: '#facc15', icon: '⊕' },
    'TECNO': { color: '#06b6d4', icon: 'T' },
    'Infinix': { color: '#fb7185', icon: '∞' },
    'Huawei': { color: '#ef4444', icon: 'Hw' },
    'Nubia': { color: '#a3e635', icon: 'N' },
    'Lenovo': { color: '#22d3ee', icon: 'Le' },
};

export default function Sidebar({ brands, selectedBrands, onToggleBrand, onSelectAllBrands }) {
    const [search, setSearch] = useState('');

    const filteredBrands = useMemo(() => {
        if (!search.trim()) return brands;
        return brands.filter(b => b.toLowerCase().includes(search.toLowerCase()));
    }, [brands, search]);

    return (
        <aside className="sidebar h-full overflow-y-auto flex flex-col">
            {/* Section Title */}
            <div className="sidebar-title flex items-center justify-between pr-4">
                <span>BRAND</span>
                <button
                    onClick={onSelectAllBrands}
                    className="text-[9px] text-[#BDE8F5]/30 hover:text-[#facc15] transition-colors tracking-wider font-semibold"
                >
                    {selectedBrands.size === brands.length ? 'NONE' : 'ALL'}
                </button>
            </div>

            {/* Brand Items */}
            <div className="flex flex-col gap-[2px] flex-1">
                {filteredBrands.map(brand => {
                    const meta = BRAND_META[brand] || { color: '#94a3b8', icon: brand.charAt(0) };
                    const isActive = selectedBrands.has(brand);

                    return (
                        <button
                            key={brand}
                            onClick={() => onToggleBrand(brand)}
                            className={`brand-item ${isActive ? '' : 'inactive'}`}
                        >
                            <div
                                className="brand-icon"
                                style={{
                                    background: isActive ? meta.color : 'rgba(60, 100, 160, 0.25)',
                                    boxShadow: isActive ? `0 0 8px ${meta.color}40` : 'none',
                                }}
                            >
                                {meta.icon}
                            </div>
                            <span className="brand-name">{brand}</span>
                            <div className={`toggle-track ${isActive ? 'active' : ''}`}>
                                <div className="toggle-thumb" />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Search Box */}
            <div className="relative mt-auto">
                <Search size={13} className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[#4988C4]/30" />
                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-box pl-8"
                />
            </div>
        </aside>
    );
}
