// Stick-figure shot animation engine. Poses use angles: 0 = straight down, positive = toward the net (figure faces right).
const ShotAnim = (() => {
  const L = { torso: 38, neck: 8, head: 9, ua: 22, fa: 20, rk: 30, th: 28, sh: 28 };
  const GROUND = 170;
  const rad = d => d * Math.PI / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const ease = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const lerp = (a, b, t) => a + (b - a) * t;
  function lerpPose(a, b, t) {
    const o = {};
    for (const k of ['torso', 'rk']) o[k] = lerp(a[k], b[k], t);
    for (const k of ['armR', 'armL', 'front', 'back']) { o[k] = {}; for (const j in a[k]) o[k][j] = lerp(a[k][j], b[k][j], t); }
    o.hands = t < .5 ? a.hands : b.hands;
    return o;
  }
  function lerpFp(a, b, t) {
    const L3 = (x, y) => [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
    return { l: L3(a.l, b.l), r: L3(a.r, b.r), sh: lerp(a.sh, b.sh, t) };
  }
  function ik(S, T, back) { // two-segment arm from shoulder S to target T; elbow bent away (back/up)
    const dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy), reach = L.ua + L.fa;
    const dd = Math.min(d, reach - .5);
    const h = Math.sqrt(Math.max(0, (L.ua * L.ua) - (dd / 2) * (dd / 2)));
    const m = [S[0] + dx / d * dd / 2, S[1] + dy / d * dd / 2];
    const px = -dy / d, py = dx / d; // perpendicular
    const sgn = (px * -1 + py * -1) > 0 ? 1 : -1; // prefer up/back
    return [m[0] + px * h * sgn * (back ? 1 : 1), m[1] + py * h * sgn];
  }
  function solve(pose) {
    const H = [100, 112];
    const up = dir(pose.torso); const N = [H[0] + up[0] * L.torso, H[1] - up[1] * L.torso];
    const head = [N[0] + up[0] * (L.neck + L.head), N[1] - up[1] * (L.neck + L.head)];
    const S = N;
    const ER = add(S, dir(pose.armR.u), L.ua), WR = add(ER, dir(pose.armR.f), L.fa);
    const rdir = dir(pose.rk); const tip = add(WR, rdir, L.rk);
    let EL, WL;
    if (pose.hands === 'two') { WL = WR; EL = ik(S, WL); }
    else if (pose.hands === 'throat') { WL = add(WR, rdir, 10); EL = ik(S, WL); }
    else { EL = add(S, dir(pose.armL.u), L.ua); WL = add(EL, dir(pose.armL.f), L.fa); }
    const KF = add([H[0] + 2, H[1]], dir(pose.front.t), L.th), FF = add(KF, dir(pose.front.s), L.sh);
    const KB = add([H[0] - 2, H[1]], dir(pose.back.t), L.th), FB = add(KB, dir(pose.back.s), L.sh);
    const dy = GROUND - Math.max(FF[1], FB[1]);
    const sh = p => [p[0], p[1] + dy];
    return { H: sh(H), N: sh(N), head: sh(head), ER: sh(ER), WR: sh(WR), tip: sh(tip), EL: sh(EL), WL: sh(WL), KF: sh(KF), FF: sh(FF), KB: sh(KB), FB: sh(FB), rk: pose.rk };
  }
  const line = (a, b, cls) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}"/>`;
  function figure(p, ball, flip) {
    const rc = [p.WR[0] + (p.tip[0] - p.WR[0]) * .72, p.WR[1] + (p.tip[1] - p.WR[1]) * .72];
    const g = `
      ${line(p.H, p.KB, 'back')}${line(p.KB, p.FB, 'back')}${line(p.FB, [p.FB[0] + 7, p.FB[1]], 'back')}
      ${line(p.N, p.EL, 'back')}${line(p.EL, p.WL, 'back')}
      ${line(p.H, p.N, 'body')}
      ${line(p.H, p.KF, 'body')}${line(p.KF, p.FF, 'body')}${line(p.FF, [p.FF[0] + 8, p.FF[1]], 'body')}
      <circle cx="${p.head[0].toFixed(1)}" cy="${p.head[1].toFixed(1)}" r="${L.head}" class="head"/>
      ${line(p.N, p.ER, 'arm')}${line(p.ER, p.WR, 'arm')}
      ${line(p.WR, rc, 'racket')}
      <ellipse cx="${rc[0].toFixed(1)}" cy="${rc[1].toFixed(1)}" rx="9" ry="6" transform="rotate(${(90 - p.rk).toFixed(1)} ${rc[0].toFixed(1)} ${rc[1].toFixed(1)})" class="rhead"/>
      ${ball ? `<circle cx="${ball[0].toFixed(1)}" cy="${ball[1].toFixed(1)}" r="4" class="ball"/>` : ''}`;
    return flip ? `<g transform="translate(200 0) scale(-1 1)">${g}</g>` : g;
  }
  function footprint(fp, flip) {
    const foot = (f, cls) => `<ellipse cx="${f[0]}" cy="${f[1]}" rx="4" ry="8" transform="rotate(${f[2]} ${f[0]} ${f[1]})" class="${cls}"/>`;
    const cx = (fp.l[0] + fp.r[0]) / 2, cy = (fp.l[1] + fp.r[1]) / 2 - 2;
    return `<line x1="4" y1="8" x2="96" y2="8" class="net"/><text x="50" y="6" class="lbl" text-anchor="middle">NET</text>
      <line x1="4" y1="84" x2="96" y2="84" class="base"/>
      ${foot(fp.l, 'lf')}${foot(fp.r, 'rf')}
      <g transform="rotate(${fp.sh} ${cx} ${cy})"><line x1="${cx - 16}" y1="${cy}" x2="${cx + 16}" y2="${cy}" class="shoulders"/><circle cx="${cx + 16}" cy="${cy}" r="2.6" class="rsh"/></g>
      <text x="50" y="97" class="lbl" text-anchor="middle">feet · shoulder line (dot = hitting shoulder)</text>`;
  }
  const STYLE = `<style>.body{stroke:#eef2ff;stroke-width:4;stroke-linecap:round}.back{stroke:#6b7a9c;stroke-width:3.5;stroke-linecap:round}.arm{stroke:#ffb27a;stroke-width:4.2;stroke-linecap:round}.head{fill:#eef2ff}.racket{stroke:#e2793f;stroke-width:3;stroke-linecap:round}.rhead{fill:rgba(226,121,63,.25);stroke:#e2793f;stroke-width:2.2}.ball{fill:#d7f23a}.gl{stroke:#2b3a5a;stroke-width:1}.netl{stroke:#2b3a5a;stroke-width:2;stroke-dasharray:3 3}</style>`;
  const FPSTYLE = `<style>.net{stroke:#7dd3fc;stroke-width:2}.base{stroke:#6b7a9c;stroke-width:1.5}.lbl{fill:#9aa6c4;font-size:5px;font-family:Inter,system-ui,sans-serif}.lf{fill:#6b7a9c}.rf{fill:#eef2ff}.shoulders{stroke:#e2793f;stroke-width:3;stroke-linecap:round}.rsh{fill:#ffb27a}</style>`;

  function mount(container, shot, opts = {}) {
    const phases = shot.phases, n = phases.length, HOLD = 900, TRANS = 700, SEG = HOLD + TRANS, TOTAL = n * SEG;
    container.innerHTML = `<div class="anim">
      <svg class="fig" viewBox="0 0 200 180" aria-label="${shot.label} animation">${STYLE}<line x1="0" y1="${GROUND + .5}" x2="200" y2="${GROUND + .5}" class="gl"/><line x1="${shot.flip ? 6 : 194}" y1="120" x2="${shot.flip ? 6 : 194}" y2="${GROUND}" class="netl"/><g class="fg"></g></svg>
      <div class="caption"></div>
      <div class="bar"><button class="btn sm play" type="button">⏸ Pause</button><input type="range" min="0" max="${TOTAL - 1}" value="0" aria-label="Scrub"><select class="speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></div>
      <div class="phases">${phases.map((p, i) => `<button type="button" data-i="${i}">${i + 1}. ${TL.esc(p.name)}</button>`).join('')}</div>
      <div class="foot" style="padding:0 10px 12px"><svg viewBox="0 0 100 100" aria-label="Stance footprint">${FPSTYLE}<g class="fp"></g></svg><div class="small muted"><b style="color:#eef2ff">Stance from above.</b> Net at the top. White foot = right foot, grey = left (right-hander). The orange bar is the shoulder line: watch it turn sideways on the unit turn and open again at contact.</div></div>
    </div>`;
    const fg = container.querySelector('.fg'), fp = container.querySelector('.fp'), cap = container.querySelector('.caption'), range = container.querySelector('input'), play = container.querySelector('.play'), speedSel = container.querySelector('.speed'), pbs = [...container.querySelectorAll('.phases button')];
    let t = 0, playing = true, last = null, raf = null, speed = 1;
    function render(time) {
      const i = Math.floor(time / SEG) % n, local = time % SEG, j = (i + 1) % n;
      const k = local < HOLD ? 0 : ease((local - HOLD) / TRANS);
      const pose = k ? lerpPose(phases[i].pose, phases[j].pose, k) : phases[i].pose;
      const pts = solve(pose);
      const b1 = phases[i].ball, b2 = phases[j].ball; const ball = (b1 && b2) ? [lerp(b1[0], b2[0], k), lerp(b1[1], b2[1], k)] : (k < .5 ? b1 : b2);
      fg.innerHTML = figure(pts, ball, shot.flip);
      fp.innerHTML = footprint(k ? lerpFp(phases[i].fp, phases[j].fp, k) : phases[i].fp);
      const show = k > .5 ? j : i;
      cap.innerHTML = `<b>${show + 1}. ${TL.esc(phases[show].name)}.</b> ${TL.esc(phases[show].caption)}`;
      pbs.forEach((b, x) => b.classList.toggle('on', x === show));
      range.value = Math.floor(time);
    }
    function loop(ts) { if (!playing) return; if (last != null) t = (t + (ts - last) * speed) % TOTAL; last = ts; render(t); raf = requestAnimationFrame(loop); }
    function setPlaying(v) { playing = v; play.textContent = v ? '⏸ Pause' : '▶ Play'; last = null; if (v) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf); }
    play.onclick = () => setPlaying(!playing);
    range.oninput = () => { setPlaying(false); t = +range.value; render(t); };
    speedSel.onchange = () => speed = +speedSel.value;
    pbs.forEach(b => b.onclick = () => { setPlaying(false); t = +b.dataset.i * SEG + 10; render(t); });
    render(0);
    if (opts.autoplay === false) setPlaying(false); else setPlaying(true);
    // pause when offscreen
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && playing) { playing = false; cancelAnimationFrame(raf); play.textContent = '▶ Play'; } else if (e.isIntersecting && !playing && !container.dataset.userPaused) setPlaying(true); }), { threshold: .1 }).observe(container);
    play.addEventListener('click', () => { container.dataset.userPaused = playing ? '' : '1'; });
    return { setPlaying };
  }
  return { mount };
})();
