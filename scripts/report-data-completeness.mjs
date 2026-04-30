#!/usr/bin/env node

import connectToDatabase from '../lib/mongodb.js';
import Device from '../models/Device.js';

function percentage(part, total) {
    if (!total) return '0.0%';
    return `${((part / total) * 100).toFixed(1)}%`;
}

async function main() {
    await connectToDatabase();

    const devices = await Device.find({}, {
        category: 1,
        price: 1,
        releaseDate: 1,
        chipset: 1,
        ram: 1,
        storage: 1,
        brand: 1,
    }).lean();

    const byCategory = new Map();

    for (const device of devices) {
        const category = device.category || 'uncategorized';
        if (!byCategory.has(category)) {
            byCategory.set(category, {
                total: 0,
                price: 0,
                releaseDate: 0,
                chipset: 0,
                ram: 0,
                storage: 0,
                brand: 0,
            });
        }

        const entry = byCategory.get(category);
        entry.total += 1;
        if (typeof device.price === 'number' && device.price > 0) entry.price += 1;
        if (typeof device.releaseDate === 'string' && device.releaseDate.trim()) entry.releaseDate += 1;
        if (typeof device.chipset === 'string' && device.chipset.trim()) entry.chipset += 1;
        if (typeof device.ram === 'string' && device.ram.trim()) entry.ram += 1;
        if (typeof device.storage === 'string' && device.storage.trim()) entry.storage += 1;
        if (typeof device.brand === 'string' && device.brand.trim()) entry.brand += 1;
    }

    console.log('Category\tTotal\tPrice\tRelease\tChipset\tRAM\tStorage\tBrand');

    for (const [category, entry] of [...byCategory.entries()].sort((left, right) => left[0].localeCompare(right[0]))) {
        console.log([
            category,
            entry.total,
            `${entry.price} (${percentage(entry.price, entry.total)})`,
            `${entry.releaseDate} (${percentage(entry.releaseDate, entry.total)})`,
            `${entry.chipset} (${percentage(entry.chipset, entry.total)})`,
            `${entry.ram} (${percentage(entry.ram, entry.total)})`,
            `${entry.storage} (${percentage(entry.storage, entry.total)})`,
            `${entry.brand} (${percentage(entry.brand, entry.total)})`,
        ].join('\t'));
    }

    console.log(`\nDevices inspected: ${devices.length}`);
}

main().catch((error) => {
    console.error('Completeness report failed:', error);
    process.exit(1);
});