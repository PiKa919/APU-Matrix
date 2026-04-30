#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import connectToDatabase from '../lib/mongodb.js';
import Device from '../models/Device.js';
import { enrichDeviceMetadata } from '../lib/device-enrichment.js';

const DEFAULT_JSON = path.resolve(
    import.meta.dirname,
    '../../metallic-newton/output_targeted/phones_data.json'
);

function buildQuery(processAll) {
    if (processAll) {
        return {};
    }

    return {
        $or: [
            { price: { $exists: false } },
            { price: null },
            { releaseDate: { $exists: false } },
            { releaseDate: null },
            { releaseDate: '' },
            { chipset: { $exists: false } },
            { chipset: null },
            { chipset: '' },
            { ram: { $exists: false } },
            { ram: null },
            { ram: '' },
            { storage: { $exists: false } },
            { storage: null },
            { storage: '' },
        ],
    };
}

function applyEnrichment(document, enrichment) {
    if (enrichment.brand) document.brand = enrichment.brand;
    if (enrichment.chipset) document.chipset = enrichment.chipset;
    if (enrichment.ram) document.ram = enrichment.ram;
    if (enrichment.storage) document.storage = enrichment.storage;
    if (enrichment.releaseDate) document.releaseDate = enrichment.releaseDate;
    if (typeof enrichment.price === 'number' && enrichment.price > 0) document.price = enrichment.price;
    if (enrichment.priceCurrency) document.priceCurrency = enrichment.priceCurrency;
    if (enrichment.priceRaw) document.priceRaw = enrichment.priceRaw;
    if (enrichment.metadataSources && Object.keys(enrichment.metadataSources).length > 0) document.metadataSources = enrichment.metadataSources;
    if (enrichment.sourceUrls && Object.keys(enrichment.sourceUrls).length > 0) document.sourceUrls = enrichment.sourceUrls;
    if (typeof enrichment.enrichmentConfidence === 'number') document.enrichmentConfidence = enrichment.enrichmentConfidence;
    if (enrichment.lastEnrichedAt) document.lastEnrichedAt = enrichment.lastEnrichedAt;
    document.lastUpdated = new Date();
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function parseArgs() {
    const processAll = process.argv.includes('--all');
    const dryRun = process.argv.includes('--dry-run');
    const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
    const jsonArg = process.argv.find((arg) => arg.startsWith('--json='));
    const positionalPath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

    return {
        processAll,
        dryRun,
        limit: limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 0,
        jsonPath: jsonArg ? jsonArg.split('=')[1] : positionalPath,
    };
}

function buildJsonIndexes(records) {
    const byAntutuId = new Map();
    const byModel = new Map();

    for (const record of records) {
        if (record.antutu_id) {
            byAntutuId.set(String(record.antutu_id), record);
        }

        const modelName = normalizeText(record.modelName || record.model_name || record.antutu_model || record.name);
        if (modelName) {
            byModel.set(modelName.toLowerCase(), record);
        }
    }

    return { byAntutuId, byModel };
}

function buildJsonEnrichment(record) {
    if (!record) {
        return null;
    }

    const metadataSources = {
        price: record.price_inr ? 'gsmarena_json' : undefined,
        releaseDate: record.release_date ? 'gsmarena_json' : undefined,
        chipset: record.chipset ? 'gsmarena_json' : undefined,
        ram: record.ram ? 'gsmarena_json' : undefined,
        storage: record.storage ? 'gsmarena_json' : undefined,
    };

    return {
        brand: normalizeText(record.brand) || null,
        price: typeof record.price_inr === 'number' ? record.price_inr : null,
        releaseDate: normalizeText(record.release_date) || null,
        chipset: normalizeText(record.chipset) || null,
        ram: normalizeText(record.ram) || null,
        storage: normalizeText(record.storage) || null,
        priceCurrency: record.price_inr ? 'INR' : null,
        priceRaw: normalizeText(record.price_raw) || null,
        metadataSources,
        sourceUrls: record.url ? { gsmarena: record.url } : {},
        enrichmentConfidence: typeof record.match_confidence === 'number' ? record.match_confidence : 1,
        lastEnrichedAt: new Date(),
    };
}

function getJsonRecord(device, indexes) {
    if (!indexes) {
        return null;
    }

    const antutuId = device._id ? String(device._id) : null;
    if (antutuId && indexes.byAntutuId.has(antutuId)) {
        return indexes.byAntutuId.get(antutuId);
    }

    const modelKey = normalizeText(device.modelName)?.toLowerCase();
    if (modelKey && indexes.byModel.has(modelKey)) {
        return indexes.byModel.get(modelKey);
    }

    return null;
}

function diffEnrichment(device, enrichment) {
    const changedFields = [];
    const relevantFields = ['brand', 'chipset', 'ram', 'storage', 'releaseDate', 'price', 'priceCurrency', 'priceRaw'];

    for (const field of relevantFields) {
        const nextValue = enrichment[field];
        if (nextValue === null || nextValue === undefined || nextValue === '') {
            continue;
        }

        const currentValue = device[field];
        if (currentValue !== nextValue) {
            changedFields.push(field);
        }
    }

    if (enrichment.metadataSources && Object.keys(enrichment.metadataSources).length > 0) {
        const currentSources = JSON.stringify(device.metadataSources || {});
        const nextSources = JSON.stringify(enrichment.metadataSources);
        if (currentSources !== nextSources) {
            changedFields.push('metadataSources');
        }
    }

    if (enrichment.sourceUrls && Object.keys(enrichment.sourceUrls).length > 0) {
        const currentUrls = JSON.stringify(device.sourceUrls || {});
        const nextUrls = JSON.stringify(enrichment.sourceUrls);
        if (currentUrls !== nextUrls) {
            changedFields.push('sourceUrls');
        }
    }

    return [...new Set(changedFields)];
}

async function main() {
    const { processAll, dryRun, limit, jsonPath } = parseArgs();

    await connectToDatabase();

    let jsonIndexes = null;
    const resolvedJsonPath = jsonPath || DEFAULT_JSON;
    if (resolvedJsonPath && fs.existsSync(resolvedJsonPath)) {
        const jsonRecords = JSON.parse(fs.readFileSync(resolvedJsonPath, 'utf8'));
        jsonIndexes = buildJsonIndexes(jsonRecords);
        console.log(`Loaded ${jsonRecords.length} GSMArena JSON records from ${resolvedJsonPath}`);
    } else if (jsonPath) {
        console.warn(`GSMArena JSON not found at ${resolvedJsonPath}; falling back to live enrichment.`);
    } else {
        console.log('No GSMArena JSON export found; using live enrichment.');
    }

    const query = buildQuery(processAll);
    let cursor = Device.find(query).sort({ score: -1 });

    if (limit > 0) {
        cursor = cursor.limit(limit);
    }

    const devices = await cursor.exec();

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let jsonMatched = 0;
    let liveMatched = 0;

    for (const device of devices) {
        try {
            const jsonRecord = getJsonRecord(device, jsonIndexes);
            const enrichment = jsonRecord
                ? buildJsonEnrichment(jsonRecord)
                : await enrichDeviceMetadata({
                    brand: device.brand,
                    modelName: device.modelName,
                    chipset: device.chipset,
                    ram: device.ram,
                    storage: device.storage,
                    price: device.price,
                    releaseDate: device.releaseDate,
                    metadataSources: device.metadataSources,
                }, (modelName) => device.brand || modelName.split(' ')[0] || 'Unknown');

            if (!enrichment) {
                skipped += 1;
                continue;
            }

            const changedFields = diffEnrichment(device, enrichment);
            if (changedFields.length === 0) {
                skipped += 1;
                console.log(`${dryRun ? '[dry-run] ' : ''}skipped ${device.modelName} (no new fields)`);
                continue;
            }

            if (!dryRun) {
                applyEnrichment(device, enrichment);
                await device.save();
            }

            updated += 1;
            if (jsonRecord) {
                jsonMatched += 1;
            } else {
                liveMatched += 1;
            }
            console.log(`${dryRun ? '[dry-run] ' : ''}updated ${device.modelName} [${changedFields.join(', ')}]`);
        } catch (error) {
            failed += 1;
            console.error(`Failed to enrich ${device.modelName}:`, error.message);
        }
    }

    console.log('------------------------------');
    console.log(`Processed: ${devices.length}`);
    console.log(`Updated:   ${updated}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Failed:    ${failed}`);
    console.log(`JSON:      ${jsonMatched}`);
    console.log(`Live:      ${liveMatched}`);
}

main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});