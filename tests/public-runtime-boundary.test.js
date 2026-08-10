import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(process.cwd());

const scraperRoutes = [
  'app/api/scrape/android-ai-llm/route.js',
  'app/api/scrape/android-ai/route.js',
  'app/api/scrape/android-pad/route.js',
  'app/api/scrape/android-smartphone/route.js',
  'app/api/scrape/android-soc/route.js',
  'app/api/scrape/ios/route.js',
];

const privateScraperLibraries = [
  'lib/runScrapeCategory.js',
  'lib/mongodb.js',
  'lib/scrapeAntutu.js',
];

const deadChartFiles = [
  'components/PerformanceChart.js',
  'components/PerformanceChart.jsx',
  'components/ProcessorChart.js',
  'components/ProcessorChart.jsx',
  'components/PhonePricePerformanceChart.jsx',
  'tests/PerformanceChart.test.jsx',
  'tests/ProcessorChart.test.jsx',
  'tests/PhonePricePerformanceChart.test.jsx',
];

const forbiddenRuntimeImports = [
  'chart.js',
  'react-chartjs-2',
  'chartjs-adapter-date-fns',
  'chartjs-plugin-datalabels',
  'date-fns',
  'runScrapeCategory',
  '@/lib/mongodb',
  '@/lib/scrapeAntutu',
];

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function sourceFiles(relativeDirectory) {
  const directory = path.join(repoRoot, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relativePath);
    return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

describe('public runtime boundary', () => {
  it('contains no private scraper routes or now-private scraper libraries', () => {
    expect([...scraperRoutes, ...privateScraperLibraries].filter(exists)).toEqual([]);
  });

  it('contains no dead Chart.js components or their legacy tests', () => {
    expect(deadChartFiles.filter(exists)).toEqual([]);
  });

  it('contains no scraper or Chart.js runtime imports in production source', () => {
    const productionSource = ['app', 'components', 'lib']
      .flatMap(sourceFiles)
      .map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
      .join('\n');

    expect(forbiddenRuntimeImports.filter((value) => productionSource.includes(value))).toEqual([]);
  });

  it('contains none of the removed chart packages', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    expect([
      'chart.js',
      'react-chartjs-2',
      'chartjs-adapter-date-fns',
      'chartjs-plugin-datalabels',
      'date-fns',
    ].filter((dependency) => dependency in dependencies)).toEqual([]);
  });

  it('uses Bun lockfiles only', () => {
    expect(['package-lock.json', 'pnpm-lock.yaml'].filter(exists)).toEqual([]);
    expect(exists('bun.lock')).toBe(true);
  });
});
