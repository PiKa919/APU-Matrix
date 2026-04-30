import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';
import { scrapeAntutu } from '@/lib/scrapeAntutu';

function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function hasPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function buildDeviceUpdate(device, category) {
    const set = {
        score: device.score,
        cpuScore: device.cpuScore,
        gpuScore: device.gpuScore,
        memScore: device.memScore,
        uxScore: device.uxScore,
        category,
        lastUpdated: new Date(),
    };

    if (hasText(device.brand)) set.brand = device.brand;
    if (hasText(device.chipset)) set.chipset = device.chipset;
    if (hasText(device.ram)) set.ram = device.ram;
    if (hasText(device.storage)) set.storage = device.storage;
    if (hasText(device.releaseDate)) set.releaseDate = device.releaseDate;
    if (hasPositiveNumber(device.price)) set.price = device.price;
    if (hasText(device.priceCurrency)) set.priceCurrency = device.priceCurrency;
    if (hasText(device.priceRaw)) set.priceRaw = device.priceRaw;
    if (typeof device.enrichmentConfidence === 'number') set.enrichmentConfidence = device.enrichmentConfidence;
    if (device.lastEnrichedAt instanceof Date) set.lastEnrichedAt = device.lastEnrichedAt;
    if (device.metadataSources && Object.keys(device.metadataSources).length > 0) set.metadataSources = device.metadataSources;
    if (device.sourceUrls && Object.keys(device.sourceUrls).length > 0) set.sourceUrls = device.sourceUrls;

    return set;
}

export async function runScrapeCategory(category) {
    try {
        const { devices, rankDate } = await scrapeAntutu(category);

        if (devices.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No devices found',
                category,
            }, { status: 404 });
        }

        await connectToDatabase();
        let updatedCount = 0;

        for (const device of devices) {
            await Device.findOneAndUpdate(
                { modelName: device.modelName, category },
                {
                    $set: buildDeviceUpdate(device, category),
                    $setOnInsert: {
                        modelName: device.modelName,
                        category,
                    },
                },
                { upsert: true, new: true }
            );
            updatedCount += 1;
        }

        return NextResponse.json({
            success: true,
            category,
            rankDate,
            scraped: devices.length,
            updatedInDb: updatedCount,
            data: devices,
        });
    } catch (error) {
        console.error(`Scrape error [${category}]:`, error);
        return NextResponse.json({
            success: false,
            error: error.message,
            category,
        }, { status: 500 });
    }
}