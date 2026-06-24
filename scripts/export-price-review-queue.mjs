#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const root = process.cwd()
const datasetPath = path.join(root, 'public/data/phone-price-performance.json')
const jsonPath = path.join(root, 'public/data/price-review-queue.json')
const csvPath = path.join(root, 'public/data/price-review-queue.csv')

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const rows = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
const queue = rows
  .filter((row) => !row.plottedPrice || row.plottedPrice.priceType === 'launch')
  .map((row) => ({
    status: row.plottedPrice ? 'launch_fallback_needs_current_price' : 'missing_price',
    id: row.id,
    phoneName: row.phoneName,
    phoneBrand: row.phoneBrand,
    processorName: row.processorName,
    processorBrand: row.processorBrand,
    processorSeries: row.processorSeries,
    antutuScore: row.antutuScore,
    category: row.category,
    plottedPrice: row.plottedPrice?.rawValue ?? null,
    plottedPriceType: row.plottedPrice?.priceType ?? null,
    source: row.plottedPrice?.source ?? null,
  }))
  .sort((left, right) => right.antutuScore - left.antutuScore)

const byProcessor = Object.values(queue.reduce((acc, row) => {
  const key = row.processorName
  acc[key] ||= {
    processorName: row.processorName,
    processorBrand: row.processorBrand,
    total: 0,
    missingPrice: 0,
    launchFallback: 0,
    maxScore: 0,
    phones: [],
  }

  acc[key].total += 1
  acc[key].maxScore = Math.max(acc[key].maxScore, row.antutuScore)

  if (row.status === 'missing_price') {
    acc[key].missingPrice += 1
  } else {
    acc[key].launchFallback += 1
  }

  if (acc[key].phones.length < 12) {
    acc[key].phones.push(row.phoneName)
  }

  return acc
}, {})).sort((left, right) => right.maxScore - left.maxScore)

const payload = {
  generatedAt: new Date().toISOString(),
  counts: {
    total: queue.length,
    missingPrice: queue.filter((row) => row.status === 'missing_price').length,
    launchFallback: queue.filter((row) => row.status === 'launch_fallback_needs_current_price').length,
  },
  byProcessor,
  rows: queue,
}

const csvHeader = [
  'status',
  'phoneName',
  'phoneBrand',
  'processorName',
  'processorBrand',
  'processorSeries',
  'antutuScore',
  'category',
  'plottedPrice',
  'plottedPriceType',
  'source',
  'id',
]

const csvLines = [
  csvHeader.join(','),
  ...queue.map((row) => csvHeader.map((key) => csvValue(row[key])).join(',')),
]

fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`)
fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`)

console.log(`Wrote ${queue.length} review rows to ${jsonPath}`)
console.log(`Wrote ${queue.length} review rows to ${csvPath}`)
