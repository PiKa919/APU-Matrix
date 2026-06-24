'use client';

import { useMemo, useState } from 'react';

const BRAND_COLORS = {
  Snapdragon: '#ff8b55',
  MediaTek: '#4fd1c5',
  Exynos: '#8aa7ff',
  Tensor: '#52c987',
  Kirin: '#f3b85b',
  Apple: '#7cc7a5',
  Unisoc: '#d782d9',
  Other: '#9ca3af',
};

function formatPrice(value) {
  if (value >= 100000) return `INR ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `INR ${Math.round(value / 1000)}K`;
  return `INR ${value}`;
}

function formatScore(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function project(row, bounds) {
  const x = ((row.antutuScore - bounds.minScore) / (bounds.maxScore - bounds.minScore || 1)) * 100;
  const y = 100 - ((row.plottedPrice.normalizedINR - bounds.minPrice) / (bounds.maxPrice - bounds.minPrice || 1)) * 100;
  return { x, y };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

export default function PhonePricePerformanceChart({ rows = [] }) {
  const processorBrands = useMemo(() => uniqueSorted(rows.map((row) => row.processorBrand)), [rows]);
  const [selectedBrand, setSelectedBrand] = useState('All');

  const filteredRows = useMemo(() => {
    return rows.filter((row) => selectedBrand === 'All' || row.processorBrand === selectedBrand);
  }, [rows, selectedBrand]);

  const plottedRows = useMemo(() => {
    return filteredRows.filter((row) => row.plottedPrice);
  }, [filteredRows]);

  const bounds = useMemo(() => {
    const scores = plottedRows.map((row) => row.antutuScore);
    const prices = plottedRows.map((row) => row.plottedPrice.normalizedINR);
    return {
      minScore: Math.min(...scores, 0),
      maxScore: Math.max(...scores, 1),
      minPrice: Math.min(...prices, 0),
      maxPrice: Math.max(...prices, 1),
    };
  }, [plottedRows]);

  const currentFallbackCount = plottedRows.filter((row) => row.plottedPrice.priceType === 'current').length;
  const missingPriceCount = filteredRows.filter((row) => !row.plottedPrice).length;

  return (
    <section className="border border-[#303030] bg-[#171717] p-5 text-foreground">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Phone price performance</h2>
          <p className="text-xs text-muted-foreground">AnTuTu score vs launch price, with current-price fallback markers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedBrand('All')}
            className="border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor: selectedBrand === 'All' ? '#d4d4d4' : '#303030',
              color: selectedBrand === 'All' ? '#f5f5f5' : '#777',
              background: selectedBrand === 'All' ? '#ffffff14' : 'transparent',
            }}
          >
            All
          </button>
          {processorBrands.map((brand) => {
            const color = BRAND_COLORS[brand] || BRAND_COLORS.Other;
            const active = selectedBrand === brand;

            return (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className="border px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderColor: active ? color : '#303030',
                  color: active ? color : '#777',
                  background: active ? `${color}18` : 'transparent',
                }}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>{plottedRows.length} plotted</span>
        <span>{currentFallbackCount} current fallback</span>
        <span>{missingPriceCount} missing price</span>
      </div>

      <div
        aria-label="phone price performance scatter plot"
        role="img"
        className="relative h-[560px] overflow-hidden border border-[#303030] bg-[#1d1d1d]"
      >
        <div className="absolute inset-12 border-l border-b border-[#484848]" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">AnTuTu score</div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">Phone price</div>
        <div className="absolute bottom-10 right-10 text-xs italic text-muted-foreground">best value</div>

        {plottedRows.map((row) => {
          const point = project(row, bounds);
          const color = BRAND_COLORS[row.processorBrand] || BRAND_COLORS.Other;

          return (
            <div
              key={row.id}
              className="group absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `calc(48px + ${point.x}% * (100% - 96px) / 100)`,
                top: `calc(48px + ${point.y}% * (100% - 96px) / 100)`,
                background: color,
                border: row.plottedPrice.priceType === 'current' ? '2px solid white' : `1px solid ${color}`,
              }}
              title={`${row.phoneName} · ${row.processorName} · ${formatScore(row.antutuScore)} · ${formatPrice(row.plottedPrice.normalizedINR)} · ${row.plottedPrice.priceType}`}
            >
              <span className="pointer-events-none absolute left-4 top-[-5px] hidden whitespace-nowrap text-xs font-semibold group-hover:block" style={{ color }}>
                {row.phoneName}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
