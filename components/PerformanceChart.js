'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    ScatterController,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ScatterController, PointElement, LinearScale, Tooltip, Legend);

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

function getBrandColor(brand) {
    return BRAND_COLORS[brand] || DEFAULT_COLOR;
}

export default function PerformanceChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Group by brand, only include devices with a price
        const grouped = {};
        data.forEach(d => {
            const brand = d.brand || 'Unknown';
            if (!grouped[brand]) grouped[brand] = [];
            grouped[brand].push({
                x: d.price || 0,
                y: d.score,
                modelName: d.modelName,
                brand: brand,
                price: d.price,
                chipset: d.chipset || '',
            });
        });

        const datasets = Object.entries(grouped).map(([brand, points]) => {
            const color = getBrandColor(brand);
            return {
                label: brand,
                data: points,
                backgroundColor: color + 'cc',
                borderColor: color,
                pointRadius: 5,
                pointHoverRadius: 9,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: color,
                pointHoverBorderWidth: 2,
                pointBorderWidth: 0,
            };
        });

        return { datasets };
    }, [data]);

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
                animation: { duration: 800, easing: 'easeOutQuart' },
                layout: {
                    padding: { top: 15, right: 15, bottom: 10, left: 10 },
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'PRICE (₹)',
                            color: '#facc15',
                            font: { size: 12, weight: '700', family: "'Inter', sans-serif" },
                            padding: { top: 10 },
                        },
                        ticks: {
                            color: '#facc15',
                            font: { size: 10, family: "'JetBrains Mono', monospace" },
                            callback: (v) => {
                                if (v === 0) return '₹N/A';
                                if (v >= 100000) return '₹' + (v / 1000).toFixed(0) + 'k';
                                if (v >= 10000) return '₹' + (v / 1000).toFixed(0) + 'k';
                                return '₹' + v.toLocaleString();
                            },
                        },
                        grid: { color: 'rgba(250, 204, 21, 0.05)', drawBorder: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'ANTUTU BENCHMARK SCORE',
                            color: '#facc15',
                            font: { size: 12, weight: '700', family: "'Inter', sans-serif" },
                            padding: { bottom: 10 },
                        },
                        ticks: {
                            color: '#facc15',
                            font: { size: 10, family: "'JetBrains Mono', monospace" },
                            callback: (v) => {
                                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
                                return v;
                            },
                        },
                        grid: { color: 'rgba(250, 204, 21, 0.05)', drawBorder: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'start',
                        labels: {
                            color: '#BDE8F5',
                            font: { size: 11, family: "'Inter', sans-serif", weight: '500' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 12,
                            boxWidth: 7,
                            boxHeight: 7,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(8, 20, 50, 0.95)',
                        titleColor: '#facc15',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(250, 204, 21, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                        bodyFont: { size: 11, family: "'JetBrains Mono', monospace" },
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
                    intersect: true,
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
            <div className="flex items-center justify-center h-[300px] w-full text-[#4988C4]/50 text-sm">
                No device data available.
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: '450px' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
