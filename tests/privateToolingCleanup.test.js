import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

describe('public runtime cleanup boundary', () => {
  it('does not retain private Mongo scraper tooling or its scheduled endpoint', () => {
    const removedPaths = [
      'scripts/backfill-gsmarena.mjs',
      'scripts/dump-devices.mjs',
      'scripts/match-gsmarena.js',
      'scripts/report-data-completeness.mjs',
      'models/Device.js',
      'lib/device-enrichment.js',
      'lib/gsmarena.js',
      'lib/mongodb.js',
      'vercel.json',
    ];

    for (const relativePath of removedPaths) {
      expect(fs.existsSync(path.join(root, relativePath)), relativePath).toBe(false);
    }
  });

  it('does not carry the removed mongoose runtime dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

    expect(packageJson.dependencies?.mongoose).toBeUndefined();
    expect(packageJson.devDependencies?.mongoose).toBeUndefined();
  });
});
