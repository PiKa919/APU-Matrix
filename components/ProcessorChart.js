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
    'Exynos': '#60a5fa',
    'Apple': '#34d399',
    'Kirin': '#ef4444',
    'Tensor': '#f472b6',
    'Unisoc': '#a78bfa',
};

function getChipColor(chipName) {
    for (const [key, color] of Object.entries(CHIP_COLORS)) {
        if (chipName.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return '#94a3b8';
}

export default function ProcessorChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Group by chipset, compute average score
        const chipGroups = {};
        data.forEach(d => {
            const chip = d.chipset || 'Unknown';
            if (chip === 'Unknown' || chip === '') return;
            if (!chipGroups[chip]) chipGroups[chip] = { total: 0, count: 0, prices: [] };
            chipGroups[chip].total += d.score || 0;
            chipGroups[chip].count += 1;
            if (d.price) chipGroups[chip].prices.push(d.price);
        });

        // Sort by average score descending, take top 20
        const sorted = Object.entries(chipGroups)
            .map(([chip, g]) => ({
                chip,
                avgScore: Math.round(g.total / g.count),
                count: g.count,
                avgPrice: g.prices.length > 0 ? Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : null,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 20);

        // Shorten labels for display
        const labels = sorted.map(s => {
            let label = s.chip;
            // Trim long Qualcomm names
            label = label.replace(/Qualcomm\s+SM\d+-?\w*\s+/i, '');
            label = label.replace(/MediaTek\s+MT\d+\/?\w*\s*/i, '');
            label = label.replace(/\s*\(\d+ nm\)/i, '');
            if (label.length > 28) label = label.substring(0, 28) + '…';
            return label;
        });

        const colors = sorted.map(s => getChipColor(s.chip));

        return {
            labels,
            datasets: [{
                data: sorted.map(s => s.avgScore),
                backgroundColor: colors.map(c => c + '90'),
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7,
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
                indexAxis: 'y',
                animation: { duration: 800, easing: 'easeOutQuart' },
                layout: {
                    padding: { top: 10, right: 20, bottom: 10, left: 5 },
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'AVERAGE ANTUTU SCORE',
                            color: '#facc15',
                            font: { size: 11, weight: '700', family: "'Inter', sans-serif" },
                            padding: { top: 10 },
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
                        grid: { color: 'rgba(250, 204, 21, 0.06)', drawBorder: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'PROCESSOR / CHIPSET',
                            color: '#facc15',
                            font: { size: 11, weight: '700', family: "'Inter', sans-serif" },
                            padding: { bottom: 10 },
                        },
                        ticks: {
                            color: '#facc15',
                            font: { size: 10, family: "'Inter', sans-serif", weight: '500' },
                            mirror: false,
                        },
                        grid: { display: false },
                        border: { color: 'rgba(250, 204, 21, 0.15)' },
                    },
                },
                plugins: {
                    legend: { display: false },
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
        <div className="w-full" style={{ height: '500px' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
