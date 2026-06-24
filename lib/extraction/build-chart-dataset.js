import { normalizePrice } from './currency.js'
import { getProcessorMetadata } from './processor-normalization.js'
import { bestPhoneMatch } from './phone-matching.js'
import { selectPlottedPrice } from './price-selection.js'

function stableId(parts) {
  return parts
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeCandidates(prices, source, priceType) {
  return (prices || [])
    .map((price) => normalizePrice(price, source, priceType))
    .filter(Boolean)
}

function existingCurrentPrices(phone) {
  const prices = []

  if (typeof phone.priceINR === 'number' && Number.isFinite(phone.priceINR) && phone.priceINR > 0) {
    prices.push(normalizePrice({
      amount: phone.priceINR,
      currency: 'INR',
      rawValue: `INR ${phone.priceINR}`,
      confidence: 0.65,
    }, 'existing-data', 'current'))
  }

  if (typeof phone.priceUSD === 'number' && Number.isFinite(phone.priceUSD) && phone.priceUSD > 0) {
    prices.push(normalizePrice({
      amount: phone.priceUSD,
      currency: 'USD',
      rawValue: `USD ${phone.priceUSD}`,
      confidence: 0.62,
    }, 'existing-data', 'current'))
  }

  return prices.filter(Boolean)
}

function overrideCandidates(overrides) {
  return overrides.map((override) => ({
    ...override,
    name: override.phoneName,
    brand: override.phoneBrand,
  }))
}

function hasCompatibleProcessor(override, processorName) {
  if (!override.processorName) {
    return true
  }

  const overrideProcessor = getProcessorMetadata(override.processorName).processorName
  return overrideProcessor !== 'Unknown' && overrideProcessor === processorName
}

function rowFromPhone(processorRecord, phone, overrideMatch) {
  const processor = getProcessorMetadata(processorRecord.processor || phone.processorName || phone.chipset)
  const override = overrideMatch?.candidate || null
  const source = override?.source || 'existing-data'
  const launchPrices = normalizeCandidates(override?.launchPrices, source, 'launch')
  const currentPrices = [
    ...normalizeCandidates(override?.currentPrices, source, 'current'),
    ...existingCurrentPrices(phone),
  ]
  const plottedPrice = selectPlottedPrice(launchPrices, currentPrices)
  const missingFields = []

  if (!plottedPrice) {
    missingFields.push('price')
  }

  if (!phone.score) {
    missingFields.push('antutuScore')
  }

  if (!processor.processorName || processor.processorName === 'Unknown') {
    missingFields.push('processorName')
  }

  return {
    id: stableId([phone.name, phone.brand, processor.processorName, phone.category]),
    phoneName: phone.name,
    phoneBrand: override?.phoneBrand || phone.brand || 'Unknown',
    ...processor,
    antutuScore: phone.score || 0,
    antutuRank: phone.rank || null,
    category: phone.category || 'unknown',
    releaseDate: override?.releaseDate || phone.releaseDate || null,
    plottedPrice,
    launchPrices,
    currentPrices,
    sourceMatches: overrideMatch
      ? [{ source, matchedName: override.phoneName, url: override.url || null, confidence: overrideMatch.confidence }]
      : [],
    missingFields,
  }
}

function countBy(rows, key) {
  return Object.fromEntries(
    [...new Set(rows.map((row) => row[key]).filter(Boolean))]
      .sort()
      .map((value) => [value, rows.filter((row) => row[key] === value).length])
  )
}

function buildReport(rows) {
  const plottedRows = rows.filter((row) => row.plottedPrice)

  return {
    totalRows: rows.length,
    plottedRows: plottedRows.length,
    launchPriceRows: plottedRows.filter((row) => row.plottedPrice.priceType === 'launch').length,
    currentFallbackRows: plottedRows.filter((row) => row.plottedPrice.priceType === 'current').length,
    missingPriceRows: rows.filter((row) => !row.plottedPrice).length,
    processorBrands: countBy(rows, 'processorBrand'),
    processorSeries: countBy(rows, 'processorSeries'),
    generatedAt: new Date().toISOString(),
  }
}

export function buildPhonePricePerformanceDataset({ detailedData = [], overrides = [] } = {}) {
  const rows = []
  const candidates = overrideCandidates(overrides)

  for (const processorRecord of detailedData) {
    for (const phone of processorRecord.phones || []) {
      const processor = getProcessorMetadata(processorRecord.processor || phone.chipset)
      const compatibleCandidates = candidates.filter((candidate) => hasCompatibleProcessor(candidate, processor.processorName))
      const overrideMatch = bestPhoneMatch(
        {
          phoneName: phone.name,
          phoneBrand: phone.brand,
          processorName: processor.processorName,
        },
        compatibleCandidates,
        0.65
      )

      rows.push(rowFromPhone(processorRecord, phone, overrideMatch))
    }
  }

  return { rows, report: buildReport(rows) }
}
