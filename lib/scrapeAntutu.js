const ANTUTU_API = 'https://www.antutu.com/web/api/rank/list';

/**
 * Known brand mappings for model name → brand extraction.
 * Keys are lowercase prefixes/patterns to match against model names.
 */
const BRAND_PATTERNS = [
    // Exact prefix matches (order matters — more specific first)
    { pattern: /^red magic/i, brand: 'Red Magic' },
    { pattern: /^redmi/i, brand: 'Xiaomi' },
    { pattern: /^poco/i, brand: 'POCO' },
    { pattern: /^mi \d/i, brand: 'Xiaomi' },
    { pattern: /^mi \w/i, brand: 'Xiaomi' },
    { pattern: /^galaxy/i, brand: 'Samsung' },
    { pattern: /^iphone/i, brand: 'Apple' },
    { pattern: /^ipad/i, brand: 'Apple' },
    { pattern: /^iqoo/i, brand: 'iQOO' },
    { pattern: /^vivo/i, brand: 'vivo' },
    { pattern: /^oppo/i, brand: 'OPPO' },
    { pattern: /^oneplus/i, brand: 'OnePlus' },
    { pattern: /^realme/i, brand: 'realme' },
    { pattern: /^google pixel/i, brand: 'Google' },
    { pattern: /^pixel/i, brand: 'Google' },
    { pattern: /^rog phone/i, brand: 'Asus' },
    { pattern: /^motorola/i, brand: 'Motorola' },
    { pattern: /^moto /i, brand: 'Motorola' },
    { pattern: /^nothing/i, brand: 'Nothing' },
    { pattern: /^honor/i, brand: 'HONOR' },
    { pattern: /^huawei/i, brand: 'Huawei' },
    { pattern: /^infinix/i, brand: 'Infinix' },
    { pattern: /^tecno/i, brand: 'TECNO' },
    { pattern: /^nubia/i, brand: 'Nubia' },
    { pattern: /^zte/i, brand: 'ZTE' },
    { pattern: /^sony/i, brand: 'Sony' },
    { pattern: /^nokia/i, brand: 'Nokia' },
    { pattern: /^lenovo/i, brand: 'Lenovo' },
];

/**
 * Extract brand name from a model name string.
 */
function extractBrand(modelName) {
    if (!modelName) return 'Unknown';

    for (const { pattern, brand } of BRAND_PATTERNS) {
        if (pattern.test(modelName)) {
            return brand;
        }
    }

    // Fallback: use the first word
    const firstWord = modelName.split(' ')[0];
    return firstWord || 'Unknown';
}


/**
 * Fetch detailed device specs from Mobile Phone Specs Database on RapidAPI.
 * Extracts Indian Price (₹) and Release Date.
 */
async function fetchDeviceDetails(brand, modelName) {
    console.log(`fetchDeviceDetails called for ${brand} ${modelName}. Key present:`, !!process.env.RAPIDAPI_KEY);
    if (!process.env.RAPIDAPI_KEY) {
        console.log('No RAPIDAPI_KEY found in process.env');
        return null;
    }

    // Clean up model name for better matching (AnTuTu sometimes has extra suffixes)
    const cleanModel = modelName.replace(/ \d+GB.*$/i, '').trim();

    try {
        const url = `https://mobile-phone-specs-database.p.rapidapi.com/gsm/get-specifications-by-brandname-modelname/${encodeURIComponent(brand)}/${encodeURIComponent(cleanModel)}`;
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'mobile-phone-specs-database.p.rapidapi.com'
            },
            // Fast timeout so the scraper doesn't hang forever
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            console.log(`RapidAPI error for ${brand} ${cleanModel}: ${res.status} ${res.statusText}`);
            return null;
        }
        const data = await res.json();

        // Debug
        // console.log(`RapidAPI Success: ${brand} ${cleanModel}`, Object.keys(data));

        let price = null;
        let releaseDate = null;

        // Parse price like "€ 983.59 / $ 708.99 / £ 833.00 / C$ 1,049.00 / ₹ 93,500"
        if (data.gsmMiscDetails && data.gsmMiscDetails.miscPrice) {
            const priceStr = data.gsmMiscDetails.miscPrice;
            const match = priceStr.match(/₹\s*([\d,]+)/);
            if (match) {
                price = parseInt(match[1].replace(/,/g, ''), 10);
            }
        }

        // Parse launch status like "Available. Released 2022, February 25"
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
        return null; // Ignore errors, silently fallback to simulate price
    }
}

/**
 * Scrape AnTuTu ranking data for a given category.
 *
 * @param {string} category - One of: 'android', 'android_lite', 'android_soc',
 *                            'android_ai_phone', 'android_ai_llm', 'ios'
 * @returns {Promise<{devices: Array, rankDate: number, error?: string}>}
 */
export async function scrapeAntutu(category) {
    const url = `${ANTUTU_API}?top_os=${encodeURIComponent(category)}&lang=abroad&order=1`;

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.antutu.com/web/ranking',
        },
        next: { revalidate: 0 },
    });

    if (!res.ok) {
        throw new Error(`AnTuTu API returned ${res.status} for category: ${category}`);
    }

    const json = await res.json();

    if (json.code !== 200 || !json.data?.list) {
        throw new Error(`AnTuTu API error: code=${json.code}, category=${category}`);
    }

    const list = json.data.list;
    const rankDate = json.data.rankDate || json.data.ym;

    const devices = [];

    // Process sequentially with a delay to prevent 429 Too Many Requests limits
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const modelName = (item.modelcn || '').trim();
        const brand = extractBrand(modelName);

        let realPrice = null;
        let releaseDate = null;

        if (brand !== 'Unknown') {
            const extra = await fetchDeviceDetails(brand, modelName);
            if (extra) {
                realPrice = extra.price;
                releaseDate = extra.releaseDate;
            }
            // Strict delay to respect 1-2 req/sec Free API limits
            await new Promise(r => setTimeout(r, 400));
        }

        devices.push({
            rank: i + 1,
            modelName,
            brand,
            score: item.totalscore || item.scorest || 0,
            cpuScore: item.cpuscore || item.cpu_score || 0,
            gpuScore: item['3dscore'] || item.s_3D || 0,
            memScore: item.s_mem || 0,
            uxScore: item.uxscore || item.s_UX || 0,
            chipset: item.cpu_short || '',
            ram: item.ram || item.memory || '',
            storage: item.storage || item.phonememory || '',
            category,
            price: realPrice,
            releaseDate: releaseDate
        });
    }

    return { devices, rankDate };
}

export { extractBrand, simulatePrice, fetchDeviceDetails };
