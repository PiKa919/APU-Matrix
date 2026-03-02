import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';

export async function GET(request) {
    try {
        const conn = await connectToDatabase();

        // If no DB connection, return mock data for local dev
        if (!conn) {
            return NextResponse.json({
                success: true,
                isMock: true,
                data: [
                    { _id: '1', modelName: 'Red Magic 11 Pro', score: 3995953, brand: 'Red Magic', price: 649, lastUpdated: '2026-01-15T00:00:00Z', category: 'android', chipset: 'S-8 Elite Gen 5' },
                    { _id: '2', modelName: 'iQOO 15', score: 3779634, brand: 'iQOO', price: 699, lastUpdated: '2026-01-15T00:00:00Z', category: 'android', chipset: 'S-8 Elite Gen 5' },
                    { _id: '3', modelName: 'OnePlus 15', score: 3684098, brand: 'OnePlus', price: 799, lastUpdated: '2026-01-15T00:00:00Z', category: 'android', chipset: 'S-8 Elite Gen 5' },
                ]
            });
        }

        const { searchParams } = new URL(request.url);
        const brand = searchParams.get('brand');
        const category = searchParams.get('category');

        // Build query for MongoDB dynamically based on filters
        const query = {};
        if (brand && brand !== 'All') {
            query.brand = new RegExp(`^${brand}$`, 'i');
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        const devices = await Device.find(query).sort({ score: -1 }).lean();

        return NextResponse.json({ success: true, count: devices.length, data: devices });
    } catch (error) {
        console.error('API /devices error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
    }
}
