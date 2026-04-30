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
    'Snapdragon 8 Elite': '#d98b5f',
    'Snapdragon 8 Gen 5': '#dca075',
    'Snapdragon 8 Gen 4': '#e1b28b',
    'Snapdragon': '#d98b5f',
    'Dimensity 9500': '#6bbdb8',
    'Dimensity 9400': '#7bc9c4',
    'Dimensity': '#7bc9c4',
    'Exynos': '#6f93b2',
    'Apple M5': '#5fb4a1',
    'Apple M4': '#6bc1af',
    'Apple M3': '#7bc9b7',
    'Apple A19': '#67b89f',
    'Apple A18': '#5fb4a1',
    'Apple': '#5fb4a1',
    'Kirin': '#c97b7b',
    'Tensor': '#c5969f',
    'Helio': '#b7a7d1',
};

function getChipColor(chipName) {
    for (const [key, color] of Object.entries(CHIP_COLORS)) {
        if (chipName.includes(key)) return color;
    }
    return '#94a3b8';
}

export default function ProcessorChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Group by chipset, compute MAX score (AnTuTu Rankings use peak performance)
        const chipGroups = {};
        data.forEach(d => {
            let chip = d.chipset || '';
            if (!chip) return;

            // Normalize chip name for grouping
            chip = chip.replace(/Qualcomm\s+/i, '');
            chip = chip.replace(/MediaTek\s+/i, '');
            chip = chip.replace(/\s*\(\d+ nm\)/i, '');
            chip = chip.trim();

            if (!chipGroups[chip]) chipGroups[chip] = { maxScore: 0, count: 0, prices: [] };

            // Use MAX score to align with "Ranking" style
            chipGroups[chip].maxScore = Math.max(chipGroups[chip].maxScore, d.score || 0);
            chipGroups[chip].count += 1;
            if (d.price) chipGroups[chip].prices.push(d.price);
        });

        // Sort by peak score descending, take top 14 for detail
        const sorted = Object.entries(chipGroups)
            .map(([chip, g]) => ({
                chip,
                maxScore: g.maxScore,
                count: g.count,
                avgPrice: g.prices.length > 0 ? Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : null,
            }))
            .sort((a, b) => b.maxScore - a.maxScore)
            .slice(0, 14);

        const labels = sorted.map(s => {
            let label = s.chip;
            if (label.length > 25) label = label.substring(0, 25) + '…';
            return label;
        });

        const colors = sorted.map((s) => getChipColor(s.chip));

        return {
            labels,
            datasets: [{
                data: sorted.map(s => s.maxScore),
                backgroundColor: colors.map(c => c + 'cc'),
                borderColor: colors.map(c => c),
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 14,
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
                    indexAxis: 'y',
                layout: {
                    padding: { top: 10, right: 15, bottom: 5, left: 5 },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                                text: 'Benchmark score',
                                color: '#5b6a6d',
                                font: { size: 11, weight: '600', family: "'Space Grotesk', sans-serif" },
                            padding: { top: 8 },
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
                            grid: { color: 'rgba(28, 35, 38, 0.08)', borderDash: [4, 6], drawBorder: false },
                            border: { color: 'rgba(28, 35, 38, 0.12)' },
                    },
                    y: {
                        title: {
                            display: true,
                                text: 'Processor model',
                                color: '#5b6a6d',
                                font: { size: 11, weight: '600', family: "'Space Grotesk', sans-serif" },
                            padding: { bottom: 8 },
                        },
                        ticks: {
                                color: '#5b6a6d',
                                font: { size: 10, family: "'Space Grotesk', sans-serif", weight: '500' },
                        },
                            grid: { display: false, drawBorder: false },
                            border: { color: 'rgba(28, 35, 38, 0.12)' },
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
                                    `Peak Score: ${meta.maxScore.toLocaleString()}`,
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
            <div className="flex items-center justify-center h-[300px] w-full text-muted-foreground text-sm">
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
