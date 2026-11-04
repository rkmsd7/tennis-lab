// 3D mannequin shot animation: procedural humanoid (capsule limbs) on a lit court, driven by joint-angle keyframes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const D2R = Math.PI / 180;
const SEG = { torso: .48, neck: .08, head: .11, ua: .30, fa: .27, hand: .08, thigh: .44, shin: .43, foot: .22, rk: .50 };
const BASE = { pelvis: { y: 0, yaw: 0, pitch: 0 }, spine: { pitch: 10, turn: 0, roll: 0 }, head: { yaw: 0, pitch: 0 }, armR: { sx: 35, sy: 0, sz: 15, elbow: 90, wrist: 0 }, armL: { sx: 35, sy: 0, sz: 15, elbow: 90, wrist: 0 }, legR: { hx: 5, hz: 12, knee: 25 }, legL: { hx: 5, hz: 12, knee: 25 }, racket: { roll: 0 }, hands: 'none' };
function merge(a, b) { const o = {}; for (const k in a) o[k] = typeof a[k] === 'object' && !Array.isArray(a[k]) ? { ...a[k], ...(b?.[k] || {}) } : (b?.[k] ?? a[k]); return o; }
function lerpPose(a, b, t) { const o = {}; for (const k in a) { if (typeof a[k] === 'object') { o[k] = {}; for (const j in a[k]) o[k][j] = a[k][j] + (b[k][j] - a[k][j]) * t; } else o[k] = t < .5 ? a[k] : b[k]; } return o; }
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function capsule(len, r, mat) { const g = new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 6, 12); const m = new THREE.Mesh(g, mat); m.position.y = -len / 2; m.castShadow = true; return m; }
function joint(r, mat) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); m.castShadow = true; return m; }

export function buildMannequin(mat, racketMat) {
  const root = new THREE.Group();
  const pelvis = new THREE.Group(); root.add(pelvis);
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .14, 6, 12), mat); hips.rotation.z = Math.PI / 2; hips.castShadow = true; pelvis.add(hips);
  const spine = new THREE.Group(); spine.position.y = .05; pelvis.add(spine);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.15, SEG.torso - .3, 8, 14), mat); torso.position.y = SEG.torso / 2; torso.scale.set(1.15, 1, .8); torso.castShadow = true; spine.add(torso);
  const chestTop = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .22, 6, 12), mat); chestTop.rotation.z = Math.PI / 2; chestTop.position.y = SEG.torso - .02; chestTop.castShadow = true; spine.add(chestTop);
  const neck = new THREE.Group(); neck.position.y = SEG.torso + .02; spine.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(SEG.head, 20, 16), mat); head.position.y = SEG.neck + SEG.head; head.scale.set(.9, 1.1, 1); head.castShadow = true; neck.add(head);
  const neckM = capsule(SEG.neck + .06, .05, mat); neckM.position.y = (SEG.neck + .06) / 2 - .02; neck.add(neckM);
  const arm = side => { const s = new THREE.Group(); s.position.set(side * .22, SEG.torso - .02, 0); spine.add(s); s.add(joint(.065, mat)); const ua = capsule(SEG.ua, .055, mat); s.add(ua); const e = new THREE.Group(); e.position.y = -SEG.ua; s.add(e); e.add(joint(.05, mat)); const fa = capsule(SEG.fa, .045, mat); e.add(fa); const w = new THREE.Group(); w.position.y = -SEG.fa; e.add(w); const hand = capsule(SEG.hand, .04, mat); w.add(hand); return { s, e, w }; };
  const leg = side => { const h = new THREE.Group(); h.position.set(side * .11, -.02, 0); pelvis.add(h); h.add(joint(.07, mat)); const th = capsule(SEG.thigh, .075, mat); h.add(th); const k = new THREE.Group(); k.position.y = -SEG.thigh; h.add(k); k.add(joint(.06, mat)); const sh = capsule(SEG.shin, .055, mat); k.add(sh); const a = new THREE.Group(); a.position.y = -SEG.shin; k.add(a); const foot = new THREE.Mesh(new THREE.CapsuleGeometry(.045, SEG.foot - .09, 6, 10), mat); foot.rotation.x = Math.PI / 2; foot.position.set(0, -.03, -SEG.foot / 2 + .04); foot.castShadow = true; a.add(foot); return { h, k, a }; };
  const armR = arm(1), armL = arm(-1), legR = leg(1), legL = leg(-1);
  // racket in right hand: handle along -y of wrist, head beyond
  const racket = new THREE.Group(); racket.position.y = -SEG.hand * .6; armR.w.add(racket);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .22, 8), racketMat); handle.position.y = -.09; racket.add(handle);
  const throat = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .1, 6), racketMat); throat.position.y = -.24; racket.add(throat);
  const head2 = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 8, 32), racketMat); head2.position.y = -.42; head2.scale.set(.85, 1, 1); racket.add(head2);
  const strings = new THREE.Mesh(new THREE.CircleGeometry(.125, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .18, side: THREE.DoubleSide })); strings.position.y = -.42; strings.scale.set(.85, 1, 1); racket.add(strings);
  racket.traverse(o => o.castShadow = true);
  return { root, pelvis, spine, neck, armR, armL, legR, legL, racket };
}

export function applyPose(m, p) {
  m.pelvis.position.y = 1.0 + p.pelvis.y; m.pelvis.rotation.set(-p.pelvis.pitch * D2R, -p.pelvis.yaw * D2R, 0);
  m.spine.rotation.set(-p.spine.pitch * D2R, -p.spine.turn * D2R, p.spine.roll * D2R, 'YXZ');
  m.neck.rotation.set(-p.head.pitch * D2R, -p.head.yaw * D2R, 0);
  const arm = (a, q, side) => { a.s.rotation.set(q.sx * D2R, -side * q.sy * D2R, side * q.sz * D2R, 'ZXY'); a.e.rotation.x = q.elbow * D2R; a.w.rotation.x = q.wrist * D2R; };
  arm(m.armR, p.armR, 1); arm(m.armL, p.armL, -1);
  const leg = (l, q, side) => { l.h.rotation.set(q.hx * D2R, 0, side * q.hz * D2R, 'ZXY'); l.k.rotation.x = -q.knee * D2R; l.a.rotation.x = (q.knee * .5 - q.hx * .3) * D2R; };
  leg(m.legR, p.legR, 1); leg(m.legL, p.legL, -1);
  m.racket.rotation.set(0, p.racket.roll * D2R, 0);
  if (p.hands === 'two' || p.hands === 'throat') { // IK-lite: aim left arm at right hand / racket throat
    m.root.updateMatrixWorld(true);
    const target = new THREE.Vector3(); (p.hands === 'two' ? m.armR.w : m.racket.children[1]).getWorldPosition(target);
    const sPos = new THREE.Vector3(); m.armL.s.getWorldPosition(sPos);
    const local = m.armL.s.parent.worldToLocal(target.clone()); const sLocal = m.armL.s.position.clone(); const d = local.sub(sLocal); const dist = Math.min(d.length(), SEG.ua + SEG.fa - .02);
    const elbow = Math.acos(Math.max(-1, Math.min(1, (SEG.ua * SEG.ua + SEG.fa * SEG.fa - dist * dist) / (2 * SEG.ua * SEG.fa))));
    const dir = d.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const bendAngle = Math.acos(Math.max(-1, Math.min(1, (SEG.ua * SEG.ua + dist * dist - SEG.fa * SEG.fa) / (2 * SEG.ua * dist))));
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), bendAngle);
    m.armL.s.quaternion.copy(q.multiply(tilt)); m.armL.e.rotation.x = Math.PI - elbow; m.armL.w.rotation.x = 0;
  }
  // ground the lowest foot
  m.root.updateMatrixWorld(true);
  const v = new THREE.Vector3(); let minY = Infinity; for (const l of [m.legR, m.legL]) { l.a.getWorldPosition(v); minY = Math.min(minY, v.y - .06); }
  m.pelvis.position.y -= minY;
}

export function buildCourt(scene) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x14203a, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const line = (w, l, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ color: 0xe8edf5, roughness: .9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .003, z); m.receiveShadow = true; scene.add(m); };
  // half court in front of the player: baseline at z=0.6 (player stands just behind), net at z=-11.3; width 10.97 (doubles)
  const net = -11.3, base = .6; const lw = .06;
  line(10.97, lw, 0, base); line(lw, base - net, -5.485, (base + net) / 2); line(lw, base - net, 5.485, (base + net) / 2); line(lw, base - net, -4.115, (base + net) / 2); line(lw, base - net, 4.115, (base + net) / 2);
  line(8.23, lw, 0, net + 6.4); line(lw, 6.4, 0, net + 3.2); line(lw, .3, 0, base - .15);
  const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 1.0, 1, 1), new THREE.MeshStandardMaterial({ color: 0x9aa6c4, transparent: true, opacity: .35, side: THREE.DoubleSide })); netMesh.position.set(0, .5, net); scene.add(netMesh);
  const band = new THREE.Mesh(new THREE.BoxGeometry(12.8, .06, .02), new THREE.MeshStandardMaterial({ color: 0xffffff })); band.position.set(0, 1.0, net); scene.add(band);
}

export function mount(container, shot, opts = {}) {
  const phases = shot.phases, n = phases.length, HOLD = 800, TRANS = 750, S = HOLD + TRANS, TOTAL = n * S;
  const poses = phases.map(ph => merge(BASE, ph.pose3d || {}));
  container.innerHTML = `<div class="anim anim3d"><div class="stage"></div><div class="caption"></div>
   <div class="bar"><button class="btn sm play" type="button">⏸ Pause</button><input type="range" min="0" max="${TOTAL - 1}" value="0" aria-label="Scrub"><select class="speed" aria-label="Speed"><option value="0.35">0.35×</option><option value="0.7">0.7×</option><option value="1" selected>1×</option></select><div class="seg views"><button data-v="side" class="on">Side</button><button data-v="front">Front</button><button data-v="back">Behind</button><button data-v="top">Above</button></div></div>
   <div class="phases">${phases.map((p, i) => `<button type="button" data-i="${i}">${i + 1}. ${p.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</button>`).join('')}</div></div>`;
  const stage = container.querySelector('.stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 10, 30);
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 1, -.3); controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false; controls.minDistance = 2; controls.maxDistance = 9; controls.maxPolarAngle = Math.PI / 2 - .02;
  const VIEWS = { side: [3.6, 1.5, -1.6], front: [.8, 1.4, -4.2], back: [1.2, 1.9, 3.8], top: [1.2, 5.5, -.6] };
  const setView = v => { camera.position.set(...VIEWS[v]); controls.update(); };
  setView(shot.flip ? 'back' : 'side');
  scene.add(new THREE.HemisphereLight(0xdde7ff, 0x1a2238, .9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 6, 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.bias = -.0005; scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dd3fc, .9); rim.position.set(-4, 3, -4); scene.add(rim);
  buildCourt(scene);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8dce6, roughness: .55, metalness: .05 });
  const racketMat = new THREE.MeshStandardMaterial({ color: 0xe2793f, roughness: .5, metalness: .2 });
  const man = buildMannequin(bodyMat, racketMat); if (shot.flip) man.root.rotation.y = Math.PI; scene.add(man.root);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.034, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd7f23a, roughness: .8 })); ball.castShadow = true; scene.add(ball);
  const trail = []; for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(.016, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd7f23a, transparent: true, opacity: .12 })); scene.add(t); trail.push(t); }
  const cap = container.querySelector('.caption'), range = container.querySelector('input'), play = container.querySelector('.play'), speedSel = container.querySelector('.speed'), pbs = [...container.querySelectorAll('.phases button')];
  container.querySelectorAll('.views button').forEach(b => b.onclick = () => { container.querySelectorAll('.views button').forEach(x => x.classList.toggle('on', x === b)); setView(b.dataset.v); });
  let t = 0, playing = opts.autoplay !== false, last = null, speed = 1, raf = null, userPaused = false;
  function resize() { const w = stage.clientWidth || 600, h = Math.round(w * .62); renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  // contact phases: put the ball on the strings, computed from the posed racket head
  const contactPos = phases.map((ph, i) => { if (!/contact|flick|punch|block/i.test(ph.name)) return null; applyPose(man, poses[i]); man.root.updateMatrixWorld(true); const v = new THREE.Vector3(); man.racket.children[3].getWorldPosition(v); return [v.x, v.y, v.z]; });
  const bp = (ph, i) => contactPos[i] || ph.ball3d || [2, 1, -5];
  function sample(time) {
    const i = Math.floor(time / S) % n, local = time % S, j = (i + 1) % n; const k = local < HOLD ? 0 : ease((local - HOLD) / TRANS);
    applyPose(man, k ? lerpPose(poses[i], poses[j], k) : poses[i]);
    const a = bp(phases[i], i), b = bp(phases[j], j); ball.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * .15, a[2] + (b[2] - a[2]) * k);
    trail.forEach((tr, x) => { const kk = Math.max(0, k - (x + 1) * .05); tr.position.set(a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk + Math.sin(kk * Math.PI) * .15, a[2] + (b[2] - a[2]) * kk); tr.visible = k > 0; });
    const show = k > .5 ? j : i; cap.innerHTML = `<b>${show + 1}. ${phases[show].name}.</b> ${phases[show].caption}`; pbs.forEach((b, x) => b.classList.toggle('on', x === show)); range.value = Math.floor(time);
  }
  function frame(ts) { if (playing) { if (last != null) t = (t + (ts - last) * speed) % TOTAL; last = ts; sample(t); } controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(frame); }
  const setPlaying = v => { playing = v; last = null; play.textContent = v ? '⏸ Pause' : '▶ Play'; };
  play.onclick = () => { userPaused = playing; setPlaying(!playing); };
  range.oninput = () => { setPlaying(false); t = +range.value; sample(t); };
  speedSel.onchange = () => speed = +speedSel.value;
  pbs.forEach(b => b.onclick = () => { setPlaying(false); t = +b.dataset.i * S + 10; sample(t); });
  sample(0); raf = requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) { cancelAnimationFrame(raf); raf = null; } else if (!raf) { last = null; raf = requestAnimationFrame(frame); } }), { threshold: .05 }).observe(container);
  return { setPlaying, setView };
}
