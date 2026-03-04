#!/usr/bin/env node
/**
 * Match GSMArena scraped data → AnTuTu MongoDB devices.
 *
 * Usage:
 *   node --env-file=.env scripts/match-gsmarena.js [path-to-gsmarena-json]
 *
 * Default JSON path: ../metallic-newton/output_all/phones_data.json
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_JSON = path.resolve(
    import.meta.dirname,
    '../../metallic-newton/output_all/phones_data.json'
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a phone name for fuzzy comparison.
 * Strips brand prefix, removes "5G"/"4G", RAM/storage suffixes, trims.
 */
function normalise(name) {
    return name
        .toLowerCase()
        .replace(/\b(5g|4g|lte)\b/gi, '')
        .replace(/\d+\s*gb\s*(ram)?/gi, '')  // "12GB RAM", "256GB"
        .replace(/\d+\s*tb/gi, '')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Remove the brand prefix from a name.
 * e.g. "Samsung Galaxy S24 Ultra" → "Galaxy S24 Ultra"
 */
function stripBrand(name, brand) {
    const re = new RegExp(`^${brand}\\s+`, 'i');
    return name.replace(re, '').trim();
}

/**
 * Extract ₹ price from a multi-currency string.
 * e.g. "$ 799.99 / ₹ 93,500 / € 949" → 93500
 */
function extractINR(priceStr) {
    if (!priceStr) return null;
    // Match ₹ followed by optional spaces and digits with commas
    const match = priceStr.match(/₹\s*([\d,]+(?:\.\d+)?)/);
    if (match) {
        return Math.round(parseFloat(match[1].replace(/,/g, '')));
    }
    return null;
}

/**
 * Extract USD price as fallback.
 */
function extractUSD(priceStr) {
    if (!priceStr) return null;
    const match = priceStr.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    if (match) {
        return Math.round(parseFloat(match[1].replace(/,/g, '')));
    }
    return null;
}

/**
 * Parse release date from GSMArena status string.
 * e.g. "Available. Released 2024, January 17" → "2024, January 17"
 */
function parseReleaseDate(statusStr) {
    if (!statusStr) return null;
    const match = statusStr.match(/Released\s+(.*)/i);
    if (match) return match[1].trim();
    return statusStr.trim();
}

/**
 * Calculate similarity between two normalised strings.
 * Uses token overlap (Jaccard-like).
 */
function similarity(a, b) {
    const tokA = new Set(a.split(' ').filter(Boolean));
    const tokB = new Set(b.split(' ').filter(Boolean));
    let overlap = 0;
    for (const t of tokA) {
        if (tokB.has(t)) overlap++;
    }
    const union = new Set([...tokA, ...tokB]).size;
    return union === 0 ? 0 : overlap / union;
}

// ─── Brand name mapping (AnTuTu → GSMArena) ─────────────────────────────────

const BRAND_MAP = {
    'Samsung': 'Samsung',
    'Apple': 'Apple',
    'Google': 'Google',
    'OnePlus': 'OnePlus',
    'Xiaomi': 'Xiaomi',
    'POCO': 'Xiaomi',   // POCO is listed under Xiaomi on GSMArena
    'vivo': 'vivo',
    'OPPO': 'Oppo',
    'realme': 'Realme',
    'HONOR': 'Honor',
    'Huawei': 'Huawei',
    'Motorola': 'Motorola',
    'Infinix': 'Infinix',
    'TECNO': 'Tecno',
    'Nothing': 'Nothing',
    'Nubia': 'ZTE',
    'Red Magic': 'ZTE',
    'iQOO': 'vivo',     // iQOO is a sub-brand of vivo
    'Lenovo': 'Lenovo',
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    const jsonPath = process.argv[2] || DEFAULT_JSON;

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ GSMArena JSON not found at: ${jsonPath}`);
        console.error('   Run the scraper first, or pass a path as argument.');
        process.exit(1);
    }

    console.log(`📂 Loading GSMArena data from: ${jsonPath}`);
    const gsmData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   ${gsmData.length} phones loaded\n`);

    // Index GSMArena data by normalised name for fast lookup
    const gsmByBrand = {};
    for (const phone of gsmData) {
        const brand = phone.brand;
        if (!gsmByBrand[brand]) gsmByBrand[brand] = [];
        gsmByBrand[brand].push({
            ...phone,
            _norm: normalise(stripBrand(phone.name, brand)),
        });
    }

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected\n');

    const col = mongoose.connection.db.collection('devices');
    const devices = await col.find({}).toArray();
    console.log(`📊 ${devices.length} devices in AnTuTu DB\n`);

    let matched = 0;
    let unmatched = 0;
    let skipped = 0;
    let priceUpdated = 0;
    let dateUpdated = 0;

    for (const dev of devices) {
        const antutuBrand = dev.brand;
        const gsmBrand = BRAND_MAP[antutuBrand];

        if (!gsmBrand || !gsmByBrand[gsmBrand]) {
            skipped++;
            continue;
        }

        const pool = gsmByBrand[gsmBrand];
        const devNorm = normalise(stripBrand(dev.modelName, antutuBrand));

        // Find best match
        let bestScore = 0;
        let bestPhone = null;

        for (const phone of pool) {
            // Also try matching without GSM brand prefix
            const score = similarity(devNorm, phone._norm);
            if (score > bestScore) {
                bestScore = score;
                bestPhone = phone;
            }
        }

        // Require a minimum similarity threshold
        if (bestScore < 0.5 || !bestPhone) {
            unmatched++;
            continue;
        }

        matched++;

        const updates = {};

        // Extract ₹ price, fallback to USD conversion
        const inrPrice = extractINR(bestPhone.price);
        const usdPrice = extractUSD(bestPhone.price);
        if (inrPrice) {
            updates.price = inrPrice;
            priceUpdated++;
        } else if (usdPrice) {
            // Rough USD→INR conversion (~₹84)
            updates.price = Math.round(usdPrice * 84);
            priceUpdated++;
        }

        // Release date
        const releaseDate = parseReleaseDate(bestPhone.release_date);
        if (releaseDate) {
            updates.releaseDate = releaseDate;
            dateUpdated++;
        }

        // Chipset (only update if we got better data)
        if (bestPhone.chipset) {
            updates.chipset = bestPhone.chipset;
        }

        if (Object.keys(updates).length > 0) {
            await col.updateOne(
                { _id: dev._id },
                { $set: updates }
            );
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Matched:        ${matched}`);
    console.log(`❌ Unmatched:      ${unmatched}`);
    console.log(`⏭  Skipped (SoC):  ${skipped}`);
    console.log(`💰 Prices updated: ${priceUpdated}`);
    console.log(`📅 Dates updated:  ${dateUpdated}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
