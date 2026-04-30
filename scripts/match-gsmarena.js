#!/usr/bin/env node
/**
 * Import GSMArena targeted scrape data into AnTuTu MongoDB.
 *
 * Usage:
 *   node --env-file=.env scripts/match-gsmarena.js [path-to-phones_data.json]
 */

import { spawn } from 'child_process';
import path from 'path';

const backfillScript = path.resolve(import.meta.dirname, './backfill-gsmarena.mjs');
const jsonPath = process.argv[2];
const args = ['--env-file=.env', backfillScript, '--all'];

if (jsonPath) {
    args.push(`--json=${jsonPath}`);
}

const child = spawn(process.execPath, args, { stdio: 'inherit' });

child.on('exit', (code) => {
    process.exit(code ?? 0);
});
