# konaqualify.com

The age-graded Kona qualifying calculator, built on real IRONMAN results. Static site, no framework, no build dependencies beyond Node.

## Layout

```
src/index.template.html   the page (HTML + CSS + JS in one file); data is injected at build time
data/standards.json       IRONMAN Kona Standard multipliers
data/races/<slug>.json    one file per race: every edition since 2015, sorted finish times per division
data/slots.json           total AG slots per race-year (verified where sourced; default 40 otherwise)
data/raw/                 the combined results pull from Competitor Labs (git-ignored)
scripts/browser_pull.js   paste into the browser console on labs-v2.competitor.com → downloads konaqualify-results.json
scripts/import_results.mjs  data/raw + data/slots.json → data/races/
scripts/build.mjs         data → index.html (the 2026-rules simulation runs in the browser)
index.html                the built site (committed, so GitHub Pages serves it directly)
CNAME                     konaqualify.com
```

## Build

```
node scripts/build.mjs
open index.html
```

## Refreshing or adding data

1. Open any race on https://labs-v2.competitor.com/results/event/... in Chrome (the API refuses non-browser clients).
2. Add the race's event-group uuid to `RACES` in `scripts/browser_pull.js` if it's new (ironman.com → race → Results link).
3. Paste the whole script into the console. It pulls every edition since 2015 and downloads `konaqualify-results.json` (~600 KB).
4. Move it to `data/raw/`, then `node scripts/import_results.mjs && node scripts/build.mjs`, commit, push.
5. Slot counts: add verified numbers to `data/slots.json`; anything missing shows on the site as "assumed".

## Deploy (GitHub Pages)

1. Create a repo (e.g. `konaqualify`), push this folder to `main`.
2. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Custom domain: `konaqualify.com` (the `CNAME` file is already here). Tick *Enforce HTTPS* once the certificate issues.
4. At your registrar, add DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<your-github-username>.github.io`
   
   Same setup as chrisbeerman.com.

## Data notes

- Kona Standard table is reproduced from IRONMAN's published standards via a secondary source; `standards.json` carries `verified: false` until it's checked against the official document.
- Results: every finisher (DNS/DNF/DQ excluded) for Wisconsin, Lake Placid, Chattanooga, Texas, Florida, 2015–2026, from IRONMAN's results feed. Divisions without a Kona Standard (PC/ID, unknown) are excluded from the pool.
- Flagged editions (Wisconsin 2021 field-size anomaly, Florida 2018 altered course) are shown with ⚠ and left out of multi-year counts.
- The site simulates the 2026 system with no roll-down: winners take one slot each, the rest go to the best age-graded times. Real roll-down makes cutoffs slightly softer.
- IRONMAN results are public; the site is independent and not affiliated with IRONMAN.
