// Pose-tracked 3D mannequin: plays back data/motion/<shot>.json (MediaPipe 33-landmark world coordinates,
// metres, Y up, net toward -z) as a smooth grey mannequin with a racket in the hitting hand.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildCourt } from './anim3d.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const UP = new THREE.Vector3(0, 1, 0);

// limb segments between landmarks: [a, b, radius at a, radius at b]
const LIMBS = [
  [11, 13, .056, .047], [13, 15, .046, .036], [12, 14, .056, .047], [14, 16, .046, .036],
  [23, 25, .088, .062], [25, 27, .060, .042], [24, 26, .088, .062], [26, 28, .060, .042],
  [27, 31, .040, .032], [29, 31, .036, .030], [27, 29, .040, .036], [28, 32, .040, .032], [30, 32, .036, .030], [28, 30, .040, .036],
  [11, 23, .07, .075], [12, 24, .07, .075], [11, 12, .065, .065], [23, 24, .085, .085]
];
const JOINTS = [[11, .062], [12, .062], [13, .049], [14, .049], [15, .037], [16, .037], [23, .088], [24, .088], [25, .063], [26, .063], [27, .043], [28, .043]];

function seg(r0, r1, mat) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, 14, 1, true); g.translate(0, .5, 0);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
}
function ball(r, mat) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat); m.castShadow = true; return m; }
const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4();
function place(mesh, a, b) {
  tmpV.subVectors(b, a); const len = tmpV.length() || 1e-4;
  mesh.position.copy(a); mesh.quaternion.setFromUnitVectors(UP, tmpV.multiplyScalar(1 / len)); mesh.scale.set(1, len, 1);
}
// orient an ellipsoid with local Y along `ydir` and local X as close as possible to `xdir`
function orient(mesh, centre, ydir, xdir, sx, sy, sz) {
  const y = ydir.clone().normalize(); const x = xdir.clone().addScaledVector(y, -xdir.dot(y)).normalize(); const z = new THREE.Vector3().crossVectors(x, y);
  tmpM.makeBasis(x, y, z); mesh.quaternion.setFromRotationMatrix(tmpM); mesh.position.copy(centre); mesh.scale.set(sx, sy, sz);
}

function buildFigure(mat, racketMat) {
  const root = new THREE.Group();
  const limbs = LIMBS.map(([a, b, r0, r1]) => { const m = seg(r0, r1, mat); root.add(m); return { a, b, m }; });
  const joints = JOINTS.map(([i, r]) => { const m = ball(r, mat); root.add(m); return { i, m }; });
  const hands = [15, 16].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat); m.castShadow = true; root.add(m); return { i, m }; });
  const chest = ball(1, mat), belly = ball(1, mat), pelvis = ball(1, mat), head = ball(1, mat), neck = seg(.05, .045, mat);
  root.add(chest, belly, pelvis, head, neck);
  const racket = new THREE.Group(); root.add(racket);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.015, .016, .2, 10), racketMat); handle.position.y = .07; racket.add(handle);
  const throatL = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .13, 6), racketMat); throatL.position.set(-.035, .225, 0); throatL.rotation.z = .3; racket.add(throatL);
  const throatR = throatL.clone(); throatR.position.x = .035; throatR.rotation.z = -.3; racket.add(throatR);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(.14, .011, 8, 40), racketMat); hoop.scale.set(.8, 1.12, 1); hoop.position.y = .44; racket.add(hoop);
  const strings = new THREE.Mesh(new THREE.CircleGeometry(.135, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
  strings.scale.copy(hoop.scale); strings.position.copy(hoop.position); racket.add(strings);
  racket.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, limbs, joints, hands, chest, belly, pelvis, head, neck, racket };
}

const V = () => new THREE.Vector3();
const P = Array.from({ length: 33 }, V);
const S = { sc: V(), hc: V(), spine: V(), shR: V(), hipR: V(), a: V(), b: V(), c: V(), d: V(), n: V() };

function pose(fig, frames, f, hand, smoothDir) {
  const n = frames.length, i0 = Math.max(0, Math.min(n - 1, Math.floor(f))), i1 = Math.min(n - 1, i0 + 1), k = f - i0;
  const A = frames[i0], B = frames[i1];
  for (let j = 0; j < 33; j++) P[j].set(A[j][0] + (B[j][0] - A[j][0]) * k, A[j][1] + (B[j][1] - A[j][1]) * k, A[j][2] + (B[j][2] - A[j][2]) * k);
  for (const l of fig.limbs) place(l.m, P[l.a], P[l.b]);
  for (const j of fig.joints) j.m.position.copy(P[j.i]);
  // hands: small ellipsoids from wrist toward the knuckles
  for (const h of fig.hands) {
    const w = P[h.i], idx = P[h.i + 4], pk = P[h.i + 2]; S.a.addVectors(idx, pk).multiplyScalar(.5);
    S.b.subVectors(S.a, w); const L = Math.max(.06, S.b.length()); S.c.copy(w).addScaledVector(S.b, .5);
    orient(h.m, S.c, S.b, S.d.subVectors(idx, pk), .04, L * .62, .028);
  }
  // torso
  S.sc.addVectors(P[11], P[12]).multiplyScalar(.5); S.hc.addVectors(P[23], P[24]).multiplyScalar(.5);
  S.spine.subVectors(S.sc, S.hc); const tl = S.spine.length();
  S.shR.subVectors(P[12], P[11]); S.hipR.subVectors(P[24], P[23]);
  const sw = S.shR.length(), hw = S.hipR.length();
  orient(fig.chest, S.a.copy(S.hc).addScaledVector(S.spine, .7), S.spine, S.shR, sw * .5 + .015, tl * .34, .105);
  orient(fig.belly, S.a.copy(S.hc).addScaledVector(S.spine, .36), S.spine, S.b.addVectors(S.shR, S.hipR), (sw + hw) * .25 + .01, tl * .3, .092);
  orient(fig.pelvis, S.a.copy(S.hc).addScaledVector(S.spine, .02), S.spine, S.hipR, hw * .5 + .055, .1, .1);
  // head: centred between the ears, nudged up and slightly toward the nose
  S.a.addVectors(P[7], P[8]).multiplyScalar(.5); S.b.subVectors(P[0], S.a);
  S.c.subVectors(S.a, S.sc); const up = S.c.clone().normalize();
  S.a.addScaledVector(up, .025).addScaledVector(S.b, .15);
  orient(fig.head, S.a, up, S.d.subVectors(P[8], P[7]), .098, .118, .108);
  place(fig.neck, S.sc, S.n.copy(S.sc).lerp(S.a, .6));
  // racket from the hitting hand: handle along a blend of hand (wrist->index) and forearm directions
  const w = hand === 'L' ? 15 : 16, el = w - 2;
  S.a.subVectors(P[w + 4], P[w]).normalize(); S.b.subVectors(P[w], P[el]).normalize();
  const dir = S.c.copy(S.a).multiplyScalar(.75).addScaledVector(S.b, .25).normalize();
  if (smoothDir.ok) dir.lerp(smoothDir.v, .35).normalize();
  smoothDir.v.copy(dir); smoothDir.ok = true;
  // string-bed normal ~ palm normal
  S.d.subVectors(P[w + 4], P[w + 2]); const palm = S.n.crossVectors(S.a, S.d);
  if (hand === 'L') palm.negate();
  const x = V().crossVectors(dir, palm.lengthSq() > 1e-8 ? palm : UP);
  orient(fig.racket, S.a.copy(P[w]).addScaledVector(dir, -.035).addScaledVector(S.b, .0), dir, x.lengthSq() > 1e-8 ? x : V().set(1, 0, 0), 1, 1, 1);
}

export function mount(container, shot, motion, opts = {}) {
  const frames = motion.frames, n = frames.length, fps = motion.fps || 30;
  const phases = shot.phases.map((p, i) => ({ ...p, frame: motion.phases?.[i]?.frame ?? Math.round(i * (n - 1) / 4) }));
  const src = motion.source || {};
  const shotName = (shot.label || motion.shot || '').toLowerCase();
  container.innerHTML = `<div class="anim anim3d mocap"><div class="stage"></div><div class="caption"></div>
   <div class="bar"><button class="btn sm play" type="button">⏸ Pause</button><input type="range" min="0" max="${n - 1}" step="0.01" value="0" aria-label="Scrub"><select class="speed" aria-label="Speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option></select><div class="seg views"><button data-v="side" class="on">Side</button><button data-v="front">Front</button><button data-v="back">Behind</button><button data-v="top">Above</button></div></div>
   <div class="phases">${phases.map((p, i) => `<button type="button" data-i="${i}">${i + 1}. ${esc(p.name)}</button>`).join('')}</div>
   <p class="attrib">Motion: ${esc(motion.player)}'s ${esc(shotName)}, recreated with pose estimation from “${src.id ? `<a href="https://www.youtube.com/watch?v=${esc(src.id)}&t=${Math.floor(src.start || 0)}s" target="_blank" rel="noopener">${esc(src.title)}</a>` : esc(src.title)}” (${esc(src.channel)}, YouTube)</p></div>`;
  const stage = container.querySelector('.stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 10, 30);
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false; controls.maxPolarAngle = Math.PI / 2 - .02;
  // frame the figure: bounding box of the whole motion
  const box = new THREE.Box3(); for (let i = 0; i < n; i += 4) for (const p of frames[i]) box.expandByPoint(tmpV.set(p[0], p[1], p[2]));
  const ctr = box.getCenter(V()), size = box.getSize(V());
  const H = size.y + .4; // headroom for the racket, which is not in the landmark bounding box
  const K = Math.max(.9, H / 2.3, size.x * .55, size.z * .55);
  controls.target.set(ctr.x, Math.max(.9, H * .45), ctr.z);
  const T = controls.target;
  const VIEWS = { side: [3.5 * K, 1.25 * K, -1.1 * K], front: [.6, 1.25 * K, -3.9 * K], back: [.9, 1.6 * K, 3.8 * K], top: [.8, 5.2 * K, -.5] };
  const setView = v => { const p = VIEWS[v]; camera.position.set(T.x + p[0], p[1], T.z + p[2]); controls.update(); };
  setView(opts.view || 'side');
  scene.add(new THREE.HemisphereLight(0xdde7ff, 0x1a2238, .9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3 + ctr.x, 6, 2 + ctr.z); key.target.position.set(ctr.x, 0, ctr.z); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); key.shadow.bias = -.0005; scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dd3fc, .9); rim.position.set(-4, 3, -4); scene.add(rim);
  buildCourt(scene);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8dce6, roughness: .5, metalness: .05 });
  const racketMat = new THREE.MeshStandardMaterial({ color: 0xe2793f, roughness: .5, metalness: .2 });
  const fig = buildFigure(bodyMat, racketMat); scene.add(fig.root);
  const hand = motion.hand || (() => { let r = 0, l = 0; for (let i = 1; i < n; i++) { const a = frames[i], b = frames[i - 1]; r += Math.hypot(a[16][0] - b[16][0], a[16][1] - b[16][1], a[16][2] - b[16][2]); l += Math.hypot(a[15][0] - b[15][0], a[15][1] - b[15][1], a[15][2] - b[15][2]); } return r >= l ? 'R' : 'L'; })();
  const smoothDir = { v: V(), ok: false };
  const cap = container.querySelector('.caption'), range = container.querySelector('input'), play = container.querySelector('.play'), speedSel = container.querySelector('.speed'), pbs = [...container.querySelectorAll('.phases button')];
  container.querySelectorAll('.views button').forEach(b => b.onclick = () => { container.querySelectorAll('.views button').forEach(x => x.classList.toggle('on', x === b)); setView(b.dataset.v); });
  const PAUSE = 900; // ms hold on the last frame before looping
  let f = 0, hold = 0, playing = opts.autoplay !== false, last = null, speed = 1, raf = null, shownPhase = -1;
  function resize() { const w = stage.clientWidth || 600, h = Math.round(w * .62); renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  function show(fr) {
    pose(fig, frames, fr, hand, smoothDir);
    let ph = 0; for (let i = 0; i < phases.length; i++) if (fr >= phases[i].frame - .5) ph = i;
    if (ph !== shownPhase) { shownPhase = ph; cap.innerHTML = `<b>${ph + 1}. ${esc(phases[ph].name)}.</b> ${esc(phases[ph].caption)}`; pbs.forEach((b, x) => b.classList.toggle('on', x === ph)); }
    range.value = fr;
  }
  function tick(ts) {
    if (playing) {
      if (last != null) {
        const dt = Math.min(100, ts - last);
        if (hold > 0) { hold -= dt; if (hold <= 0) { f = 0; smoothDir.ok = false; } }
        else { f += dt / 1000 * fps * speed; if (f >= n - 1) { f = n - 1; hold = PAUSE; } }
      }
      last = ts; show(f);
    }
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick);
  }
  const setPlaying = v => { playing = v; last = null; play.textContent = v ? '⏸ Pause' : '▶ Play'; };
  play.onclick = () => setPlaying(!playing);
  range.oninput = () => { setPlaying(false); f = +range.value; hold = 0; smoothDir.ok = false; show(f); };
  speedSel.onchange = () => speed = +speedSel.value;
  pbs.forEach(b => b.onclick = () => { setPlaying(false); hold = 0; f = phases[+b.dataset.i].frame; smoothDir.ok = false; show(f); });
  show(0); raf = requestAnimationFrame(tick);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) { cancelAnimationFrame(raf); raf = null; } else if (!raf) { last = null; raf = requestAnimationFrame(tick); } }), { threshold: .05 }).observe(container);
  return { setPlaying, setView, seek: fr => { setPlaying(false); f = fr; smoothDir.ok = false; show(f); }, phases };
}
