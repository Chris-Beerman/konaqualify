#!/usr/bin/env node
// Build: inline data/*.json into src/index.template.html -> index.html (repo root, served by GitHub Pages).
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const standards = read('data/standards.json');
const ORDER = ['wisconsin', 'lake-placid', 'chattanooga', 'texas', 'florida', 'arizona'];
const races = readdirSync(join(root, 'data/races'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`data/races/${f}`))
  .sort((a, b) => (ORDER.indexOf(a.slug) + 1 || 99) - (ORDER.indexOf(b.slug) + 1 || 99));

const payload = JSON.stringify({ standards, races: races.map(r => ({ ...r })), builtAt: new Date().toISOString() })
  .replace(/</g, '\\u003c'); // never let data close the script tag

const tpl = readFileSync(join(root, 'src/index.template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/')) throw new Error('template is missing the /*__DATA__*/ marker');
writeFileSync(join(root, 'index.html'), tpl.replace('/*__DATA__*/', payload));
console.log(`built index.html — ${races.length} races: ${races.map((r) => r.slug).join(", ")}`);
