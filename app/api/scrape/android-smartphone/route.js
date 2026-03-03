import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';
import { scrapeAntutu } from '@/lib/scrapeAntutu';

const CATEGORY = 'android';

export async function GET() {
    try {
        const { devices, rankDate } = await scrapeAntutu(CATEGORY);

        if (devices.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No devices found',
                category: CATEGORY,
            }, { status: 404 });
        }

        // Persist to MongoDB
        await connectToDatabase();
        let updatedCount = 0;

        for (const dev of devices) {
            await Device.findOneAndUpdate(
                { modelName: dev.modelName, category: CATEGORY },
                {
                    $set: {
                        score: dev.score,
                        brand: dev.brand,
                        chipset: dev.chipset,
                        cpuScore: dev.cpuScore,
                        gpuScore: dev.gpuScore,
                        memScore: dev.memScore,
                        uxScore: dev.uxScore,
                        ram: dev.ram,
                        storage: dev.storage,
                        category: CATEGORY,
                        price: dev.price,
                        releaseDate: dev.releaseDate,
                        lastUpdated: new Date(),
                    },
                    $setOnInsert: {
                    },
                },
                { upsert: true, new: true }
            );
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            category: CATEGORY,
            rankDate,
            scraped: devices.length,
            updatedInDb: updatedCount,
            data: devices,
        });
    } catch (error) {
        console.error(`Scrape error [${CATEGORY}]:`, error);
        return NextResponse.json({
            success: false,
            error: error.message,
            category: CATEGORY,
        }, { status: 500 });
    }
}
