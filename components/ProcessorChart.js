'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Processor family color palette
const CHIP_COLORS = {
    'Snapdragon': '#f97316',
    'Dimensity': '#22d3ee',
    'Exynos': '#3b82f6',
    'Apple': '#34d399',
    'Kirin': '#ef4444',
    'Tensor': '#f472b6',
    'Helio': '#a78bfa',
    'M1': '#34d399',
    'M2': '#2dd4bf',
    'M3': '#06b6d4',
    'M4': '#0ea5e9',
};

function getChipColor(chipName) {
    for (const [key, color] of Object.entries(CHIP_COLORS)) {
        if (chipName.includes(key)) return color;
    }
    return '#94a3b8';
}

// Create a gradient color based on index for the bars
function getBarGradientColor(index, total) {
    const hue = 45 + (index / total) * 200; // yellow → cyan → blue
    return `hsl(${hue}, 75%, 60%)`;
}

export default function ProcessorChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Group by chipset, compute average score
        const chipGroups = {};
        data.forEach(d => {
            const chip = d.chipset || '';
            if (!chip) return;
            if (!chipGroups[chip]) chipGroups[chip] = { total: 0, count: 0, prices: [] };
            chipGroups[chip].total += d.score || 0;
            chipGroups[chip].count += 1;
            if (d.price) chipGroups[chip].prices.push(d.price);
        });

        // Sort by average score descending, take top 12 for readability
        const sorted = Object.entries(chipGroups)
            .map(([chip, g]) => ({
                chip,
                avgScore: Math.round(g.total / g.count),
                count: g.count,
                avgPrice: g.prices.length > 0 ? Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : null,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 12);

        const labels = sorted.map(s => {
            let label = s.chip;
            label = label.replace(/Qualcomm\s+/i, '');
            label = label.replace(/MediaTek\s+/i, '');
            label = label.replace(/\s*\(\d+ nm\)/i, '');
            if (label.length > 22) label = label.substring(0, 22) + '…';
            return label;
        });

        const colors = sorted.map((_, i) => getBarGradientColor(i, sorted.length));

        return {
            labels,
            datasets: [{
                data: sorted.map(s => s.avgScore),
                backgroundColor: colors.map(c => c),
                borderColor: colors.map(c => c),
                borderWidth: 0,
                borderRadius: 3,
                barPercentage: 0.75,
                categoryPercentage: 0.85,
            }],
            _meta: sorted,
        };
    }, [data]);

    useEffect(() => {
        if (!canvasRef.current || !chartData) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');

        chartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: { labels: chartData.labels, datasets: chartData.datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeOutQuart' },
                layout: {
                    padding: { top: 10, right: 15, bottom: 5, left: 5 },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'PROCESSOR MODEL',
                            color: '#facc15',
                            font: { size: 11, weight: '700', family: "'Inter', sans-serif" },
                            padding: { top: 8 },
                        },
                        ticks: {
                            color: '#facc15',
                            font: { size: 9, family: "'Inter', sans-serif", weight: '500' },
                            maxRotation: 45,
                            minRotation: 25,
                        },
                        grid: { display: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'BENCHMARK SCORE',
                            color: '#facc15',
                            font: { size: 11, weight: '700', family: "'Inter', sans-serif" },
                            padding: { bottom: 8 },
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
                        grid: { color: 'rgba(250, 204, 21, 0.04)', drawBorder: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(8, 16, 40, 0.95)',
                        titleColor: '#facc15',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(60, 120, 220, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                        bodyFont: { size: 11, family: "'JetBrains Mono', monospace" },
                        callbacks: {
                            title: (items) => {
                                if (items.length > 0) {
                                    const meta = chartData._meta[items[0].dataIndex];
                                    return meta ? meta.chip : '';
                                }
                                return '';
                            },
                            label: (item) => {
                                const meta = chartData._meta[item.dataIndex];
                                const lines = [
                                    `Avg Score: ${meta.avgScore.toLocaleString()}`,
                                    `Devices: ${meta.count}`,
                                ];
                                if (meta.avgPrice) {
                                    lines.push(`Avg Price: ₹${meta.avgPrice.toLocaleString()}`);
                                }
                                return lines;
                            },
                        },
                    },
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
                No processor data available.
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: '380px' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
