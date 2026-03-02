import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';

export async function GET(request) {
    try {
        await connectToDatabase();

        // If no DB connection, return some highly realistic mock data so UI dashboard always looks premium during setup
        if (!process.env.MONGODB_URI) {
            return NextResponse.json({
                success: true,
                isMock: true,
                data: [
                    { _id: '1', modelName: 'Red Magic 9 Pro', score: 2124560, brand: 'Red', price: 649 },
                    { _id: '2', modelName: 'iQOO 12', score: 2118320, brand: 'iQOO', price: 699 },
                    { _id: '3', modelName: 'ROG Phone 8 Pro', score: 2110214, brand: 'Asus', price: 1199 },
                    { _id: '4', modelName: 'vivo X100 Pro', score: 2018544, brand: 'vivo', price: 999 },
                    { _id: '5', modelName: 'Galaxy S24 Ultra', score: 1989012, brand: 'Samsung', price: 1299 },
                    { _id: '6', modelName: 'iPhone 15 Pro Max', score: 1515902, brand: 'Apple', price: 1199 },
                    { _id: '7', modelName: 'OnePlus 12', score: 2085440, brand: 'OnePlus', price: 799 },
                    { _id: '8', modelName: 'Xiaomi 14 Pro', score: 2058430, brand: 'Xiaomi', price: 899 },
                    { _id: '9', modelName: 'Pixel 8 Pro', score: 1150000, brand: 'Google', price: 999 },
                    { _id: '10', modelName: 'Galaxy S23 Ultra', score: 1532000, brand: 'Samsung', price: 899 },
                    { _id: '11', modelName: 'POCO X6 Pro', score: 1420500, brand: 'POCO', price: 350 },
                    { _id: '12', modelName: 'Nothing Phone (2)', score: 1100500, brand: 'Nothing', price: 599 },
                    { _id: '13', modelName: 'Moto Edge 40 Pro', score: 1300200, brand: 'Motorola', price: 799 },
                ]
            });
        }

        const { searchParams } = new URL(request.url);
        const brand = searchParams.get('brand');

        // Build query for MongoDB dynamically based on filters
        const query = {};
        if (brand && brand !== 'All') {
            // Use regex for case-insensitive and partial matches if needed, exact is fine too
            query.brand = new RegExp(`^${brand}$`, 'i');
        }

        const devices = await Device.find(query).sort({ score: -1 }).lean();

        return NextResponse.json({ success: true, data: devices });
    } catch (error) {
        console.error('API /devices error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
    }
}
