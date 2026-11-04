// Finds real YouTube videos for curated meetings, rivalry categories and player shots.
// Usage: node tools/find-videos.js   (resumable; writes data/videos.json incrementally)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const players = JSON.parse(fs.readFileSync(path.join(root, 'data/players.json')));
const rivalries = JSON.parse(fs.readFileSync(path.join(root, 'data/rivalries.json')));
const shots = JSON.parse(fs.readFileSync(path.join(root, 'data/shots.json')));
const out = path.join(root, 'data/videos.json');
const db = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out)) : { matches: {}, rivalries: {}, shots: {}, players: {} };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const last = n => norm(n).split(' ').slice(-1)[0];
async function search(q) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
      const html = await r.text();
      const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
      if (!m) throw new Error('no ytInitialData');
      const data = JSON.parse(m[1]);
      const vids = [];
      (function walk(o) { if (!o || typeof o !== 'object') return; if (o.videoRenderer) { const v = o.videoRenderer; vids.push({ id: v.videoId, title: (v.title?.runs || []).map(r => r.text).join(''), channel: v.ownerText?.runs?.[0]?.text || '', length: v.lengthText?.simpleText || '' }); } for (const k in o) walk(o[k]); })(data);
      return vids.filter(v => v.id && v.title);
    } catch (e) { await sleep(3000 * (attempt + 1)); }
  }
  return [];
}
const OFFICIAL = /wimbledon|roland|australian open|us open|tennis tv|atp|wta|olympic|davis cup|laver cup|tennis channel|eurosport/i;
function pick(vids, must, n = 3) {
  const ok = vids.filter(v => must.every(t => norm(v.title).includes(t)));
  ok.sort((a, b) => (OFFICIAL.test(b.channel) - OFFICIAL.test(a.channel)));
  return ok.slice(0, n).map(v => ({ id: v.id, title: v.title, channel: v.channel, length: v.length }));
}
const save = () => fs.writeFileSync(out, JSON.stringify(db, null, 1));
(async () => {
  let n = 0;
  const step = async (key, store, q, must, cnt) => { if (store[key]) return; const vids = await search(q); store[key] = pick(vids, must, cnt); n++; if (n % 10 === 0) save(); console.log(key, '→', store[key].length); await sleep(1200); };
  for (const r of rivalries) {
    const a = r.a, b = r.b, la = last(a), lb = last(b);
    for (const m of r.meetings) {
      if (/doubles|partners/i.test(m.round + m.winner + m.score)) continue;
      const key = [a, b, m.year, m.event, m.round].join('|');
      const rd = m.round === 'F' ? 'final' : m.round === 'SF' ? 'semifinal' : m.round === 'QF' ? 'quarterfinal' : m.round === 'RR' ? 'round robin' : '';
      await step(key, db.matches, `${a} vs ${b} ${m.event} ${m.year} ${rd}`, [la, lb, String(m.year)], 3);
    }
    await step(`${a}|${b}|highlights`, db.rivalries, `${a} vs ${b} best points rivalry`, [la, lb], 4);
    await step(`${a}|${b}|full`, db.rivalries, `${a} vs ${b} full match`, [la, lb], 4);
  }
  for (const p of players.filter(p => p.featured)) {
    const lp = last(p.name);
    await step(`${p.id}|best`, db.players, `${p.name} best points`, [lp], 3);
    await step(`${p.id}|slowmo`, db.players, `${p.name} slow motion`, [lp], 3);
    (p.shots || []).forEach(() => {});
    for (let i = 0; i < (p.shots || []).length; i++) {
      const s = p.shots[i], label = shots[s.type].label;
      await step(`${p.id}|${i}`, db.shots, `${p.name} ${label} slow motion`, [lp], 3);
    }
  }
  save(); console.log('DONE', Object.keys(db.matches).length, 'matches', Object.keys(db.shots).length, 'shots');
})();
