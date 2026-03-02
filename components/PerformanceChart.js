'use client';

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip flex flex-col gap-1 text-white">
                <p className="font-bold text-[#BDE8F5]">{data.modelName}</p>
                <p className="text-sm"><span className="text-gray-400">Score:</span> {data.score.toLocaleString()}</p>
                <p className="text-sm"><span className="text-gray-400">Price:</span> ${data.price}</p>
                <p className="text-sm"><span className="text-gray-400">Brand:</span> {data.brand}</p>
            </div>
        );
    }
    return null;
};

// Colors based on user palette
const COLORS = ['#4988C4', '#BDE8F5', '#1C4D8D', '#0F2854', '#ffffff'];

export default function PerformanceChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px] w-full text-[#4988C4] glass-panel">
                No APU data available to display.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full h-[600px] glass-panel p-6 relative"
        >
            <div className="absolute top-4 right-6 text-xs text-[#1C4D8D] font-mono tracking-widest">PERFORMANCE vs PRICE MATRIX</div>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 40, right: 30, bottom: 30, left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(73, 136, 196, 0.15)" />

                    <XAxis
                        type="number"
                        dataKey="price"
                        name="Price"
                        unit="$"
                        stroke="#4988C4"
                        domain={['dataMin - 100', 'dataMax + 100']}
                        tickFormatter={(value) => `$${value}`}
                        label={{ value: 'Price ($)', position: 'insideBottomRight', offset: -10, fill: '#BDE8F5' }}
                    />

                    <YAxis
                        type="number"
                        dataKey="score"
                        name="Score"
                        stroke="#4988C4"
                        domain={['dataMin - 100000', 'dataMax + 100000']}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        label={{ value: 'AnTuTu Benchmark Score', angle: -90, position: 'insideLeft', offset: -20, fill: '#BDE8F5' }}
                    />

                    <ZAxis type="number" range={[100, 300]} />

                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(189,232,245,0.4)', strokeWidth: 1 }} />

                    <Scatter name="Phones" data={data} fill="#BDE8F5" animationDuration={1500}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
