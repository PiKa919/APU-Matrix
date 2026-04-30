import { fetchGsmaArenaMetadata, normalizeModelName } from './gsmarena.js';

function isFilledString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function chooseFieldValue({ currentValue, currentSource, nextValue, nextSource }) {
    const hasCurrent = typeof currentValue === 'number' ? isPositiveNumber(currentValue) : isFilledString(currentValue);
    const hasNext = typeof nextValue === 'number' ? isPositiveNumber(nextValue) : isFilledString(nextValue);

    if (hasNext) {
        return { value: nextValue, source: nextSource };
    }

    return { value: hasCurrent ? currentValue : null, source: hasCurrent ? currentSource : undefined };
}

export async function fetchRapidApiDeviceDetails(brand, modelName) {
    if (!process.env.RAPIDAPI_KEY) {
        return null;
    }

    const cleanModel = normalizeModelName(modelName);

    try {
        const url = `https://mobile-phone-specs-database.p.rapidapi.com/gsm/get-specifications-by-brandname-modelname/${encodeURIComponent(brand)}/${encodeURIComponent(cleanModel)}`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'mobile-phone-specs-database.p.rapidapi.com'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            console.log(`RapidAPI error for ${brand} ${cleanModel}: ${res.status} ${res.statusText}`);
            return null;
        }
        const data = await res.json();

        let price = null;
        let releaseDate = null;

        if (data.gsmMiscDetails && data.gsmMiscDetails.miscPrice) {
            const priceStr = data.gsmMiscDetails.miscPrice;
            const match = priceStr.match(/₹\s*([\d,]+)/);
            if (match) {
                price = parseInt(match[1].replace(/,/g, ''), 10);
            }
        }

        if (data.gsmLaunchDetails && data.gsmLaunchDetails.launchStatus) {
            const status = data.gsmLaunchDetails.launchStatus;
            const releaseMatch = status.match(/Released\s+(.*)/i);
            if (releaseMatch) {
                releaseDate = releaseMatch[1].trim();
            } else {
                releaseDate = status.trim();
            }
        }

        return { price, releaseDate };
    } catch (e) {
        console.log(`RapidAPI exception for ${brand} ${cleanModel}:`, e.message);
        return null;
    }
}

export async function enrichDeviceMetadata(device, extractBrand) {
    const brand = device.brand && device.brand !== 'Unknown' ? device.brand : extractBrand(device.modelName);
    const normalizedModelName = normalizeModelName(device.modelName);

    let gsmArenaData = null;
    try {
        gsmArenaData = await fetchGsmaArenaMetadata(brand, normalizedModelName);
    } catch (error) {
        console.warn(`GSMArena enrichment failed for ${device.modelName}:`, error.message);
    }

    let rapidApiData = null;
    const needsFallback = !gsmArenaData || (!gsmArenaData.price && !gsmArenaData.releaseDate);

    if (needsFallback && brand && brand !== 'Unknown') {
        rapidApiData = await fetchRapidApiDeviceDetails(brand, normalizedModelName);
    }

    const resolvedBrand = chooseFieldValue({
        currentValue: device.brand,
        currentSource: 'antutu',
        nextValue: brand,
        nextSource: 'derived',
    });
    const resolvedChipset = chooseFieldValue({
        currentValue: device.chipset,
        currentSource: 'antutu',
        nextValue: gsmArenaData?.chipset,
        nextSource: 'gsmarena',
    });
    const resolvedRam = chooseFieldValue({
        currentValue: device.ram,
        currentSource: 'antutu',
        nextValue: gsmArenaData?.ram,
        nextSource: 'gsmarena',
    });
    const resolvedStorage = chooseFieldValue({
        currentValue: device.storage,
        currentSource: 'antutu',
        nextValue: gsmArenaData?.storage,
        nextSource: 'gsmarena',
    });
    const resolvedPrice = chooseFieldValue({
        currentValue: device.price,
        currentSource: device.metadataSources?.price,
        nextValue: gsmArenaData?.price ?? rapidApiData?.price,
        nextSource: gsmArenaData?.price ? 'gsmarena' : (rapidApiData?.price ? 'rapidapi' : undefined),
    });
    const resolvedReleaseDate = chooseFieldValue({
        currentValue: device.releaseDate,
        currentSource: device.metadataSources?.releaseDate,
        nextValue: gsmArenaData?.releaseDate ?? rapidApiData?.releaseDate,
        nextSource: gsmArenaData?.releaseDate ? 'gsmarena' : (rapidApiData?.releaseDate ? 'rapidapi' : undefined),
    });

    const metadataSources = {
        brand: resolvedBrand.source,
        chipset: resolvedChipset.source,
        ram: resolvedRam.source,
        storage: resolvedStorage.source,
        price: resolvedPrice.source,
        releaseDate: resolvedReleaseDate.source,
    };

    const sourceUrls = {};
    if (gsmArenaData?.matchedUrl) {
        sourceUrls.gsmarena = gsmArenaData.matchedUrl;
    }

    return {
        brand: resolvedBrand.value,
        chipset: resolvedChipset.value,
        ram: resolvedRam.value,
        storage: resolvedStorage.value,
        price: resolvedPrice.value,
        releaseDate: resolvedReleaseDate.value,
        priceCurrency: gsmArenaData?.priceCurrency || null,
        priceRaw: gsmArenaData?.priceRaw || null,
        metadataSources,
        sourceUrls,
        enrichmentConfidence: gsmArenaData?.confidence,
        lastEnrichedAt: gsmArenaData ? new Date() : null,
    };
}