function isValidPriceCandidate(price) {
  return Boolean(price)
    && typeof price.normalizedINR === 'number'
    && Number.isFinite(price.normalizedINR)
    && price.normalizedINR > 0
}

function bestCandidate(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return null
  }

  return prices
    .filter(isValidPriceCandidate)
    .sort((left, right) => {
      const confidenceDelta = (right.confidence ?? 0) - (left.confidence ?? 0)
      if (confidenceDelta !== 0) {
        return confidenceDelta
      }

      return left.normalizedINR - right.normalizedINR
    })[0] || null
}

export function selectPlottedPrice(launchPrices = [], currentPrices = []) {
  return bestCandidate(launchPrices) || bestCandidate(currentPrices) || null
}
