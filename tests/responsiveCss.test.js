import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('app/globals.css', 'utf8');

describe('responsive page grid', () => {
  it('uses a shrinkable explicit grid track instead of an auto min-content track', () => {
    expect(css).toMatch(/\.page-content\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  });
});
