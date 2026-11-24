"""Exports the Unity painted Chispín (AI painting + bone layout, see PaintedChispinBuilder.cs) for the web/RN app:
- a downscaled WebP of the painting and of the closed-eyes patch (apps/mobile/assets/creatures/)
- a skinned grid mesh + bone layout in rig units (packages/art/src/fire/chispinPainted.data.ts)
Usage: python3 tools/gen_painted_chispin.py
"""
import colorsys, json, math, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
U = os.path.join(ROOT, "unity/TamTamEVO/Assets/TamTam/Art/Creatures/Chispin/Painted")
OUT_IMG = os.path.join(ROOT, "apps/mobile/assets/creatures")
OUT_TS = os.path.join(ROOT, "packages/art/src/fire/chispinPainted.data.ts")
SCALE = 0.5   # texture downscale for the app
CELL = 40     # mesh cell in source pixels

LAYOUT = [  # id, parent, a(x,y), b(x,y)  — pixels of a 2576-wide preview, y down (from PaintedChispinBuilder)
    ("root", None, 1300, 1255, 1340, 1255), ("body", "root", 1060, 900, 1500, 860),
    ("tail1", "body", 900, 905, 700, 905), ("tail2", "tail1", 700, 905, 530, 830),
    ("tail3", "tail2", 530, 830, 445, 690), ("tail4", "tail3", 445, 690, 470, 560),
    ("neck", "body", 1540, 830, 1640, 560), ("head", "neck", 1640, 540, 2070, 525),
    ("jaw", "head", 1700, 610, 2020, 610), ("crest1", "head", 1700, 430, 1660, 230),
    ("crest2", "neck", 1480, 640, 1400, 450), ("crest3", "body", 1150, 760, 1100, 650),
    ("legFN", "body", 1430, 980, 1480, 1240), ("legFF", "body", 1660, 980, 1800, 1220),
    ("legBN", "body", 990, 1000, 930, 1250), ("legBF", "body", 1160, 1060, 1250, 1220),
]
EXTRA = [("eye", "head", 1800, 470), ("brow", "head", 1800, 420), ("horn", "head", 1650, 430), ("prop", "body", 1600, 900)]
FLAMES = {"crest1", "crest2", "crest3"}
NOSKIN = {"root", "jaw"}

src = Image.open(os.path.join(U, "chispin_side_raw.png")).convert("RGBA")
W, H = src.size
k = W / 2576
px = src.load()
alpha = src.getchannel("A")
bbox = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
top, bottom = bbox[1], bbox[3]
s = 122 / (bottom - top)  # source px → rig units (creature 122 u tall: reads like the vector form, which is longer)
P = lambda x, y: (x * k, y * k)
pos = {b[0]: P(b[2], b[3]) for b in LAYOUT}
end = {b[0]: P(b[4], b[5]) for b in LAYOUT}
for e in EXTRA: pos[e[0]] = P(e[2], e[3])
root = pos["root"]
U_ = lambda p: ((p[0] - root[0]) * s, (p[1] - root[1]) * s)  # rig units, origin at the root (ground)

def is_flame(c):
    h, sat, v = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
    return 8 <= h * 360 <= 60 and sat > 0.45 and v > 0.6

segs = [(b[0], pos[b[0]], end[b[0]]) for b in LAYOUT if b[0] not in NOSKIN]
def weights(p, on_flame):
    cand = [sg for sg in segs if ((sg[0] in FLAMES or sg[0] in ("tail4", "tail3")) if on_flame else sg[0] not in FLAMES)]
    out = []
    for bid, a, e in cand:
        ab = (e[0] - a[0], e[1] - a[1]); L = ab[0] ** 2 + ab[1] ** 2
        t = max(0, min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / L))
        d = math.hypot(a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1])
        out.append((bid, 1 / (d * d + 40 * 40) ** 2))
    out.sort(key=lambda x: -x[1]); out = out[:3]
    tot = sum(w for _, w in out)
    return [(b, w / tot) for b, w in out]

cw, ch = math.ceil(W / CELL), math.ceil(H / CELL)
used = [[False] * ch for _ in range(cw)]
for cy in range(ch):
    for cx in range(cw):
        x0, y0 = cx * CELL, cy * CELL
        used[cx][cy] = any(px[x, y][3] > 8 for y in range(y0, min(H, y0 + CELL), 3) for x in range(x0, min(W, x0 + CELL), 3))

order = ["root", "body", "legBF", "legFF", "tail1", "tail2", "tail3", "tail4", "crest3", "neck", "crest2", "head", "jaw", "crest1", "horn", "eye", "brow", "legBN", "legFN", "prop"]
idx = {b: i for i, b in enumerate(order)}
verts, uvs, wts, vi, tris = [], [], [], {}, []
def V(gx, gy):
    if (gx, gy) in vi: return vi[(gx, gy)]
    p = (min(gx * CELL, W), min(gy * CELL, H))
    sx, sy = min(int(p[0]), W - 1), min(int(p[1]), H - 1)
    flame = solid = 0
    for dy in range(-6, 7, 3):
        for dx in range(-6, 7, 3):
            c = px[max(0, min(W - 1, sx + dx)), max(0, min(H - 1, sy + dy))]
            if c[3] < 30: continue
            solid += 1; flame += is_flame(c)
    w = weights(p, solid > 0 and flame * 2 > solid)
    verts.append([round(v, 2) for v in U_(p)]); uvs.append([round(p[0] * SCALE, 1), round(p[1] * SCALE, 1)])
    wts.append([[idx[b], round(x, 4)] for b, x in w])
    vi[(gx, gy)] = len(verts) - 1
    return vi[(gx, gy)]
for cy in range(ch):
    for cx in range(cw):
        if not used[cx][cy]: continue
        a, b, c, d = V(cx, cy), V(cx + 1, cy), V(cx + 1, cy + 1), V(cx, cy + 1)
        tris += [a, c, b, a, d, c]

parent = {b[0]: b[1] for b in LAYOUT}; parent.update({e[0]: e[1] for e in EXTRA})
bones = []
for b in order:
    pr = parent[b]
    p = U_(pos[b]); q = U_(pos[pr]) if pr else (0, 0)
    bones.append({"id": b, "parent": pr, "x": round(p[0] - q[0], 2), "y": round(p[1] - q[1], 2)})

# Closed-eyes patch: centre (1800, 470)·k, size 2·(150, 105)·k.
eye = Image.open(os.path.join(U, "chispin_eyes_closed.png")).convert("RGBA")
ec = U_(P(1800, 470)); esz = (eye.size[0] * s, eye.size[1] * s)

os.makedirs(OUT_IMG, exist_ok=True)
src.resize((round(W * SCALE), round(H * SCALE)), Image.LANCZOS).save(os.path.join(OUT_IMG, "chispin_painted.webp"), "WEBP", quality=90, method=6)
eye.resize((round(eye.size[0] * SCALE), round(eye.size[1] * SCALE)), Image.LANCZOS).save(os.path.join(OUT_IMG, "chispin_eyes_closed.webp"), "WEBP", quality=92, method=6)

data = {
    "texture": {"w": round(W * SCALE), "h": round(H * SCALE)},
    "bones": bones, "vertices": verts, "uvs": uvs, "weights": wts, "triangles": tris,
    "eyesClosed": {"center": [round(ec[0], 2), round(ec[1], 2)], "size": [round(esz[0], 2), round(esz[1], 2)], "texture": [round(eye.size[0] * SCALE), round(eye.size[1] * SCALE)]},
    "crestTip": [round(v, 2) for v in U_(end["crest1"])],
}
with open(OUT_TS, "w") as f:
    f.write("// GENERATED by tools/gen_painted_chispin.py from the Unity painted Chispín — do not edit by hand.\n")
    f.write("export const CHISPIN_PAINTED = " + json.dumps(data, separators=(",", ":")) + " as const;\n")
print(len(verts), "vertices", len(tris) // 3, "triangles", "scale", round(s, 4))
