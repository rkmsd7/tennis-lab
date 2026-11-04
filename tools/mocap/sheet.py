"""Contact sheet of a clip: one thumbnail every `step` seconds, labelled with the timestamp.
usage: python sheet.py clip.mp4 out.jpg [step=1.0] [start=0] [end=inf] [cols=8]"""
import sys, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
start = float(sys.argv[4]) if len(sys.argv) > 4 else 0
end = float(sys.argv[5]) if len(sys.argv) > 5 else 1e9
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 8
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
dur = n / fps; tiles = []; t = start
while t < min(end, dur) and len(tiles) < 96:
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps)); ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; s = 240 / w; f = cv2.resize(f, (240, int(h * s)))
    cv2.putText(f, f"{t:.1f}", (4, 18), cv2.FONT_HERSHEY_SIMPLEX, .55, (0, 255, 255), 2)
    tiles.append(f); t += step
th, tw = tiles[0].shape[:2]
while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 70])
print(f"fps={fps:.2f} frames={n} dur={dur:.1f}s size={w}x{h}")
