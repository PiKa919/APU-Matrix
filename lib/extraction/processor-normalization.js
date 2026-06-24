function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .trim();
}

function normalizeKirin(value) {
  return value.replace(/\bKIRIN\s*(\d+)/i, 'Kirin $1');
}

function normalizeApple(value) {
  return value.replace(/^Apple\s+/i, 'Apple ').replace(/\bPRO\b/g, 'Pro');
}

export function normalizeProcessorName(rawName) {
  let value = clean(rawName);

  if (!value) {
    return 'Unknown';
  }

  value = value
    .replace(/^Qualcomm\s+/i, '')
    .replace(/^MediaTek\s+/i, '')
    .replace(/^三星\s+/i, '')
    .replace(/^谷歌\s+/i, '')
    .replace(/^海思\s+/i, '')
    .replace(/^紫光展锐\s+/i, 'Unisoc ')
    .replace(/^联发科技\s+/i, 'Dimensity ')
    .replace(/^高通\s*骁龙8\s*至尊版\s*Gen5/i, 'Snapdragon 8 Elite Gen 5')
    .replace(/^高通\s*骁龙8\s*至尊版/i, 'Snapdragon 8 Elite')
    .replace(/^高通\s*骁龙/i, 'Snapdragon ')
    .replace(/^骁龙/i, 'Snapdragon ')
    .replace(/^Dimensity\s*天玑/i, 'Dimensity ')
    .replace(/^天玑/i, 'Dimensity ')
    .replace(/^麒麟/i, 'Kirin ');

  value = value
    .replace(/^S-(\d+)/i, 'Snapdragon $1')
    .replace(/^EXYNOS\b/i, 'Exynos')
    .replace(/^KIRIN\s*(\d+)/i, 'Kirin $1')
    .replace(/\bGen5\b/i, 'Gen 5');

  value = normalizeKirin(value);
  value = normalizeApple(value);
  value = clean(value);

  if (/^Snapdragon\s+8\s+Elite\s+Gen\s+5$/i.test(value)) {
    return 'Snapdragon 8 Elite Gen 5';
  }

  return value || 'Unknown';
}

function getBrand(processorName) {
  if (/^Snapdragon/i.test(processorName)) return 'Snapdragon';
  if (/^(Dimensity|Helio)/i.test(processorName)) return 'MediaTek';
  if (/^Exynos/i.test(processorName)) return 'Exynos';
  if (/^Tensor/i.test(processorName)) return 'Tensor';
  if (/^Kirin/i.test(processorName)) return 'Kirin';
  if (/^Apple/i.test(processorName)) return 'Apple';
  if (/^Unisoc/i.test(processorName)) return 'Unisoc';
  return 'Other';
}

function getSeries(processorName) {
  if (/^Snapdragon\s+8\b/i.test(processorName) || /^Dimensity\s+9\d{3}/i.test(processorName) || /^Apple\s+[AM]\d+/i.test(processorName) || /^Tensor\b/i.test(processorName) || /^Exynos\s+2\d{3}/i.test(processorName)) {
    return 'flagship';
  }

  if (/^Snapdragon\s+7\b/i.test(processorName) || /^Dimensity\s+8\d{3}/i.test(processorName) || /^Exynos\s+1\d{3}/i.test(processorName) || /^Kirin\s+9/i.test(processorName)) {
    return 'premium';
  }

  if (/^Snapdragon\s+6\b/i.test(processorName) || /^Dimensity\s+7\d{3}/i.test(processorName) || /^Kirin\s+8/i.test(processorName) || /^Unisoc\s+T8/i.test(processorName) || /^Helio/i.test(processorName)) {
    return 'mid';
  }

  if (/^Snapdragon\s+4\b/i.test(processorName) || /^Dimensity\s+6\d{3}/i.test(processorName) || /^Unisoc/i.test(processorName)) {
    return 'entry';
  }

  return 'other';
}

function getGeneration(processorName) {
  const snapdragon = processorName.match(/^Snapdragon\s+(.+)$/i);
  if (snapdragon) {
    return snapdragon[1].replace(/\s+UC$/i, '').trim();
  }

  const dimensity = processorName.match(/^Dimensity\s+(\d{4})/i);
  if (dimensity) {
    return `Dimensity ${dimensity[1]}`;
  }

  const helio = processorName.match(/^Helio\s+(.+)$/i);
  if (helio) {
    return `Helio ${helio[1].replace(/\s+UC$/i, '').trim()}`;
  }

  const generic = processorName.match(/^(Exynos|Tensor|Kirin|Apple|Unisoc)\s+(.+)$/i);
  if (generic) {
    return `${generic[1][0].toUpperCase()}${generic[1].slice(1).toLowerCase()} ${generic[2].replace(/\s+UC$/i, '').trim()}`;
  }

  return 'Other';
}

export function getProcessorMetadata(rawName) {
  const processorName = normalizeProcessorName(rawName);

  return {
    processorName,
    processorBrand: getBrand(processorName),
    processorSeries: getSeries(processorName),
    processorGeneration: getGeneration(processorName),
  };
}
