import { NextResponse } from 'next/server';
import rows from '@/public/data/phone-price-performance.json';
import report from '@/public/data/phone-price-performance-report.json';

const DEFAULT_VISIBLE_CATEGORIES = new Set(['android', 'android_ai_phone', 'android_ai_llm']);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const processorBrand = searchParams.get('processorBrand');
        const phoneBrand = searchParams.get('phoneBrand');
        const priceType = searchParams.get('priceType');
        const includeAllCategories = searchParams.get('includeAllCategories') === 'true';

        const data = rows.filter((row) => {
            const categoryMatch = includeAllCategories || DEFAULT_VISIBLE_CATEGORIES.has(row.category);
            const processorBrandMatch = !processorBrand || processorBrand === 'All' || row.processorBrand === processorBrand;
            const phoneBrandMatch = !phoneBrand || phoneBrand === 'All' || row.phoneBrand === phoneBrand;
            const priceTypeMatch = !priceType || priceType === 'All' || row.plottedPrice?.priceType === priceType;
            return categoryMatch && processorBrandMatch && phoneBrandMatch && priceTypeMatch;
        });

        return NextResponse.json({ success: true, count: data.length, data, report });
    } catch (error) {
        console.error('API /devices error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
    }
}
