function isValidPriceCandidate(price) {
  return getComparableAmount(price) !== null
}

function hasPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function getComparableAmount(price) {
  if (!price) {
    return null
  }

  if (hasPositiveNumber(price.normalizedINR)) {
    return price.normalizedINR
  }

  if (hasPositiveNumber(price.normalizedUSD)) {
    return price.normalizedUSD
  }

  return null
}

function comparableUnitRank(price) {
  if (hasPositiveNumber(price?.normalizedINR)) {
    return 0
  }

  if (hasPositiveNumber(price?.normalizedUSD)) {
    return 1
  }

  return 2
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

      const unitDelta = comparableUnitRank(left) - comparableUnitRank(right)
      if (unitDelta !== 0) {
        return unitDelta
      }

      return getComparableAmount(left) - getComparableAmount(right)
    })[0] || null
}

export function selectPlottedPrice(launchPrices = [], currentPrices = []) {
  return bestCandidate(currentPrices) || bestCandidate(launchPrices) || null
}
