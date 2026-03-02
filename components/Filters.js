'use client';

import { motion } from 'framer-motion';

export default function Filters({ brands, selectedBrand, onSelectBrand }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-8"
        >
            <button
                onClick={() => onSelectBrand('All')}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 border backdrop-blur-md ${selectedBrand === 'All'
                        ? 'bg-[#1C4D8D]/80 text-white border-[#4988C4] shadow-[0_0_20px_rgba(28,77,141,0.6)]'
                        : 'bg-[#0F2854]/40 text-[#BDE8F5] border-[#1C4D8D]/50 hover:bg-[#0F2854]/80'
                    }`}
            >
                All Brands
            </button>

            {brands.map((brand, idx) => (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + (idx * 0.05) }}
                    key={brand}
                    onClick={() => onSelectBrand(brand)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 border backdrop-blur-md ${selectedBrand === brand
                            ? 'bg-[#1C4D8D]/80 text-white border-[#4988C4] shadow-[0_0_20px_rgba(28,77,141,0.6)]'
                            : 'bg-[#0F2854]/40 text-[#BDE8F5] border-[#1C4D8D]/50 hover:bg-[#0F2854]/80'
                        }`}
                >
                    {brand}
                </motion.button>
            ))}
        </motion.div>
    );
}
