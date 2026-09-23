#!/usr/bin/env node
// data/raw/konaqualify-results.json (from scripts/browser_pull.js) + data/slots.json -> data/races/<slug>.json
// Usage: node scripts/import_results.mjs [data/raw/konaqualify-results.json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawPath = process.argv[2] || join(root, 'data/raw/konaqualify-results.json');
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
const slots = JSON.parse(readFileSync(join(root, 'data/slots.json'), 'utf8'));

const META = {
  wisconsin:   { race: 'IRONMAN Wisconsin',   location: 'Madison, WI' },
  'lake-placid': { race: 'IRONMAN Lake Placid', location: 'Lake Placid, NY' },
  chattanooga: { race: 'IRONMAN Chattanooga', location: 'Chattanooga, TN' },
  texas:       { race: 'IRONMAN Texas',       location: 'The Woodlands, TX' },
  florida:     { race: 'IRONMAN Florida',     location: 'Panama City Beach, FL' },
  arizona:     { race: 'IRONMAN Arizona',     location: 'Tempe, AZ' },
};
// Data-quality flags, by hand. Keep the year, hide it from defaults.
const FLAGS = {
  'wisconsin/2021': 'Field size is ~2.5× a normal Wisconsin year in the results feed; likely merged entries. Excluded from multi-year summaries.',
  'florida/2018': 'Swim cancelled and course altered; times are not comparable.',
};
const DIV_RE = /^[MF]\d{2}-\d{2}$/;

mkdirSync(join(root, 'data/races'), { recursive: true });
for (const [slug, r] of Object.entries(raw.races)) {
  const meta = META[slug] || { race: `IRONMAN ${slug}`, location: '' };
  const years = {};
  for (const [y, v] of Object.entries(r.years)) {
    const div = {};
    for (const [k, arr] of Object.entries(v.div)) if (DIV_RE.test(k)) div[k] = arr;
    const s = slots[slug]?.[y];
    years[y] = {
      date: v.date, name: v.name, eventId: v.eventId,
      starters: v.total - v.dns, finishers: v.fin, dnf: v.dnf, dq: v.dq,
      slots: s ? s.slots : slots.default, slotsVerified: !!s, slotsNote: s?.note || null,
      flag: FLAGS[`${slug}/${y}`] || null,
      div,
    };
  }
  const out = { slug, ...meta, groupId: r.groupId, source: 'IRONMAN results (labs-v2.competitor.com), fetched ' + raw.fetchedAt.slice(0, 10), years };
  writeFileSync(join(root, `data/races/${slug}.json`), JSON.stringify(out));
  console.log(`${slug}: ${Object.keys(years).length} years`);
}
