"""Cuts the 30 creatures (10 families x 3 stages) out of the transparent art sheet and upscales them x4.

Input : docs/media/concept/sheets/criaturas_recortables.webp (3 rows: initial, intermediate, final; 10 columns:
        fire, water, plant, electric, rock, shadow, light, crystal, plasma, mystic)
Output: apps/mobile/assets/creatures/families/{family}_{stage}.webp  and
        unity/TamTamEVO/Assets/TamTam/Art/Creatures/Families/{family}_{stage}.png
Steps : minimal-cost seams between neighbours (they overlap) -> colour bleed into transparent pixels ->
        EDSR x4 super-resolution (OpenCV dnn_superres, model EDSR_x4.pb) -> alpha upscaled separately.
Needs : pip install "opencv-contrib-python-headless==4.10.0.84" pillow numpy ; EDSR_x4.pb from
        https://github.com/Saafke/EDSR_Tensorflow (models/EDSR_x4.pb), path given by --model.
Usage : python3 tools/import-family-sheet.py --model /path/EDSR_x4.pb
"""
import argparse, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAMS = ["fire", "water", "plant", "electric", "rock", "shadow", "light", "crystal", "plasma", "mystic"]
STAGES = ["initial", "intermediate", "final"]
ROWS = [(40, 222), (236, 404), (420, 660)]


def seam(cost, lo, hi):
    H = cost.shape[0]; w = hi - lo; c = cost[:, lo:hi]
    D = np.full((H, w), 1e18); P = np.zeros((H, w), int); D[0] = c[0]
    for y in range(1, H):
        for x in range(w):
            best, bx = D[y - 1, x], x
            for xx in (x - 1, x + 1):
                if 0 <= xx < w and D[y - 1, xx] < best: best, bx = D[y - 1, xx], xx
            D[y, x] = c[y, x] + best; P[y, x] = bx
    x = int(np.argmin(D[-1])); path = [0] * H
    for y in range(H - 1, -1, -1): path[y] = x + lo; x = P[y, x]
    return np.array(path)


def cut(sheet):
    a = np.array(Image.open(sheet).convert("RGBA")); A = a[:, :, 3].astype(float); W = a.shape[1]; out = {}
    for ri, (r0, r1) in enumerate(ROWS):
        Ar = A[r0:r1]; xs = np.nonzero((Ar > 25).sum(0))[0]; x0, x1 = xs[0], xs[-1]; step = (x1 - x0) / 10
        seams = [np.zeros(r1 - r0, int)] + [seam(Ar ** 2 + 1, int(x0 + k * step) - 35, int(x0 + k * step) + 35) for k in range(1, 10)] + [np.full(r1 - r0, W)]
        for k in range(10):
            crop = a[r0:r1].copy(); xx = np.arange(W)[None, :]
            inside = (xx >= seams[k][:, None]) & (xx < seams[k + 1][:, None])
            crop[:, :, 3] = np.where(inside, crop[:, :, 3], 0)
            ys, xs2 = np.nonzero(crop[:, :, 3] > 8)
            out[f"{FAMS[k]}_{STAGES[ri]}"] = crop[ys.min():ys.max() + 1, xs2.min():xs2.max() + 1]
    return out


def upscale(rgba, sr):
    import cv2
    im = cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA)
    im = cv2.copyMakeBorder(im, 6, 6, 6, 6, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    bgr = cv2.inpaint(im[:, :, :3].copy(), (im[:, :, 3] < 128).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    up = sr.upsample(bgr)
    au = cv2.resize(im[:, :, 3], (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
    au = np.clip((au.astype(np.float32) - 20) * 1.12, 0, 255).astype(np.uint8)
    return cv2.cvtColor(np.dstack([up, au]), cv2.COLOR_BGRA2RGBA)


if __name__ == "__main__":
    import cv2
    ap = argparse.ArgumentParser(); ap.add_argument("--model", required=True)
    ap.add_argument("--sheet", default=os.path.join(ROOT, "docs/media/concept/sheets/criaturas_recortables.webp"))
    args = ap.parse_args()
    sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(args.model); sr.setModel("edsr", 4)
    web = os.path.join(ROOT, "apps/mobile/assets/creatures/families"); unity = os.path.join(ROOT, "unity/TamTamEVO/Assets/TamTam/Art/Creatures/Families")
    os.makedirs(web, exist_ok=True); os.makedirs(unity, exist_ok=True)
    for name, crop in cut(args.sheet).items():
        img = Image.fromarray(upscale(crop, sr))
        img.save(os.path.join(web, name + ".webp"), quality=90, method=6)
        img.save(os.path.join(unity, name + ".png"), optimize=True)
        print(name, img.size)
