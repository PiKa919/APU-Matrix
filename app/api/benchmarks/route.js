import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { buildBenchmarkGraphData } from '../../../lib/benchmarkGraphData.js';

export async function GET() {
  const csvText = await readFile(join(process.cwd(), 'public/data/phone-metrics-pricing.csv'), 'utf8');
  return NextResponse.json({ success: true, data: buildBenchmarkGraphData(csvText) });
}
