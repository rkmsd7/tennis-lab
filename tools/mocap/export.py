"""Turn a tracked clip window into data/motion/<shot>.json for js/mocap3d.js.
usage: python export.py clips.json <shot> <track_dir> <vids_dir> <out_dir>
Clip config (tools/mocap/clips.json) per shot:
  player, id, start, end (s, in the source clip), hand (R|L), yaw (deg, extra rotation about Y),
  smooth (Savitzky-Golay window in source frames), playDur (s, playback length at 1x), trans (bool:
  add root translation from image coords, static cameras only), phases ({"contact": t, ...} time overrides).
Pipeline: drop bad frames (lost track / low visibility / left-right flips) -> spike removal -> linear
interpolation -> MediaPipe axes (x right, y down, z away) to Y-up right-handed (x, -y, -z) ->
Savitzky-Golay smoothing -> constant bone lengths -> light re-smoothing -> rotate so the hitting hand moves
toward -z (the net) at contact -> ground the lowest foot point (smoothed) to y=0 -> subsample <=240 frames."""
import sys, json, os, numpy as np
from scipy.signal import savgol_filter, medfilt

cfg_path, shot, trk_dir, vid_dir, out_dir = sys.argv[1:6]
C = json.load(open(cfg_path))[shot]
d = np.load(os.path.join(trk_dir, C['id'] + '.npz'))
info = {}
ip = os.path.join(vid_dir, C['id'] + '.info.json')
if os.path.exists(ip): info = json.load(open(ip))
t_all, fps = d['t'], float(d['fps'])
sel = np.where((t_all >= C['start']) & (t_all <= C['end']))[0]
t = t_all[sel]; W = d['world'][sel].astype(float); I = d['img'][sel].astype(float); V = d['vis'][sel]; OK = d['ok'][sel].copy()
n = len(t)
HAND = C.get('hand', 'R'); HW, OW = (16, 15) if HAND == 'R' else (15, 16)
KEY = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
PAIRS = [(1, 4), (2, 5), (3, 6), (7, 8), (9, 10), (11, 12), (13, 14), (15, 16), (17, 18), (19, 20), (21, 22), (23, 24), (25, 26), (27, 28), (29, 30), (31, 32)]
SWAP = np.arange(33)
for a, b in PAIRS: SWAP[a], SWAP[b] = b, a

bad = ~OK | (V[:, KEY].mean(1) < C.get('minVis', .3))
# left/right flips: compare against last good frame, identity vs swapped labelling (image coords are stable for this)
last = None
flipped = np.zeros(n, bool)
for i in range(n):
    if bad[i]: continue
    if last is not None:
        same = np.linalg.norm(I[i, KEY, :2] - I[last, KEY, :2], axis=1).sum()
        swp = np.linalg.norm(I[i, SWAP[KEY], :2] - I[last, KEY, :2], axis=1).sum()
        torso = np.linalg.norm(I[last, [11, 12], :2].mean(0) - I[last, [23, 24], :2].mean(0))
        # only a real flip if the labels jumped (side-on views overlap L/R joints, so a small 'swap gain' means nothing)
        if swp < .6 * same and same / len(KEY) > .25 * torso:
            if C.get('unflip', True):  # front/back confusion: swap the labels back and mirror depth
                W[i] = W[i, SWAP] * [1, 1, -1]; I[i] = I[i, SWAP]; V[i] = V[i, SWAP]; flipped[i] = True
            else: bad[i] = True; continue
    last = i
print(f"{shot}: {n} src frames @ {fps:.2f}fps, unflipped {flipped.sum()}, bad {bad.sum()}" + (f" flips at t={np.round(t[flipped], 2).tolist()}" if 0 < flipped.sum() < 40 else ""))

# spikes: per-landmark deviation from a running median
for j in range(33):
    for k in range(3):
        x = W[:, j, k].copy(); x[bad] = np.interp(np.where(bad)[0], np.where(~bad)[0], x[~bad]) if bad.any() else x[bad]
        m = medfilt(x, 7); W[:, j, k] = x
        W[np.abs(x - m) > C.get('spike', .12), j, k] = np.nan
good_idx = np.arange(n)
for j in range(33):
    for k in range(3):
        x = W[:, j, k]; nan = np.isnan(x)
        if nan.any(): W[nan, j, k] = np.interp(good_idx[nan], good_idx[~nan], x[~nan])

P = np.stack([W[..., 0], -W[..., 1], -W[..., 2]], -1)  # Y up, right handed, z toward camera

if C.get('trans'):  # root translation in the camera plane from image coords (static camera only)
    sz = d['size']; asp = sz[1] / sz[0]
    hipI = I[:, [23, 24], :2].mean(1) * [1, asp]
    for kk in range(2): hipI[bad, kk] = np.interp(np.where(bad)[0], np.where(~bad)[0], hipI[~bad, kk]) if bad.any() else hipI[bad, kk]
    torsoW = np.linalg.norm(P[:, [11, 12]].mean(1) - P[:, [23, 24]].mean(1), axis=1)
    torsoI = np.linalg.norm((I[:, [11, 12], :2].mean(1) - I[:, [23, 24], :2].mean(1)) * [1, asp], axis=1)
    scale = np.median(torsoW[~bad] / np.maximum(torsoI[~bad], 1e-3))
    root = np.zeros((n, 3)); root[:, 0] = (hipI[:, 0] - hipI[0, 0]) * scale; root[:, 1] = -(hipI[:, 1] - hipI[0, 1]) * scale * C.get('transY', 1)
    root[:, :2] = savgol_filter(root[:, :2], min(n - (n + 1) % 2, 2 * (C.get('smooth', 9) // 2) + 1 + 6), 2, axis=0)
    P = P + root[:, None, :]

w = C.get('smooth', 9); w = w + 1 - w % 2; w = min(w, n - (1 - n % 2))
P = savgol_filter(P, w, 3, axis=0)
# constant bone lengths (limbs + feet + hands), median length over the window
BONES = [(11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (12, 14), (14, 16), (16, 18), (16, 20), (16, 22),
         (23, 25), (25, 27), (27, 29), (27, 31), (24, 26), (26, 28), (28, 30), (28, 32)]
for a, b in BONES:
    L = np.median(np.linalg.norm(P[:, b] - P[:, a], axis=1))
    v = P[:, b] - P[:, a]; P[:, b] = P[:, a] + v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6) * L
P = savgol_filter(P, min(5, w), 2, axis=0)
# MediaPipe world landmarks come out short (~1.5 m people): rescale so thigh+shin+torso matches the player's height
mlen = lambda a, b: np.median(np.linalg.norm(P[:, a] - P[:, b], axis=1))
chain = (mlen(23, 25) + mlen(24, 26)) / 2 + (mlen(25, 27) + mlen(26, 28)) / 2 + np.median(np.linalg.norm(P[:, [11, 12]].mean(1) - P[:, [23, 24]].mean(1), axis=1))
SCALE = C.get('height', 1.85) * .76 / chain
P *= SCALE

def speed(j):
    v = np.r_[[0], np.linalg.norm(np.diff(P[:, j], axis=0), axis=1)] * fps
    return np.convolve(v, np.ones(3) / 3, 'same')
sp = speed(HW)
T2I = lambda s: int(np.argmin(np.abs(t - s)))
ov = {k: T2I(v) for k, v in C.get('phases', {}).items()}
contact = ov.get('contact', int(np.argmax(sp)))
if C.get('kind') == 'overhead' and 'contact' not in ov:  # highest hitting wrist near the speed peak
    lo, hi = max(0, contact - int(fps * .25)), min(n, contact + int(fps * .25)); contact = lo + int(np.argmax(P[lo:hi, HW, 1]))

# yaw: hitting-hand horizontal velocity around contact -> -z
k = max(2, int(fps * .04)); a, b = max(0, contact - k), min(n - 1, contact + k)
vel = P[b, HW] - P[a, HW]
ang = np.arctan2(vel[0], -vel[2])  # angle of vel from -z toward +x
yaw = -ang + np.radians(C.get('yaw', 0))
def facing(Q, i):  # hip-forward angle (deg) from -z toward +x, averaged with shoulders
    out = []
    for l, r in ((23, 24), (11, 12)):
        rv = Q[i, r] - Q[i, l]; f = np.cross([0, 1, 0], rv); out.append(np.arctan2(f[0], -f[2]))
    return np.arctan2(np.mean(np.sin(out)), np.mean(np.cos(out)))
if C.get('face') is not None:  # [time_s or 'contact', target_deg]: rotate so the pelvis/chest faces target at that frame
    fi = contact if C['face'][0] == 'contact' else T2I(C['face'][0])
    yaw = np.radians(C['face'][1]) - facing(P, fi)
if C.get('yawFixed') is not None: yaw = np.radians(C['yawFixed'])
c, s = np.cos(yaw), np.sin(yaw)
R = np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]])  # rotates the heading angle (from -z toward +x) by +yaw
P = P @ R.T
hipF = lambda i: (lambda r: np.degrees(np.arctan2(*(np.cross([0, 1, 0], r)[[0, 2]] * [1, -1]))))(P[i, 24] - P[i, 23])
# centre horizontally on the first frame's hips, ground the lowest foot point
P[:, :, [0, 2]] -= P[0, [23, 24]][:, [0, 2]].mean(0)
foot = P[:, [27, 28, 29, 30, 31, 32], 1].min(1)
g = savgol_filter(foot, min(w + 6 - (w % 2), n - (1 - n % 2)), 2) if not C.get('trans') else np.minimum(foot, np.percentile(foot, 5))
P[:, :, 1] -= g[:, None]
P[:, :, 1] -= min(0, P[:, [29, 30, 31, 32], 1].min()) if False else 0

# phases
kind = C.get('kind', 'ground')
if kind == 'overhead':
    pre = slice(0, contact)
    trophy = ov.get('p1', int(np.argmax(P[pre, OW, 1])) if contact > 2 else contact // 2)
    drop = ov.get('p2', trophy + int(np.argmin(P[trophy:contact, HW, 1] - P[trophy:contact, 12 if HAND == 'R' else 11, 1])) if contact > trophy + 1 else (trophy + contact) // 2)
    ph = [ov.get('p0', 0), trophy, drop, contact, ov.get('p4', min(n - 1, contact + int((n - contact) * .7)))]
else:
    hipc = P[:, [23, 24]].mean(1)
    back = P[:contact, HW, 2] - hipc[:contact, 2]
    ut = ov.get('p1', int(np.argmax(back)) if contact > 3 else contact // 3)
    if ut >= contact - 1: ut = contact // 2
    ld = ov.get('p2', ut + int(np.argmin(P[ut:contact, HW, 1])) if contact > ut + 1 else (ut + contact) // 2)
    if ld <= ut or ld >= contact: ld = (ut + contact) // 2
    fin = ov.get('p4', contact + int(np.argmax(P[contact:, HW, 1])) if n - contact > 3 else n - 1)
    if fin - contact < (n - contact) * .3: fin = min(n - 1, contact + int((n - contact) * .6))
    ph = [ov.get('p0', 0), ut, ld, contact, fin]

# subsample to <= 240 frames
MAX = C.get('maxFrames', 240)
idx = np.arange(n) if n <= MAX else np.round(np.linspace(0, n - 1, MAX)).astype(int)
mapi = lambda f: int(np.argmin(np.abs(idx - f)))
out_fps = len(idx) / C.get('playDur', 3.2)
names = C['phaseNames']
data = {
    'shot': shot, 'player': C['player'], 'hand': HAND,
    'source': {'id': C['id'], 'title': C.get('title') or info.get('title', ''), 'channel': C.get('channel') or info.get('channel', info.get('uploader', '')),
               'start': round(float(t[0]), 2), 'end': round(float(t[-1]), 2), 'fps': round(fps, 2)},
    'fps': round(out_fps, 2), 'mirrored': False,
    'phases': [{'name': names[i], 'frame': mapi(f)} for i, f in enumerate(ph)],
    'frames': [[[round(float(v), 3) for v in p] for p in P[i]] for i in idx],
}
os.makedirs(out_dir, exist_ok=True)
op = os.path.join(out_dir, shot + '.json')
with open(op, 'w') as f: json.dump(data, f, separators=(',', ':'))
print(f"  -> {op}: {len(idx)} frames, fps {out_fps:.1f}, {os.path.getsize(op) // 1024} KB, phases {[p['frame'] for p in data['phases']]} "
      f"(src t {[round(float(t[f]), 2) for f in ph]}), yaw {np.degrees(yaw):.0f}, facing per phase {[round(float(np.degrees(facing(P, f)))) for f in ph]}, peak speed {sp.max():.2f} m/s(src), scale {SCALE:.2f}")
