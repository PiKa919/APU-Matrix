'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    ScatterController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { motion } from 'framer-motion';

ChartJS.register(
    ScatterController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels
);

// Vibrant brand colors inspired by the ARC-AGI leaderboard palette
const BRAND_COLORS = {
    'Apple': '#34d399',
    'Samsung': '#60a5fa',
    'Google': '#f472b6',
    'OnePlus': '#fb923c',
    'Xiaomi': '#a78bfa',
    'Asus': '#facc15',
    'vivo': '#2dd4bf',
    'Red': '#f87171',
    'iQOO': '#38bdf8',
    'POCO': '#c084fc',
    'Nothing': '#e879f9',
    'Motorola': '#4ade80',
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

        // Group data by brand
        const grouped = {};
        data.forEach(d => {
            const brand = d.brand || 'Unknown';
            if (!grouped[brand]) grouped[brand] = [];
            grouped[brand].push({
                x: new Date(d.lastUpdated || Date.now()),
                y: d.score,
                modelName: d.modelName,
                brand: brand,
                price: d.price,
            });
        });

        // Sort each brand's data by date for line connections
        Object.values(grouped).forEach(arr => arr.sort((a, b) => a.x - b.x));

        // Create one dataset per brand
        const datasets = Object.entries(grouped).map(([brand, points]) => {
            const color = getBrandColor(brand);
            return {
                label: brand,
                data: points,
                showLine: true,
                borderColor: color + '80', // 50% opacity for line
                backgroundColor: color,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointBorderWidth: 0,
                pointRadius: 6,
                pointHoverRadius: 10,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: color,
                pointHoverBorderWidth: 3,
                borderWidth: 2,
                borderDash: [6, 4],
                tension: 0.35,
                fill: false,
            };
        });

        return { datasets };
    }, [data]);

    useEffect(() => {
        if (!canvasRef.current || !chartData) return;

        // Destroy old chart
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
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart',
                },
                layout: {
                    padding: {
                        top: 30,
                        right: 30,
                        bottom: 10,
                        left: 10,
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM yyyy',
                            },
                            tooltipFormat: 'MMM dd, yyyy',
                        },
                        title: {
                            display: true,
                            text: 'DATE',
                            color: '#4988C4',
                            font: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                            padding: { top: 12 },
                        },
                        ticks: {
                            color: '#4988C4',
                            font: { size: 11, family: "'Inter', sans-serif" },
                            maxRotation: 0,
                        },
                        grid: {
                            color: 'rgba(73, 136, 196, 0.1)',
                            drawBorder: false,
                        },
                        border: {
                            color: 'rgba(73, 136, 196, 0.2)',
                        },
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'BENCHMARK SCORE',
                            color: '#4988C4',
                            font: { size: 13, weight: 'bold', family: "'Inter', sans-serif" },
                            padding: { bottom: 12 },
                        },
                        ticks: {
                            color: '#4988C4',
                            font: { size: 11, family: "'Inter', sans-serif" },
                            callback: (value) => {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                return value;
                            },
                        },
                        grid: {
                            color: 'rgba(73, 136, 196, 0.1)',
                            drawBorder: false,
                        },
                        border: {
                            color: 'rgba(73, 136, 196, 0.2)',
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'start',
                        labels: {
                            color: '#BDE8F5',
                            font: { size: 12, family: "'Inter', sans-serif", weight: '500' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 16,
                            boxWidth: 8,
                            boxHeight: 8,
                        },
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(8, 20, 50, 0.95)',
                        titleColor: '#BDE8F5',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(73, 136, 196, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 14,
                        titleFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
                        bodyFont: { size: 12, family: "'Inter', sans-serif" },
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                            title: (items) => {
                                if (items.length > 0) {
                                    return items[0].raw.modelName;
                                }
                                return '';
                            },
                            label: (item) => {
                                const d = item.raw;
                                const priceFormat = d.price ? `₹${d.price.toLocaleString()}` : 'N/A';
                                return [
                                    `Score: ${d.y.toLocaleString()}`,
                                    `Brand: ${d.brand}`,
                                    `Price: ${priceFormat}`,
                                ];
                            },
                        },
                    },
                    datalabels: {
                        display: 'auto',
                        color: (ctx) => {
                            const brand = ctx.dataset.data[ctx.dataIndex]?.brand;
                            return getBrandColor(brand);
                        },
                        font: {
                            size: 10,
                            weight: '600',
                            family: "'Inter', sans-serif",
                        },
                        anchor: 'end',
                        align: 'top',
                        offset: 6,
                        clamp: true,
                        formatter: (value) => {
                            return value.modelName;
                        },
                        textStrokeColor: 'rgba(3, 8, 21, 0.8)',
                        textStrokeWidth: 3,
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
            <div className="flex items-center justify-center h-[500px] w-full text-[#4988C4] glass-panel">
                No APU data available to display.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full glass-panel p-6 relative"
            style={{ height: '65vh', minHeight: '500px' }}
        >
            <div className="absolute top-4 right-6 text-xs text-[#1C4D8D] font-mono tracking-widest z-10">
                PERFORMANCE vs DATE MATRIX
            </div>
            <canvas ref={canvasRef} />
        </motion.div>
    );
}
