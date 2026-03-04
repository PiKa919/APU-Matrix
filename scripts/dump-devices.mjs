// Dump AnTuTu devices from MongoDB to JSON file for the Python scraper
import mongoose from 'mongoose';
import fs from 'fs';

const phoneBrands = [
    "Samsung", "Apple", "Google", "OnePlus", "Xiaomi", "POCO",
    "vivo", "OPPO", "realme", "HONOR", "Huawei", "Motorola",
    "Infinix", "TECNO", "Nothing", "Nubia", "Red Magic", "iQOO", "Lenovo"
];

async function main() {
    await mongoose.connect(process.env.MONGODB_URL);
    const col = mongoose.connection.db.collection('devices');
    const devices = await col.find({ brand: { $in: phoneBrands } }).toArray();
    const slim = devices.map(d => ({
        _id: d._id.toString(),
        modelName: d.modelName,
        brand: d.brand,
        score: d.score
    }));
    const outPath = new URL('../../metallic-newton/antutu_devices.json', import.meta.url).pathname;
    fs.writeFileSync(outPath, JSON.stringify(slim, null, 2));
    console.log(`Saved ${slim.length} devices to ${outPath}`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
