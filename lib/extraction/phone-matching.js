import { normalizeProcessorName } from './processor-normalization.js'

const STOP_WORDS = new Set(['5g', '4g', 'global', 'china', 'india', 'edition', 'version', 'wifi', 'cellular'])
const MODEL_VARIANT_TOKENS = new Set(['plus', 'pro', 'ultra', 'max', 'mini', 'lite', 'fe', 'se', 'xl'])
const BRAND_TOKENS = new Set([
  'apple',
  'asus',
  'google',
  'honor',
  'huawei',
  'infinix',
  'iqoo',
  'lenovo',
  'meizu',
  'motorola',
  'nothing',
  'nokia',
  'oneplus',
  'oppo',
  'poco',
  'realme',
  'redmi',
  'samsung',
  'sony',
  'tecno',
  'vivo',
  'xiaomi',
  'zte',
])

function stripNoise(value) {
  const normalized = String(value || '')
    .replace(/\bfan\s+edition\b/gi, ' fe ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\s*(?:\/|\+)\s*\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^one plus(?=\s|$)/, 'oneplus')

  return compactModelAliases(normalized)
}

function compactModelAliases(value) {
  const sourceTokens = value.split(' ').filter(Boolean)
  const compacted = []

  for (let index = 0; index < sourceTokens.length; index += 1) {
    const current = sourceTokens[index]
    const next = sourceTokens[index + 1]
    const afterNext = sourceTokens[index + 2]

    if (/^[a-z]$/.test(current) && /^[a-z]{2,8}$/.test(next) && /^\d+(?!g$)[a-z]?$/.test(afterNext)) {
      compacted.push(`${current}${next}${afterNext}`)
      index += 2
      continue
    }

    if (/^[a-z]{1,8}$/.test(current) && !BRAND_TOKENS.has(current) && /^\d+(?!g$)[a-z]?$/.test(next)) {
      compacted.push(`${current}${next}`)
      index += 1
      continue
    }

    if (/^\d+$/.test(current) && /^[a-z]$/.test(next)) {
      compacted.push(`${current}${next}`)
      index += 1
      continue
    }

    compacted.push(current)
  }

  return compacted.join(' ')
}

function tokens(value) {
  return normalizePhoneName(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
}

function normalizeBrandName(value) {
  return normalizePhoneName(value).replace(/^one plus$/, 'oneplus')
}

function normalizeKnownBrandPrefix(value) {
  return value.replace(/^one plus(?:\s|$)/, (match) => match.endsWith(' ') ? 'oneplus ' : 'oneplus')
}

function brandPrefixCandidates(normalizedBrand) {
  if (normalizedBrand === 'oneplus') {
    return ['oneplus', 'one plus']
  }

  return [normalizedBrand]
}

function stripBrandPrefix(normalizedName, normalizedBrand) {
  for (const prefix of brandPrefixCandidates(normalizedBrand)) {
    if (normalizedName === prefix) {
      return ''
    }

    if (normalizedName.startsWith(`${prefix} `)) {
      return normalizedName.slice(prefix.length + 1)
    }
  }

  return normalizedName
}

function variantSignature(tokenList) {
  return tokenList
    .filter((token) => MODEL_VARIANT_TOKENS.has(token))
    .sort()
    .join('|')
}

function modelIdentifiers(tokenList) {
  return tokenList.filter((token) => /\d/.test(token))
}

function seriesTokens(tokenList) {
  return tokenList.filter((token) => !/\d/.test(token) && !MODEL_VARIANT_TOKENS.has(token) && !STOP_WORDS.has(token))
}

function hasCompatibleVariants(targetTokens, candidateTokens) {
  return variantSignature(targetTokens) === variantSignature(candidateTokens)
}

function hasCompatibleModelNumbers(targetTokens, candidateTokens) {
  const targetParts = modelIdentifiers(targetTokens)
  const candidateParts = modelIdentifiers(candidateTokens)

  if (targetParts.length === 0 || candidateParts.length === 0) {
    return true
  }

  const candidateSet = new Set(candidateParts)
  return targetParts.some((part) => candidateSet.has(part))
}

function isSubset(left, right) {
  const rightSet = new Set(right)
  return left.every((token) => rightSet.has(token))
}

function hasCompatibleSeriesContext(targetTokens, candidateTokens) {
  if (modelIdentifiers(targetTokens).length === 0 || modelIdentifiers(candidateTokens).length === 0) {
    return true
  }

  const targetSeries = seriesTokens(targetTokens)
  const candidateSeries = seriesTokens(candidateTokens)

  if (targetSeries.length === 0 || candidateSeries.length === 0) {
    return true
  }

  return isSubset(targetSeries, candidateSeries) || isSubset(candidateSeries, targetSeries)
}

function overlapRatio(left, right) {
  if (left.length === 0 || right.length === 0) {
    return 0
  }

  const rightSet = new Set(right)
  const overlap = left.filter((token) => rightSet.has(token)).length
  return overlap / left.length
}

function sameNormalizedBrand(left, right) {
  return normalizePhoneName(left) === normalizePhoneName(right)
}

function sameProcessor(left, right) {
  const normalizedLeft = normalizeProcessorName(left)
  const normalizedRight = normalizeProcessorName(right)
  return normalizedLeft !== 'Unknown' && normalizedLeft === normalizedRight
}

function composePhoneLabel(brand, name) {
  const normalizedBrand = normalizeBrandName(brand)
  const normalizedName = normalizeKnownBrandPrefix(normalizePhoneName(name))

  if (!normalizedBrand) {
    return normalizedName
  }

  const nameWithoutBrand = stripBrandPrefix(normalizedName, normalizedBrand)

  if (!nameWithoutBrand) {
    return normalizedBrand
  }

  if (normalizedName === normalizedBrand || normalizedName.startsWith(`${normalizedBrand} `)) {
    return normalizedName
  }

  return `${normalizedBrand} ${nameWithoutBrand}`.trim()
}

export function normalizePhoneName(value) {
  return stripNoise(value)
}

export function scorePhoneMatch(target, candidate) {
  const targetName = composePhoneLabel(target?.phoneBrand, target?.phoneName)
  const candidateName = composePhoneLabel(candidate?.brand, candidate?.name)

  if (!targetName || !candidateName) {
    return 0
  }

  const targetTokens = tokens(targetName)
  const candidateTokens = tokens(candidateName)

  if (
    !hasCompatibleVariants(targetTokens, candidateTokens)
    || !hasCompatibleModelNumbers(targetTokens, candidateTokens)
    || !hasCompatibleSeriesContext(targetTokens, candidateTokens)
  ) {
    return 0
  }

  const nameOverlap = (overlapRatio(targetTokens, candidateTokens) + overlapRatio(candidateTokens, targetTokens)) / 2

  let score = nameOverlap * 0.72

  if (targetName === candidateName) {
    score += 0.22
  } else if (targetName.includes(candidateName) || candidateName.includes(targetName)) {
    score += 0.08
  }

  if (target?.phoneBrand && candidate?.brand && sameNormalizedBrand(target.phoneBrand, candidate.brand)) {
    score += 0.05
  }

  if (target?.processorName && candidate?.processorName && sameProcessor(target.processorName, candidate.processorName)) {
    score += 0.05
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(4))))
}

export function bestPhoneMatch(target, candidates, threshold = 0.55) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null
  }

  const scored = candidates
    .map((candidate) => ({ candidate, confidence: scorePhoneMatch(target, candidate) }))
    .sort((left, right) => right.confidence - left.confidence)

  const best = scored[0]
  return best && best.confidence >= threshold ? best : null
}
