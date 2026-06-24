import { normalizePrice } from './currency.js'
import { getProcessorMetadata } from './processor-normalization.js'
import { bestPhoneMatch } from './phone-matching.js'
import { selectPlottedPrice } from './price-selection.js'

function stableId(parts) {
  return parts
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniquifyId(baseId, seenIds) {
  const count = seenIds.get(baseId) || 0
  seenIds.set(baseId, count + 1)
  return count === 0 ? baseId : `${baseId}-${count + 1}`
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

function rowFromPhone(processorRecord, phone, overrideMatch, seenIds) {
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

  const baseId = stableId([phone.name, phone.brand, processor.processorName, phone.category])

  return {
    id: uniquifyId(baseId, seenIds),
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
  const currentPriceRows = plottedRows.filter((row) => row.plottedPrice.priceType === 'current').length
  const launchFallbackRows = plottedRows.filter((row) => row.plottedPrice.priceType === 'launch').length

  return {
    totalRows: rows.length,
    plottedRows: plottedRows.length,
    currentPriceRows,
    launchFallbackRows,
    launchPriceRows: launchFallbackRows,
    currentFallbackRows: currentPriceRows,
    missingPriceRows: rows.filter((row) => !row.plottedPrice).length,
    processorBrands: countBy(rows, 'processorBrand'),
    processorSeries: countBy(rows, 'processorSeries'),
    generatedAt: new Date().toISOString(),
  }
}

export function buildPhonePricePerformanceDataset({ detailedData = [], overrides = [] } = {}) {
  const rows = []
  const candidates = overrideCandidates(overrides)
  const seenIds = new Map()

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

      rows.push(rowFromPhone(processorRecord, phone, overrideMatch, seenIds))
    }
  }

  return { rows, report: buildReport(rows) }
}
