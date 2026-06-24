import { normalizeProcessorName } from './processor-normalization.js'

const STOP_WORDS = new Set(['5g', '4g', 'global', 'china', 'india', 'edition', 'version', 'wifi', 'cellular'])
const MODEL_VARIANT_TOKENS = new Set(['plus', 'pro', 'ultra', 'max', 'mini', 'lite', 'fe', 'se'])

function stripNoise(value) {
  return String(value || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\s*(?:\/|\+)\s*\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
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

function numericModelParts(tokenList) {
  return tokenList.flatMap((token) => token.match(/\d+/g) || [])
}

function hasCompatibleVariants(targetTokens, candidateTokens) {
  return variantSignature(targetTokens) === variantSignature(candidateTokens)
}

function hasCompatibleModelNumbers(targetTokens, candidateTokens) {
  const targetParts = numericModelParts(targetTokens)
  const candidateParts = numericModelParts(candidateTokens)

  if (targetParts.length === 0 || candidateParts.length === 0) {
    return true
  }

  const candidateSet = new Set(candidateParts)
  return targetParts.some((part) => candidateSet.has(part))
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

  if (!hasCompatibleVariants(targetTokens, candidateTokens) || !hasCompatibleModelNumbers(targetTokens, candidateTokens)) {
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
