#!/usr/bin/env node
/**
 * Import GSMArena targeted scrape data into AnTuTu MongoDB.
 *
 * Usage:
 *   node --env-file=.env scripts/match-gsmarena.js [path-to-phones_data.json]
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const DEFAULT_JSON = path.resolve(
    import.meta.dirname,
    '../../metallic-newton/output_targeted/phones_data.json'
);

async function main() {
    const jsonPath = process.argv[2] || DEFAULT_JSON;

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ JSON not found at: ${jsonPath}`);
        process.exit(1);
    }

    console.log(`📂 Loading scraped data from: ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   ${data.length} phones loaded\n`);

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected\n');

    const col = mongoose.connection.db.collection('devices');

    let updated = 0;
    let skipped = 0;

    for (const phone of data) {
        if (!phone.antutu_id) {
            skipped++;
            continue;
        }

        const updates = {};

        // We already converted price to INR in Python
        if (phone.price_inr) {
            updates.price = phone.price_inr;
        }

        if (phone.release_date) {
            updates.releaseDate = phone.release_date;
        }

        if (phone.chipset) {
            updates.chipset = phone.chipset;
        }

        if (Object.keys(updates).length > 0) {
            await col.updateOne(
                { _id: new mongoose.Types.ObjectId(phone.antutu_id) },
                { $set: updates }
            );
            updated++;
        } else {
            skipped++;
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Devices updated: ${updated}`);
    console.log(`⏭  Skipped:         ${skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
