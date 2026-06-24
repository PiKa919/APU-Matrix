import { describe, expect, it } from 'vitest'
import { parseCurrencyValue, normalizePrice, DEFAULT_EXCHANGE_RATES } from '../../lib/extraction/currency.js'

describe('currency extraction', () => {
  it('parses INR, USD, CNY, and EUR price strings', () => {
    expect(parseCurrencyValue('₹69,999')).toEqual({ amount: 69999, currency: 'INR', rawValue: '₹69,999' })
    expect(parseCurrencyValue('$840')).toEqual({ amount: 840, currency: 'USD', rawValue: '$840' })
    expect(parseCurrencyValue('CNY 4,999')).toEqual({ amount: 4999, currency: 'CNY', rawValue: 'CNY 4,999' })
    expect(parseCurrencyValue('€799')).toEqual({ amount: 799, currency: 'EUR', rawValue: '€799' })
  })

  it('normalizes supported currencies to INR and USD', () => {
    const price = normalizePrice('$840', 'unit', 'launch', DEFAULT_EXCHANGE_RATES)

    expect(price).toMatchObject({
      amount: 840,
      currency: 'USD',
      normalizedINR: 73080,
      normalizedUSD: 840,
      source: 'unit',
      rawValue: '$840',
      priceType: 'launch',
    })
    expect(price.confidence).toBeGreaterThan(0.7)
  })

  it('accepts object values that already contain amount and currency', () => {
    const price = normalizePrice({ amount: 4999, currency: 'CNY', rawValue: 'CNY 4,999', confidence: 0.92 }, 'fixture', 'current')

    expect(price).toMatchObject({
      amount: 4999,
      currency: 'CNY',
      normalizedINR: 57489,
      source: 'fixture',
      priceType: 'current',
      confidence: 0.92,
    })
    expect(price.normalizedUSD).toBeCloseTo(660.79, 2)
  })

  it('returns null for unsupported or missing prices', () => {
    expect(normalizePrice('', 'unit', 'launch')).toBeNull()
    expect(normalizePrice('About 700 EUR', 'unit', 'launch')).toBeNull()
    expect(normalizePrice(null, 'unit', 'launch')).toBeNull()
  })
})
