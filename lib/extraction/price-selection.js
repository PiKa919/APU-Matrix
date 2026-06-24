function isValidPriceCandidate(price) {
  return getComparableAmount(price) !== null
}

function getComparableAmount(price) {
  if (!price) {
    return null
  }

  if (typeof price.normalizedINR === 'number' && Number.isFinite(price.normalizedINR) && price.normalizedINR > 0) {
    return price.normalizedINR
  }

  if (typeof price.normalizedUSD === 'number' && Number.isFinite(price.normalizedUSD) && price.normalizedUSD > 0) {
    return price.normalizedUSD
  }

  return null
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

      return getComparableAmount(left) - getComparableAmount(right)
    })[0] || null
}

export function selectPlottedPrice(launchPrices = [], currentPrices = []) {
  return bestCandidate(launchPrices) || bestCandidate(currentPrices) || null
}
