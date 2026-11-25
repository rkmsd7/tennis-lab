// Shared helpers: data loading, nav, formatting.
const TL = (() => {
  const cache = {};
  const load = async (...names) => Promise.all(names.map(n => cache[n] ||= fetch(`/data/${n}.json`).then(r => r.json())));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const slams = p => p.slams.ao + p.slams.rg + p.slams.w + p.slams.uso;
  const flag = p => p.flag || '🏳️';
  const eraLabel = { classic: 'Classic era (1968–1999)', golden: 'Golden era (2000–2019)', modern: 'Modern era (2020+)' };
  const nav = [['/', 'Home'], ['/rackets', 'Rackets'], ['/grip', 'Grip'], ['/accessories', 'Accessories'], ['/players', 'Players'], ['/generator', 'Match generator'], ['/tournaments', 'Tournaments'], ['/rankings', 'Rankings']];
  function header() {
    const here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
    const isActive = h => h === '/' ? here === '/' : here.startsWith(h) || (h === '/players' && here.startsWith('/player'));
    return `<header class="site-header"><div class="wrap"><a class="brand" href="/"><span class="ball"></span>TENNIS LAB</a><nav class="main">${nav.map(([h, l]) => `<a href="${h}" class="${isActive(h) ? 'active' : ''}">${l}</a>`).join('')}</nav></div></header>`;
  }
  function footer() {
    return `<footer><div class="wrap">Tennis Lab · an independent fan encyclopedia. Records, equipment and head-to-heads are curated from public sources (ATP, WTA, ITF, Wikipedia) and may lag the live tour; verify on <a href="https://www.atptour.com" target="_blank" rel="noopener">atptour.com</a> and <a href="https://www.wtatennis.com" target="_blank" rel="noopener">wtatennis.com</a>. Video links open YouTube searches: no videos are hosted here.</div></footer>`;
  }
  // --- Installable app (PWA) ---
  function pwaHead() {
    const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
    add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
    add('meta', { name: 'theme-color', content: '#0b1220' });
    add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    add('meta', { name: 'apple-mobile-web-app-title', content: 'Tennis Lab' });
    add('link', { rel: 'apple-touch-icon', href: '/assets/icon-180.png' });
    if ('serviceWorker' in navigator && location.protocol === 'https:' || location.hostname === 'localhost') navigator.serviceWorker?.register('/sw.js').catch(() => {});
  }
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; document.querySelectorAll('.install-btn').forEach(b => b.hidden = false); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; document.querySelectorAll('.install-btn').forEach(b => b.hidden = true); });
  function installUI() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) return;
    const nav = document.querySelector('nav.main'); if (!nav) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const b = document.createElement('button'); b.className = 'install-btn'; b.type = 'button'; b.textContent = '⬇ Install app'; b.hidden = !ios && !deferredInstall;
    b.onclick = async () => {
      if (deferredInstall) { deferredInstall.prompt(); const { outcome } = await deferredInstall.userChoice; if (outcome === 'accepted') b.hidden = true; deferredInstall = null; return; }
      alert(ios ? 'To install on iPhone or iPad: tap the Share button in Safari, then "Add to Home Screen".' : 'Use your browser menu and choose "Install app" or "Add to Home screen".');
    };
    nav.after(b);
  }
  pwaHead();
  document.addEventListener('DOMContentLoaded', () => {
    const h = document.getElementById('site-header'); if (h) h.outerHTML = header();
    installUI();
    const f = document.getElementById('site-footer'); if (f) f.outerHTML = footer();
  });
  const q = () => Object.fromEntries(new URLSearchParams(location.search));
  const pct = (n, d) => d ? Math.round(100 * n / d) : 0;
  const plink = (p, label) => p && p.id ? `<a class="plink" href="/player?id=${p.id}">${esc(label ?? p.name)}</a>` : esc(label ?? (p && p.name) ?? p ?? '');
  return { load, esc, yt, slams, flag, eraLabel, q, pct, plink };
})();
// YouTube embeds: lazy facade (thumbnail + play) and GIF-style muted loop.
TL.video = (v, opts = {}) => {
  const id = typeof v === 'string' ? v : v.id, title = typeof v === 'string' ? '' : v.title;
  const base = `https://www.youtube-nocookie.com/embed/${id}`;
  if (opts.loop) { const s = opts.start ?? 0, e = opts.end ?? s + 8; return `<div class="yt loop"><iframe src="${base}?autoplay=1&mute=1&loop=1&playlist=${id}&start=${s}&end=${e}&controls=0&modestbranding=1&rel=0&playsinline=1" title="${TL.esc(title)} (loop)" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe></div>`; }
  return `<div class="yt" data-id="${id}" data-title="${TL.esc(title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${TL.esc(title)}" loading="lazy"><button type="button" class="ytplay" aria-label="Play ${TL.esc(title)}">▶</button>${title ? `<div class="yttitle">${TL.esc(title)}</div>` : ''}</div>`;
};
document.addEventListener('click', e => {
  const b = e.target.closest('.ytplay'); if (!b) return; const box = b.closest('.yt'); const id = box.dataset.id;
  box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${box.dataset.title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
});
