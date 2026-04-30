import { NextResponse } from 'next/server';
import { STATIC_DEVICES } from '@/lib/static-devices';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const brand = searchParams.get('brand');
        const category = searchParams.get('category');

        const devices = STATIC_DEVICES.filter(device => {
            const brandMatch = !brand || brand === 'All' || device.brand?.toLowerCase() === brand.toLowerCase();
            const categoryMatch = !category || category === 'All' || device.category === category;
            return brandMatch && categoryMatch;
        }).sort((a, b) => b.score - a.score);

        return NextResponse.json({ success: true, count: devices.length, data: devices });
    } catch (error) {
        console.error('API /devices error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
    }
}
