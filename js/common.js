// Shared helpers: data loading, nav, formatting.
const TL = (() => {
  const cache = {};
  const load = async (...names) => Promise.all(names.map(n => cache[n] ||= fetch(`/data/${n}.json`).then(r => r.json())));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const slams = p => p.slams.ao + p.slams.rg + p.slams.w + p.slams.uso;
  const flag = p => p.flag || '🏳️';
  const eraLabel = { classic: 'Classic era (1968–1999)', golden: 'Golden era (2000–2019)', modern: 'Modern era (2020+)' };
  const nav = [['/', 'Home'], ['/rackets', 'Rackets'], ['/grip', 'Grip'], ['/accessories', 'Accessories'], ['/players', 'Players'], ['/tournaments', 'Tournaments'], ['/rankings', 'Rankings']];
  function header() {
    const here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
    const isActive = h => h === '/' ? here === '/' : here.startsWith(h) || (h === '/players' && here.startsWith('/player'));
    return `<header class="site-header"><div class="wrap"><a class="brand" href="/"><span class="ball"></span>TENNIS LAB</a><nav class="main">${nav.map(([h, l]) => `<a href="${h}" class="${isActive(h) ? 'active' : ''}">${l}</a>`).join('')}</nav></div></header>`;
  }
  function footer() {
    return `<footer><div class="wrap">Tennis Lab · an independent fan encyclopedia. Records, equipment and head-to-heads are curated from public sources (ATP, WTA, ITF, Wikipedia) and may lag the live tour; verify on <a href="https://www.atptour.com" target="_blank" rel="noopener">atptour.com</a> and <a href="https://www.wtatennis.com" target="_blank" rel="noopener">wtatennis.com</a>. Video links open YouTube searches: no videos are hosted here.</div></footer>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const h = document.getElementById('site-header'); if (h) h.outerHTML = header();
    const f = document.getElementById('site-footer'); if (f) f.outerHTML = footer();
  });
  const q = () => Object.fromEntries(new URLSearchParams(location.search));
  const pct = (n, d) => d ? Math.round(100 * n / d) : 0;
  return { load, esc, yt, slams, flag, eraLabel, q, pct };
})();
