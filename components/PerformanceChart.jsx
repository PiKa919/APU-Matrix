'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    ScatterController,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';
import { EyeOff, Eye } from 'lucide-react';

ChartJS.register(ScatterController, LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

const BRAND_COLORS = {
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

const DEFAULT_COLOR = '#94a3b8';
const FAMILY_COLORS = {
    Snapdragon: '#d98b5f',
    Dimensity: '#6bbdb8',
    Apple: '#5fb4a1',
    Exynos: '#6f93b2',
    Tensor: '#c5969f',
    Kirin: '#c97b7b',
    Helio: '#b7a7d1',
};

function getBrandColor(brand) {
    return BRAND_COLORS[brand] || DEFAULT_COLOR;
}

function getChipFamily(chipset) {
    const chip = chipset || '';
    if (chip.includes('Snapdragon')) return 'Snapdragon';
    if (chip.includes('Dimensity')) return 'Dimensity';
    if (chip.includes('Apple')) return 'Apple';
    if (chip.includes('Exynos')) return 'Exynos';
    if (chip.includes('Tensor')) return 'Tensor';
    if (chip.includes('Kirin')) return 'Kirin';
    if (chip.includes('Helio')) return 'Helio';
    return null;
}

function buildTrendLine(points) {
    if (points.length < 3) return null;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const n = points.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    return [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
    ];
}

export default function PerformanceChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const [hideMissingPrices, setHideMissingPrices] = useState(false);

    // Threshold: any price under ₹2000 is clearly a placeholder (₹100 etc), not a real phone price
    const PRICE_THRESHOLD = 2000;

    // Filter data based on the 'hide missing prices' toggle
    const visibleData = useMemo(() => {
        if (!data) return [];
        if (hideMissingPrices) return data.filter(d => typeof d.price === 'number' && d.price >= PRICE_THRESHOLD);
        return data;
    }, [data, hideMissingPrices]);

    const missingCount = useMemo(() => {
        if (!data) return 0;
        return data.filter(d => !d.price || typeof d.price !== 'number' || d.price < PRICE_THRESHOLD).length;
    }, [data]);

    const chartData = useMemo(() => {
        if (!visibleData || visibleData.length === 0) return null;

        const points = visibleData.map(d => ({
            x: typeof d.price === 'number' ? d.price : null,
            y: d.score,
            modelName: d.modelName,
            brand: d.brand || 'Unknown',
            price: d.price,
            chipset: d.chipset || '',
        }));

        const trendGroups = {};
        points.forEach(point => {
            if (typeof point.x !== 'number' || typeof point.y !== 'number') return;
            const family = getChipFamily(point.chipset);
            if (!family) return;
            if (!trendGroups[family]) trendGroups[family] = [];
            trendGroups[family].push(point);
        });

        const datasets = [
            {
                type: 'scatter',
                label: 'Devices',
                data: points,
                parsing: false,
                pointRadius: 3.2,
                pointHoverRadius: 6,
                pointBorderWidth: 1,
                pointBackgroundColor: (ctx) => {
                    const brand = ctx.raw?.brand || 'Unknown';
                    return getBrandColor(brand) + 'cc';
                },
                pointBorderColor: (ctx) => {
                    const brand = ctx.raw?.brand || 'Unknown';
                    return getBrandColor(brand);
                },
            },
        ];

        Object.entries(trendGroups).forEach(([family, familyPoints]) => {
            const line = buildTrendLine(familyPoints);
            if (!line) return;
            const color = FAMILY_COLORS[family] || DEFAULT_COLOR;
            datasets.push({
                type: 'line',
                label: `${family} trend`,
                data: line,
                parsing: false,
                borderColor: color + '66',
                borderWidth: 1,
                borderDash: [4, 6],
                pointRadius: 0,
                tension: 0,
            });
        });

        return { datasets };
    }, [visibleData]);

    useEffect(() => {
        if (!canvasRef.current || !chartData) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');

        chartRef.current = new ChartJS(ctx, {
            type: 'scatter',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600, easing: 'easeOutQuart' },
                layout: {
                    padding: { top: 15, right: 15, bottom: 10, left: 10 },
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Price (INR)',
                            color: '#5b6a6d',
                            font: { size: 12, weight: '600', family: "'Space Grotesk', sans-serif" },
                            padding: { top: 10 },
                        },
                        ticks: {
                            color: '#5b6a6d',
                            font: { size: 10, family: "'IBM Plex Mono', monospace" },
                            callback: (v) => {
                                if (v === 0) return 'N/A';
                                if (v >= 100000) return (v / 1000).toFixed(0) + 'k';
                                if (v >= 10000) return (v / 1000).toFixed(0) + 'k';
                                return v.toLocaleString();
                            },
                        },
                        grid: { color: 'rgba(28, 35, 38, 0.08)', drawBorder: false, borderDash: [4, 6] },
                        border: { color: 'rgba(28, 35, 38, 0.16)' },
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'AnTuTu score',
                            color: '#5b6a6d',
                            font: { size: 12, weight: '600', family: "'Space Grotesk', sans-serif" },
                            padding: { bottom: 10 },
                        },
                        ticks: {
                            color: '#5b6a6d',
                            font: { size: 10, family: "'IBM Plex Mono', monospace" },
                            callback: (v) => {
                                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
                                return v;
                            },
                        },
                        grid: { color: 'rgba(28, 35, 38, 0.08)', drawBorder: false, borderDash: [4, 6] },
                        border: { color: 'rgba(28, 35, 38, 0.16)' },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        titleColor: '#1c2326',
                        bodyColor: '#1c2326',
                        borderColor: 'rgba(28, 35, 38, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { size: 13, weight: '600', family: "'Space Grotesk', sans-serif" },
                        bodyFont: { size: 11, family: "'IBM Plex Mono', monospace" },
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                            title: (items) => {
                                if (items.length > 0) return items[0].raw.modelName;
                                return '';
                            },
                            label: (item) => {
                                const d = item.raw;
                                const priceFormat = d.price ? `₹${d.price.toLocaleString()}` : 'N/A';
                                const lines = [
                                    `Score: ${d.y.toLocaleString()}`,
                                    `Price: ${priceFormat}`,
                                    `Brand: ${d.brand}`,
                                ];
                                if (d.chipset) lines.push(`Chip: ${d.chipset}`);
                                return lines;
                            },
                        },
                    },
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                },
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [chartData]);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] w-full text-muted-foreground text-sm">
                No device data available.
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <div className="flex items-center justify-end mb-3">
                <button
                    onClick={() => setHideMissingPrices(!hideMissingPrices)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 border ${hideMissingPrices
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(47,183,166,0.15)]'
                        : 'bg-card/70 text-muted-foreground border-border/60 hover:text-foreground hover:border-border'
                        }`}
                >
                    {hideMissingPrices ? (
                        <>
                            <EyeOff size={12} />
                            <span>Hiding {missingCount} unpriced devices</span>
                        </>
                    ) : (
                        <>
                            <Eye size={12} />
                            <span>Hide {missingCount} unpriced devices</span>
                        </>
                    )}
                </button>
            </div>

            <div style={{ height: '450px' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
