#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { buildPhonePricePerformanceDataset } from '../lib/extraction/build-chart-dataset.js'

const root = process.cwd()
const detailedPath = path.join(root, 'public/data/snapdragon_detailed.json')
const overridesPath = path.join(root, 'public/data/price-overrides.json')
const outputPath = path.join(root, 'public/data/phone-price-performance.json')
const reportPath = path.join(root, 'public/data/phone-price-performance-report.json')

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const detailedData = readJson(detailedPath, [])
const overrides = readJson(overridesPath, [])
const { rows, report } = buildPhonePricePerformanceDataset({ detailedData, overrides })

fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`)
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

console.log(`Wrote ${rows.length} rows to ${outputPath}`)
console.log(`Wrote report to ${reportPath}`)
console.log(`Plotted rows: ${report.plottedRows}`)
console.log(`Missing price rows: ${report.missingPriceRows}`)
