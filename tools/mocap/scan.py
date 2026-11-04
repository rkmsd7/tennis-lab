"""Find candidate stroke windows in a tracked clip (output of track.py).
usage: python scan.py track.npz [hand=auto|R|L] [top=8]
A candidate = a continuous run of good tracking (no scene cut, key joints visible, figure large enough)
containing a clear hitting-wrist speed peak. Prints start/end/peak times with a quality score."""
import sys, numpy as np
d = np.load(sys.argv[1]); hand = sys.argv[2] if len(sys.argv) > 2 else 'auto'; top = int(sys.argv[3]) if len(sys.argv) > 3 else 8
t, W, I, V, OK, fps = d['t'], d['world'], d['img'], d['vis'], d['ok'], float(d['fps'])
N = len(t)
KEY = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
vis = V[:, KEY].mean(1) * OK
hip = I[:, [23, 24], :2].mean(1); sh = I[:, [11, 12], :2].mean(1); ank = I[:, [27, 28], :2].mean(1)
height = np.linalg.norm(sh - ank, axis=1) * d['size'][1] / d['size'][0]  # in units of image width
# scene cut / identity switch: big jump of hip image position or body-size
jump = np.r_[0, np.linalg.norm(np.diff(hip, axis=0), axis=1)] / np.maximum(height, .05)
dsz = np.r_[0, np.abs(np.diff(height))] / np.maximum(height, .05)
good = OK & (vis > .6) & (height > .12)
cut = (jump > .25) | (dsz > .2)
spd = {}
for h, wi in (('R', 16), ('L', 15)):
    p = W[:, wi]; v = np.r_[0, np.linalg.norm(np.diff(p, axis=0), axis=1)] * fps; v[~OK] = 0; spd[h] = v
if hand == 'auto': hand = 'R' if np.percentile(spd['R'][good], 95) >= np.percentile(spd['L'][good], 95) else 'L'
# runs
runs = []; s = None
for i in range(N):
    if good[i] and not cut[i]:
        if s is None: s = i
    else:
        if s is not None and i - s > fps * .8: runs.append((s, i))
        s = good[i] and i or None
if s is not None and N - s > fps * .8: runs.append((s, N))
v = spd[hand]; k = max(1, int(fps * .1)); vs = np.convolve(v, np.ones(k) / k, 'same')
cands = []
for a, b in runs:
    seg = vs[a:b]; used = np.zeros(b - a, bool)
    for _ in range(6):
        sc = np.where(used, 0, seg); j = int(np.argmax(sc))
        if sc[j] <= 0: break
        lo, hi = max(0, j - int(fps * 2.5)), min(b - a, j + int(fps * 2.0)); used[lo:hi] = True
        med = np.median(seg) + 1e-6; prom = seg[j] / med
        cands.append(dict(start=t[a + lo], end=t[a + hi - 1], peak=t[a + j], dur=t[a + hi - 1] - t[a + lo], prom=prom,
                          vis=float(vis[a + lo:a + hi].mean()), size=float(height[a + lo:a + hi].mean()),
                          score=float(min(prom, 6) * vis[a + lo:a + hi].mean() * min(height[a + lo:a + hi].mean(), .6) * min(1, (hi - lo) / fps / 2))))
cands.sort(key=lambda c: -c['score'])
print(f"{sys.argv[1]} N={N} fps={fps:.2f} tracked={OK.mean() * 100:.0f}% good={good.mean() * 100:.0f}% hand={hand} runs={len(runs)}")
for c in cands[:top]: print("  {start:7.2f}-{end:7.2f} peak {peak:7.2f} dur {dur:4.1f} prom {prom:4.1f} vis {vis:.2f} size {size:.2f} score {score:.2f}".format(**c))
