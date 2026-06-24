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

function plotCoordinate(percent) {
  return 8 + (Math.max(0, Math.min(100, percent)) * 0.84);
}

function plotPosition(percent) {
  return `${plotCoordinate(percent)}%`;
}

function makeTicks(min, max, count = 5) {
  if (count <= 1 || !Number.isFinite(min) || !Number.isFinite(max)) {
    return [min || 0];
  }

  if (min === max) {
    return [min];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(min + (step * index)));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

export default function PhonePricePerformanceChart({ rows = [] }) {
  const processorBrands = useMemo(() => uniqueSorted(rows.map((row) => row.processorBrand)), [rows]);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedProcessorName, setSelectedProcessorName] = useState(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => selectedBrand === 'All' || row.processorBrand === selectedBrand);
  }, [rows, selectedBrand]);

  const plottedRows = useMemo(() => {
    return filteredRows.filter((row) => row.plottedPrice);
  }, [filteredRows]);

  const bounds = useMemo(() => {
    if (plottedRows.length === 0) {
      return {
        minScore: 0,
        maxScore: 1,
        minPrice: 0,
        maxPrice: 1,
      };
    }

    const scores = plottedRows.map((row) => row.antutuScore);
    const prices = plottedRows.map((row) => row.plottedPrice.normalizedINR);
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [plottedRows]);

  const currentPriceCount = plottedRows.filter((row) => row.plottedPrice.priceType === 'current').length;
  const launchFallbackCount = plottedRows.filter((row) => row.plottedPrice.priceType === 'launch').length;
  const missingPriceCount = filteredRows.filter((row) => !row.plottedPrice).length;
  const scoreTicks = useMemo(() => makeTicks(bounds.minScore, bounds.maxScore), [bounds]);
  const priceTicks = useMemo(() => makeTicks(bounds.minPrice, bounds.maxPrice), [bounds]);
  const selectedProcessorRows = useMemo(() => {
    if (!selectedProcessorName) return [];

    return plottedRows
      .filter((row) => row.processorName === selectedProcessorName)
      .sort((left, right) => left.antutuScore - right.antutuScore);
  }, [plottedRows, selectedProcessorName]);
  const selectedLinePoints = useMemo(() => {
    return selectedProcessorRows
      .map((row) => {
        const point = project(row, bounds);
        return `${plotCoordinate(point.x)},${plotCoordinate(point.y)}`;
      })
      .join(' ');
  }, [bounds, selectedProcessorRows]);
  const selectedPriceRange = useMemo(() => {
    if (selectedProcessorRows.length === 0) return null;

    const scores = selectedProcessorRows.map((row) => row.antutuScore);
    const prices = selectedProcessorRows.map((row) => row.plottedPrice.normalizedINR);
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [selectedProcessorRows]);

  return (
    <section className="border border-[#303030] bg-[#171717] p-5 text-foreground">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Phone price performance</h2>
          <p className="text-xs text-muted-foreground">AnTuTu score vs current market price, with launch-price fallback markers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedBrand('All');
              setSelectedProcessorName(null);
            }}
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
                onClick={() => {
                  setSelectedBrand(brand);
                  setSelectedProcessorName(null);
                }}
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
        <span>{currentPriceCount} current price</span>
        <span>{launchFallbackCount} launch fallback</span>
        <span>{missingPriceCount} missing price</span>
        {selectedProcessorRows.length > 0 && (
          <span className="text-foreground">
            {selectedProcessorName} · {selectedProcessorRows.length} {selectedProcessorRows.length === 1 ? 'phone' : 'phones'} selected
            {selectedPriceRange && (
              <span className="text-muted-foreground">
                {' '}· {formatScore(selectedPriceRange.minScore)}-{formatScore(selectedPriceRange.maxScore)}
                {' '}· {formatPrice(selectedPriceRange.minPrice)}-{formatPrice(selectedPriceRange.maxPrice)}
              </span>
            )}
          </span>
        )}
      </div>

      <div
        aria-label="phone price performance scatter plot"
        role="img"
        onClick={() => setSelectedProcessorName(null)}
        className="relative h-[560px] overflow-hidden border border-[#303030] bg-[#1d1d1d]"
      >
        <div className="absolute inset-12 border-l border-b border-[#484848]" />
        {scoreTicks.map((tick, index) => {
          const percent = ((tick - bounds.minScore) / (bounds.maxScore - bounds.minScore || 1)) * 100;

          return (
            <div key={`x-${index}-${tick}`} className="absolute bottom-12 top-12 border-l border-[#363636]" style={{ left: plotPosition(percent) }}>
              <span className="absolute top-full mt-3 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground">
                {formatScore(tick)}
              </span>
            </div>
          );
        })}
        {priceTicks.map((tick, index) => {
          const percent = 100 - ((tick - bounds.minPrice) / (bounds.maxPrice - bounds.minPrice || 1)) * 100;

          return (
            <div key={`y-${index}-${tick}`} className="absolute left-12 right-12 border-t border-[#363636]" style={{ top: plotPosition(percent) }}>
              <span className="absolute right-full mr-3 -translate-y-1/2 whitespace-nowrap text-[11px] text-muted-foreground">
                {formatPrice(tick)}
              </span>
            </div>
          );
        })}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">AnTuTu score</div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">Phone price</div>
        <div className="absolute bottom-10 right-10 text-xs italic text-muted-foreground">best value</div>
        {selectedProcessorRows.length > 1 && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline
              data-testid="selected-processor-line"
              fill="none"
              points={selectedLinePoints}
              stroke={BRAND_COLORS[selectedProcessorRows[0].processorBrand] || BRAND_COLORS.Other}
              strokeDasharray="6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="0.45"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {plottedRows.map((row) => {
          const point = project(row, bounds);
          const color = BRAND_COLORS[row.processorBrand] || BRAND_COLORS.Other;
          const selected = row.processorName === selectedProcessorName;
          const dimmed = selectedProcessorRows.length > 0 && !selected;

          return (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${selected ? 'z-20 h-4 w-4' : 'z-10 h-3 w-3'} ${dimmed ? 'opacity-35' : 'opacity-100'} cursor-pointer`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedProcessorName(row.processorName);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedProcessorName(row.processorName);
                }
              }}
              style={{
                left: plotPosition(point.x),
                top: plotPosition(point.y),
                background: color,
                border: selected || row.plottedPrice.priceType === 'current' ? '2px solid white' : `1px solid ${color}`,
                boxShadow: selected ? `0 0 0 5px ${color}33` : 'none',
              }}
              title={`${row.phoneName} · ${row.processorName} · ${formatScore(row.antutuScore)} · ${formatPrice(row.plottedPrice.normalizedINR)} · ${row.plottedPrice.priceType}`}
            >
              <span className={`pointer-events-none absolute left-5 top-[-5px] whitespace-nowrap text-xs font-semibold ${selected ? 'block' : 'hidden group-hover:block'}`} style={{ color }}>
                {row.phoneName}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
