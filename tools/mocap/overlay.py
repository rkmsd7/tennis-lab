"""Draw tracked skeleton over frames of a window, tiled into one image (to eyeball tracking quality).
usage: python overlay.py clip.mp4 track.npz out.jpg start end [n=16] [cols=8]"""
import sys, cv2, numpy as np
src, trk, out, a, b = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
n = int(sys.argv[6]) if len(sys.argv) > 6 else 16; cols = int(sys.argv[7]) if len(sys.argv) > 7 else 8
d = np.load(trk); t, I, OK = d['t'], d['img'], d['ok']
E = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24), (23, 24), (23, 25), (25, 27), (24, 26), (26, 28), (27, 31), (28, 32), (15, 19), (16, 20), (0, 11), (0, 12)]
cap = cv2.VideoCapture(src); fps = cap.get(5); tiles = []
for ts in np.linspace(a, b, n):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(ts * fps))); ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; i = int(np.argmin(np.abs(t - ts)))
    if OK[i]:
        P = (I[i, :, :2] * [w, h]).astype(int)
        for p, q in E: cv2.line(f, tuple(P[p]), tuple(P[q]), (0, 255, 0) if p % 2 == 0 or q % 2 == 0 else (0, 128, 255), 2)
        cv2.circle(f, tuple(P[16]), 5, (0, 0, 255), -1); cv2.circle(f, tuple(P[15]), 5, (255, 0, 0), -1)
    s = 320 / w; f = cv2.resize(f, (320, int(h * s))); cv2.putText(f, f"{ts:.2f}", (4, 20), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 255, 255), 2); tiles.append(f)
while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
cv2.imwrite(out, np.vstack([np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]), [cv2.IMWRITE_JPEG_QUALITY, 72])
