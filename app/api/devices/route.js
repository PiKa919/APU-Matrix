import { NextResponse } from 'next/server';
import rows from '@/public/data/phone-price-performance.json';
import report from '@/public/data/phone-price-performance-report.json';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const processorBrand = searchParams.get('processorBrand');
        const phoneBrand = searchParams.get('phoneBrand');
        const priceType = searchParams.get('priceType');

        const data = rows.filter((row) => {
            const processorBrandMatch = !processorBrand || processorBrand === 'All' || row.processorBrand === processorBrand;
            const phoneBrandMatch = !phoneBrand || phoneBrand === 'All' || row.phoneBrand === phoneBrand;
            const priceTypeMatch = !priceType || priceType === 'All' || row.plottedPrice?.priceType === priceType;
            return processorBrandMatch && phoneBrandMatch && priceTypeMatch;
        });

        return NextResponse.json({ success: true, count: data.length, data, report });
    } catch (error) {
        console.error('API /devices error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
    }
}
