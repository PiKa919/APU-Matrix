export const DEFAULT_EXCHANGE_RATES = {
  INR: 1,
  USD: 87,
  CNY: 11.5,
  EUR: 94,
  GBP: 110,
  JPY: 0.6,
  KRW: 0.063,
}

const PRICE_PATTERNS = [
  { currency: 'INR', pattern: /(?:INR|₹)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'USD', pattern: /(?:USD|\$)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'CNY', pattern: /(?:CNY|RMB|CN¥)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'EUR', pattern: /(?:EUR|€)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'GBP', pattern: /(?:GBP|£)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'JPY', pattern: /(?:JPY|¥)\s*([\d,]+(?:\.\d+)?)/i },
  { currency: 'KRW', pattern: /(?:KRW)\s*([\d,]+(?:\.\d+)?)/i },
]

function toAmount(value) {
  const amount = Number.parseFloat(String(value).replace(/,/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

function normalizeRawValue(rawValue) {
  return rawValue.trim().replace(/\s+/g, ' ')
}

function getExchangeRate(currency, rates) {
  const rate = rates?.[currency]
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? rate : null
}

function parseObjectPrice(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const amount = toAmount(value.amount)
  const currency = typeof value.currency === 'string' ? value.currency.trim().toUpperCase() : ''

  if (!amount || !currency) {
    return null
  }

  return {
    amount,
    currency,
    rawValue: typeof value.rawValue === 'string' && value.rawValue.trim().length > 0
      ? value.rawValue
      : `${currency} ${amount}`,
    confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence)
      ? value.confidence
      : undefined,
  }
}

export function parseCurrencyValue(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return null
  }

  const normalized = normalizeRawValue(rawValue)

  for (const { currency, pattern } of PRICE_PATTERNS) {
    const match = normalized.match(pattern)
    if (!match) {
      continue
    }

    const amount = toAmount(match[1])
    if (!amount) {
      return null
    }

    return {
      amount,
      currency,
      rawValue: normalized,
    }
  }

  return null
}

export function normalizePrice(rawValue, source, priceType, rates = DEFAULT_EXCHANGE_RATES) {
  const parsed = typeof rawValue === 'string' ? parseCurrencyValue(rawValue) : parseObjectPrice(rawValue)

  if (!parsed) {
    return null
  }

  const rate = getExchangeRate(parsed.currency, rates)
  const usdRate = getExchangeRate('USD', rates)

  if (!rate || !usdRate) {
    return null
  }

  const normalizedINR = Math.round(parsed.amount * rate)
  const normalizedUSD = Number((normalizedINR / usdRate).toFixed(2))

  return {
    amount: parsed.amount,
    currency: parsed.currency,
    normalizedINR,
    normalizedUSD,
    source,
    rawValue: parsed.rawValue,
    priceType,
    confidence: parsed.confidence ?? 0.85,
  }
}
