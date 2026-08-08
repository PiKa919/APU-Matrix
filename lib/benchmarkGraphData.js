const METRICS = {
  cpu: {
    value: 'cpuGeekbench6MultiCore',
    label: 'Geekbench 6 multi-core',
    source: 'cpuSourceUrl',
    details: ['cpuGeekbench6SingleCore', 'processorName'],
  },
  ai: {
    value: 'aiGeekbenchQuantizedScore',
    label: 'Geekbench AI quantized score',
    source: 'aiSourceUrl',
    details: ['aiBackend', 'aiAccelerator', 'aiPrecision'],
  },
  antutu: {
    value: 'antutuScore',
    label: 'AnTuTu score',
    source: 'sourceUrls',
    details: ['processorName'],
  },
  gpu: {
    value: 'gpuWildLifeExtremeScore',
    label: '3DMark Wild Life Extreme score',
    source: 'gpuSourceUrl',
    details: ['gpuWildLifeExtremeFps', 'processorName'],
  },
};

const BENCHMARK_FIELDS = [
  'cpuGeekbench6SingleCore',
  'cpuGeekbench6MultiCore',
  'aiGeekbenchQuantizedScore',
  'gpuWildLifeExtremeScore',
  'gpuWildLifeExtremeFps',
  'antutuScore',
];

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const next = csvText[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ''])));
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}

function normalizeRow(row) {
  return {
    id: row.id || row.canonical_model || row.phone_name,
    phoneName: row.phone_name,
    phoneBrand: row.phone_brand,
    deviceFamily: row.device_family,
    releaseYear: numberOrNull(row.release_year),
    observedAt: row.cpu_observed_at || row.ai_observed_at || row.gpu_observed_at || row.benchmark_last_checked_at || '',
    canonicalModel: row.canonical_model || row.id || row.phone_name,
    priceInr: numberOrNull(row.y_price_inr),
    priceType: row.y_price_type,
    processorName: row.processor_name,
    antutuScore: numberOrNull(row.x_metric_antutu_score),
    cpuGeekbench6SingleCore: numberOrNull(row.cpu_geekbench6_single_core),
    cpuGeekbench6MultiCore: numberOrNull(row.cpu_geekbench6_multi_core),
    cpuSourceUrl: row.cpu_source_url,
    gpuWildLifeExtremeScore: numberOrNull(row.gpu_3dmark_wild_life_extreme_score),
    gpuWildLifeExtremeFps: numberOrNull(row.gpu_3dmark_wild_life_extreme_fps),
    gpuSourceUrl: row.gpu_source_url,
    aiGeekbenchQuantizedScore: numberOrNull(row.ai_geekbench_quantized_score),
    aiBackend: row.ai_backend,
    aiAccelerator: row.ai_accelerator,
    aiPrecision: row.ai_precision,
    aiSourceUrl: row.ai_source_url,
    sourceUrls: row.source_urls,
  };
}

function deduplicateByCanonicalModel(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const existing = grouped.get(row.canonicalModel);
    if (!existing || benchmarkCompleteness(row) > benchmarkCompleteness(existing) ||
      (benchmarkCompleteness(row) === benchmarkCompleteness(existing) && row.observedAt > existing.observedAt)) {
      grouped.set(row.canonicalModel, row);
    }
  }
  return [...grouped.values()];
}

function benchmarkCompleteness(row) {
  return BENCHMARK_FIELDS.reduce((total, field) => total + (row[field] !== null ? 1 : 0), 0) +
    [row.cpuSourceUrl, row.aiSourceUrl, row.gpuSourceUrl].filter(Boolean).length;
}

function pointFor(row, metric) {
  const details = Object.fromEntries(metric.details.map((field) => [field, row[field]]).filter(([, value]) => value !== null && value !== ''));
  return {
    id: row.id,
    phoneName: row.phoneName,
    phoneBrand: row.phoneBrand,
    deviceFamily: row.deviceFamily,
    releaseYear: row.releaseYear,
    x: row[metric.value],
    priceInr: row.priceInr,
    priceType: row.priceType,
    details,
    sourceUrl: row[metric.source] || '',
  };
}

function modelGeneration(point) {
  const matches = point.phoneName.match(/\d+/g);
  return matches ? Number(matches.at(-1)) : Number.POSITIVE_INFINITY;
}

function seriesKey(point) {
  const modelName = point.phoneName?.replace(new RegExp(`^${point.phoneBrand}\\s+`, 'i'), '').trim();
  const match = modelName?.match(/^(.*?\d+)/);
  return match?.[1]?.trim() || null;
}

function metricData(rows, metric) {
  const points = rows
    .filter((row) => row[metric.value] !== null && row.priceInr !== null)
    .map((row) => pointFor(row, metric))
    .sort((a, b) => (a.releaseYear ?? Infinity) - (b.releaseYear ?? Infinity) || modelGeneration(a) - modelGeneration(b));
  const grouped = new Map();
  for (const point of points) {
    const key = seriesKey(point);
    if (!point.phoneBrand || !key) continue;
    const id = `${point.phoneBrand}:${key}`;
    if (!grouped.has(id)) grouped.set(id, { id, points: [] });
    grouped.get(id).points.push(point);
  }
  return {
    label: metric.label,
    points,
    series: [...grouped.values()].filter((series) => series.points.length > 1),
    xLabel: metric.label,
    xValueLabel: metric.label,
  };
}

export function buildBenchmarkGraphData(csvText) {
  const rows = deduplicateByCanonicalModel(parseCsv(csvText).map(normalizeRow));
  return {
    brands: [...new Set(rows.map((row) => row.phoneBrand).filter(Boolean))].sort(),
    metrics: Object.fromEntries(Object.entries(METRICS).map(([id, metric]) => [id, metricData(rows, metric)])),
  };
}
