// Pull IRONMAN results from Competitor Labs — run in the browser console on any
// https://labs-v2.competitor.com/results/event/... page (the site blocks non-browser clients).
// It downloads konaqualify-results.json; drop that in data/raw/ and run scripts/import_results.mjs.
//
// Event group ids come from ironman.com → race → Results (the link lands on /results/event/<uuid>).
const RACES = {
  wisconsin:     'e598aa20-f278-e111-b16a-005056956277',
  'lake-placid': 'c398aa20-f278-e111-b16a-005056956277',
  chattanooga:   '0a742931-cf10-e311-9ec7-005056956277',
  texas:         'd998aa20-f278-e111-b16a-005056956277',
  florida:       'b998aa20-f278-e111-b16a-005056956277',
  // arizona: '<uuid>',   // ironman.com/races/im-arizona/results sat behind a bot check when we looked
};
const MIN_YEAR = 2015;

async function pull(slug, groupId) {
  const html = await (await fetch('/results/event/' + groupId)).text();
  const pp = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]).props.pageProps;
  const subs = pp.subevents.filter((s) => !/70\.3/i.test(s.wtc_name))
    .map((s) => ({ id: s.wtc_eventid, name: s.wtc_name, date: s.wtc_eventdate.slice(0, 10), year: +s.wtc_eventdate.slice(0, 4) }))
    .filter((s) => s.year >= MIN_YEAR);
  const race = { slug, groupId, years: {} };
  for (const s of subs) {
    const j = await (await fetch('/api/results?wtc_eventid=' + s.id)).json();
    const rows = j.resultsJson.value || j.resultsJson;
    const div = {}; let dnf = 0, dq = 0, dns = 0, fin = 0;
    for (const r of rows) {
      const ag = r._wtc_agegroupid_value_formatted || 'UNK';
      if (r.wtc_dns) { dns++; continue; }
      if (r.wtc_dq) { dq++; continue; }
      if (r.wtc_dnf || !r.wtc_finisher || !r.wtc_finishtime) { dnf++; continue; }
      fin++; (div[ag] ||= []).push(r.wtc_finishtime); // seconds
    }
    for (const k in div) div[k].sort((a, b) => a - b);
    race.years[s.year] = { eventId: s.id, name: s.name, date: s.date, total: rows.length, fin, dnf, dq, dns, div };
    console.log(`${slug} ${s.year}: ${fin} finishers / ${rows.length}`);
  }
  return race;
}

(async () => {
  const races = {};
  for (const [slug, id] of Object.entries(RACES)) races[slug] = await pull(slug, id);
  const blob = new Blob([JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'labs-v2.competitor.com /api/results', races })], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'konaqualify-results.json' });
  document.body.appendChild(a); a.click();
})();
