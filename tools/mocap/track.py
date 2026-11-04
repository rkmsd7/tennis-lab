"""Run MediaPipe PoseLandmarker (heavy, VIDEO mode) over a clip (or a time window) and save raw landmarks.
usage: python track.py clip.mp4 out.npz model.task [start_s] [end_s] [stride]
Saves: t (s), world (N,33,3 metres, MediaPipe axes: x right, y down, z toward camera-ish),
       img (N,33,3 normalised image coords), vis (N,33), ok (N bool), fps, size."""
import sys, time, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
src, out, model = sys.argv[1], sys.argv[2], sys.argv[3]
start = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
end = float(sys.argv[5]) if len(sys.argv) > 5 else 1e9
stride = int(sys.argv[6]) if len(sys.argv) > 6 else 1
opts = vision.PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO,
                                    num_poses=1, min_pose_detection_confidence=.5, min_pose_presence_confidence=.5, min_tracking_confidence=.5)
lm = vision.PoseLandmarker.create_from_options(opts)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
cap.set(cv2.CAP_PROP_POS_FRAMES, int(start * fps)); fi = int(start * fps)
T, WL, IL, VI, OK = [], [], [], [], []; t0 = time.time()
while True:
    ok, f = cap.read()
    if not ok or fi / fps > end: break
    if (fi - int(start * fps)) % stride == 0:
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        r = lm.detect_for_video(img, int(fi / fps * 1000))
        T.append(fi / fps)
        if r.pose_world_landmarks:
            w = r.pose_world_landmarks[0]; n = r.pose_landmarks[0]
            WL.append([[p.x, p.y, p.z] for p in w]); IL.append([[p.x, p.y, p.z] for p in n]); VI.append([p.visibility for p in n]); OK.append(True)
        else:
            WL.append(np.zeros((33, 3))); IL.append(np.zeros((33, 3))); VI.append(np.zeros(33)); OK.append(False)
    fi += 1
np.savez_compressed(out, t=np.array(T), world=np.array(WL, dtype=np.float32), img=np.array(IL, dtype=np.float32), vis=np.array(VI, dtype=np.float32), ok=np.array(OK), fps=fps / stride, size=np.array([W, H]))
print(f"{src}: {len(T)} frames, {np.mean(OK) * 100:.0f}% tracked, {time.time() - t0:.1f}s")
