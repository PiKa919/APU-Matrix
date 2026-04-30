import * as cheerio from 'cheerio';

const GSMARENA_BASE_URL = 'https://www.gsmarena.com';
const GSMARENA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
    'Referer': GSMARENA_BASE_URL,
};

const CURRENCY_TO_INR = {
    INR: 1,
    USD: 83,
    EUR: 90,
    GBP: 105,
    CAD: 61,
};

const MATCH_STOP_WORDS = new Set([
    '5g', '4g', '2024', '2025', '2026', 'edition', 'version', 'global', 'international', 'china', 'cn', 'india',
    'smartphone', 'phone', 'tablet', 'wifi', 'cellular', 'dual', 'sim'
]);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(value) {
    return value.replace(/\s+/g, ' ').trim();
}

export function normalizeModelName(modelName) {
    if (!modelName) return '';

    return normalizeWhitespace(
        modelName
            .replace(/\([^)]*\)/g, ' ')
            .replace(/\[[^\]]*\]/g, ' ')
            .replace(/\b\d+\s*GB\s*\+\s*\d+\s*GB\b/gi, ' ')
            .replace(/\b\d+\s*GB\s*\/\s*\d+\s*GB\b/gi, ' ')
            .replace(/\b\d+(?:\.\d+)?\s*(?:GB|TB)\b.*$/i, ' ')
            .replace(/\b(?:global|international|china|cn|india|edition|version)\b/gi, ' ')
            .replace(/[|_,]+/g, ' ')
    );
}

function normalizeForMatch(value) {
    return normalizeModelName(value)
        .toLowerCase()
        .replace(/\+/g, ' plus ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\b(?:5g|4g|uw|ultra\s*wideband)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeForMatch(value) {
    return normalizeForMatch(value)
        .split(' ')
        .filter(Boolean)
        .filter((token) => !MATCH_STOP_WORDS.has(token));
}

function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function buildSearchQueries(brand, modelName) {
    const normalizedModel = normalizeModelName(modelName);
    const normalizedBrand = normalizeWhitespace(brand || '');

    return uniqueValues([
        `${normalizedBrand} ${normalizedModel}`.trim(),
        normalizedModel,
        normalizedModel.replace(new RegExp(`^${normalizedBrand}\\s+`, 'i'), '').trim(),
    ]);
}

function scoreCandidateMatch({ brand, modelName, candidateName }) {
    const targetTokens = tokenizeForMatch(`${brand || ''} ${modelName}`);
    const candidateTokens = tokenizeForMatch(candidateName);

    if (targetTokens.length === 0 || candidateTokens.length === 0) {
        return 0;
    }

    const targetSet = new Set(targetTokens);
    const candidateSet = new Set(candidateTokens);

    let overlapCount = 0;
    for (const token of candidateSet) {
        if (targetSet.has(token)) {
            overlapCount += 1;
        }
    }

    const targetCoverage = overlapCount / targetSet.size;
    const candidateCoverage = overlapCount / candidateSet.size;

    let score = (targetCoverage * 0.7) + (candidateCoverage * 0.2);

    const normalizedTarget = normalizeForMatch(`${brand || ''} ${modelName}`);
    const normalizedCandidate = normalizeForMatch(candidateName);

    if (normalizedCandidate === normalizedTarget) {
        score += 0.25;
    } else if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) {
        score += 0.15;
    }

    if (brand) {
        const normalizedBrand = normalizeForMatch(brand);
        if (normalizedCandidate.includes(normalizedBrand)) {
            score += 0.1;
        }
    }

    return Math.max(0, Math.min(1, score));
}

async function fetchHtml(url) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(url, {
            headers: GSMARENA_HEADERS,
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
            return response.text();
        }

        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === 2) {
            throw new Error(`GSMArena returned ${response.status} for ${url}`);
        }

        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : 0;
        const backoffMs = retryAfterMs || (1500 * (attempt + 1));
        await sleep(backoffMs);
    }

    throw new Error(`GSMArena request exhausted retries for ${url}`);
}

function parseSearchResults(html, brand, modelName) {
    const $ = cheerio.load(html);
    const candidates = [];

    $('#review-body .makers li a').each((_, element) => {
        const anchor = $(element);
        const href = anchor.attr('href');
        const candidateName = normalizeWhitespace(anchor.text());

        if (!href || !candidateName) {
            return;
        }

        const url = href.startsWith('http') ? href : `${GSMARENA_BASE_URL}/${href.replace(/^\//, '')}`;
        const score = scoreCandidateMatch({ brand, modelName, candidateName });

        candidates.push({ name: candidateName, url, score });
    });

    return candidates.sort((left, right) => right.score - left.score);
}

function parseReleaseDate(statusText, announcedText) {
    if (statusText) {
        const match = statusText.match(/Released\s+([^,]+(?:,\s*[^,]+)?)/i);
        if (match) {
            return normalizeWhitespace(match[1]);
        }

        return normalizeWhitespace(statusText);
    }

    if (announcedText) {
        return normalizeWhitespace(announcedText);
    }

    return null;
}

function formatRamValue(value) {
    return Number.isInteger(value) ? `${value}GB` : `${value.toFixed(1)}GB`;
}

function formatStorageValue(valueInGb) {
    if (valueInGb >= 1024 && valueInGb % 1024 === 0) {
        return `${valueInGb / 1024}TB`;
    }

    return `${valueInGb}GB`;
}

function parseMemorySpec(internalText) {
    if (!internalText) {
        return { ram: null, storage: null };
    }

    const variants = internalText
        .split(',')
        .map((variant) => variant.trim())
        .filter(Boolean)
        .map((variant) => {
            const storageMatch = variant.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
            const ramMatch = variant.match(/(\d+(?:\.\d+)?)\s*GB\s*RAM/i);

            if (!storageMatch && !ramMatch) {
                return null;
            }

            const storageAmount = storageMatch ? Number.parseFloat(storageMatch[1]) : 0;
            const storageUnit = storageMatch ? storageMatch[2].toUpperCase() : 'GB';
            const storageInGb = storageUnit === 'TB' ? storageAmount * 1024 : storageAmount;
            const ramInGb = ramMatch ? Number.parseFloat(ramMatch[1]) : 0;

            return { storageInGb, ramInGb };
        })
        .filter(Boolean)
        .sort((left, right) => {
            if (right.storageInGb !== left.storageInGb) {
                return right.storageInGb - left.storageInGb;
            }

            return right.ramInGb - left.ramInGb;
        });

    if (variants.length === 0) {
        return { ram: null, storage: null };
    }

    return {
        ram: variants[0].ramInGb ? formatRamValue(variants[0].ramInGb) : null,
        storage: variants[0].storageInGb ? formatStorageValue(variants[0].storageInGb) : null,
    };
}

export function parsePriceToInr(priceText) {
    if (!priceText) {
        return { price: null, priceCurrency: null, priceRaw: null };
    }

    const normalizedPrice = normalizeWhitespace(priceText);
    const candidates = [
        { code: 'INR', pattern: /₹\s*([\d,]+(?:\.\d+)?)/i },
        { code: 'USD', pattern: /\$\s*([\d,]+(?:\.\d+)?)/i },
        { code: 'EUR', pattern: /€\s*([\d,]+(?:\.\d+)?)/i },
        { code: 'GBP', pattern: /£\s*([\d,]+(?:\.\d+)?)/i },
        { code: 'CAD', pattern: /C\$\s*([\d,]+(?:\.\d+)?)/i },
    ];

    for (const candidate of candidates) {
        const match = normalizedPrice.match(candidate.pattern);
        if (!match) {
            continue;
        }

        const numericValue = Number.parseFloat(match[1].replace(/,/g, ''));
        const exchangeRate = CURRENCY_TO_INR[candidate.code];

        if (!Number.isFinite(numericValue) || !exchangeRate) {
            continue;
        }

        return {
            price: Math.round(numericValue * exchangeRate),
            priceCurrency: candidate.code,
            priceRaw: normalizedPrice,
        };
    }

    return { price: null, priceCurrency: null, priceRaw: normalizedPrice };
}

export async function searchGsmaArenaDevice(brand, modelName) {
    const queries = buildSearchQueries(brand, modelName);
    let bestCandidate = null;

    for (const query of queries) {
        const searchUrl = `${GSMARENA_BASE_URL}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`;

        try {
            const html = await fetchHtml(searchUrl);
            const candidates = parseSearchResults(html, brand, modelName);

            if (candidates.length > 0 && (!bestCandidate || candidates[0].score > bestCandidate.score)) {
                bestCandidate = candidates[0];
            }

            if (bestCandidate && bestCandidate.score >= 0.9) {
                return bestCandidate;
            }
        } catch (error) {
            console.warn(`GSMArena search failed for ${query}:`, error.message);
        }

        await sleep(400);
    }

    if (!bestCandidate || bestCandidate.score < 0.55) {
        return null;
    }

    return bestCandidate;
}

export async function fetchGsmaArenaMetadata(brand, modelName) {
    const match = await searchGsmaArenaDevice(brand, modelName);
    if (!match) {
        return null;
    }

    await sleep(400);

    const html = await fetchHtml(match.url);
    const $ = cheerio.load(html);

    const statusText = $('[data-spec="status"]').first().text();
    const announcedText = $('[data-spec="year"]').first().text();
    const chipset = normalizeWhitespace($('[data-spec="chipset"]').first().text());
    const internal = normalizeWhitespace($('[data-spec="internalmemory"]').first().text());
    const priceText = normalizeWhitespace($('[data-spec="price"]').first().text());
    const { ram, storage } = parseMemorySpec(internal);
    const { price, priceCurrency, priceRaw } = parsePriceToInr(priceText);

    return {
        matchedName: normalizeWhitespace($('.specs-phone-name-title').first().text()) || match.name,
        matchedUrl: match.url,
        confidence: match.score,
        releaseDate: parseReleaseDate(statusText, announcedText),
        chipset: chipset || null,
        ram,
        storage,
        price,
        priceCurrency,
        priceRaw,
    };
}