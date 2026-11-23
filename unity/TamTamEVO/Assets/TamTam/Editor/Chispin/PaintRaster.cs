using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using UnityEngine;

namespace TamTam.EditorTools.Chispin
{
    /// Palette derivation in OKLCH — port of packages/rig/src/palette.ts (derivePalette).
    public static class PaletteMath
    {
        static float ToLin(float c) => c <= 0.04045f ? c / 12.92f : Mathf.Pow((c + 0.055f) / 1.055f, 2.4f);
        static float ToSrgb(float c) => c <= 0.0031308f ? 12.92f * c : 1.055f * Mathf.Pow(c, 1 / 2.4f) - 0.055f;

        public static Color Hex(string h) => ColorUtility.TryParseHtmlString(h, out var c) ? c : Color.magenta;

        static Vector3 ToOklch(Color c)
        {
            float r = ToLin(c.r), g = ToLin(c.g), b = ToLin(c.b);
            float l = Cbrt(0.4122214708f * r + 0.5363325363f * g + 0.0514459929f * b);
            float m = Cbrt(0.2119034982f * r + 0.6806995451f * g + 0.1073969566f * b);
            float s = Cbrt(0.0883024619f * r + 0.2817188376f * g + 0.6299787005f * b);
            float L = 0.2104542553f * l + 0.793617785f * m - 0.0040720468f * s;
            float A = 1.9779984951f * l - 2.428592205f * m + 0.4505937099f * s;
            float B = 0.0259040371f * l + 0.7827717662f * m - 0.808675766f * s;
            return new Vector3(L, Mathf.Sqrt(A * A + B * B), Mathf.Atan2(B, A) * Mathf.Rad2Deg);
        }

        static float Cbrt(float v) => Mathf.Sign(v) * Mathf.Pow(Mathf.Abs(v), 1f / 3f);

        static Color FromOklch(Vector3 lch)
        {
            float h = lch.z * Mathf.Deg2Rad;
            for (float c = lch.y; c >= 0; c -= 0.005f)
            {
                float A = c * Mathf.Cos(h), B = c * Mathf.Sin(h), L = lch.x;
                float l = Mathf.Pow(L + 0.3963377774f * A + 0.2158037573f * B, 3);
                float m = Mathf.Pow(L - 0.1055613458f * A - 0.0638541728f * B, 3);
                float s = Mathf.Pow(L - 0.0894841775f * A - 1.291485548f * B, 3);
                float r = 4.0767416621f * l - 3.3077115913f * m + 0.2309699292f * s;
                float g = -1.2684380046f * l + 2.6097574011f * m - 0.3413193965f * s;
                float b = -0.0041960863f * l - 0.7034186147f * m + 1.707614701f * s;
                if (r >= -0.0005f && r <= 1.0005f && g >= -0.0005f && g <= 1.0005f && b >= -0.0005f && b <= 1.0005f)
                    return new Color(ToSrgb(Mathf.Clamp01(r)), ToSrgb(Mathf.Clamp01(g)), ToSrgb(Mathf.Clamp01(b)), 1);
            }
            return new Color(lch.x, lch.x, lch.x, 1);
        }

        static Color Shift(Color c, float dL, float cMul, float dH = 0)
        {
            var v = ToOklch(c);
            return FromOklch(new Vector3(Mathf.Clamp(v.x + dL, 0.05f, 0.98f), v.y * cMul, v.z + dH));
        }

        /// Palette tokens → (colour, tint family). Family: 0 none, 1 base, 2 accent, 3 glow.
        public static Dictionary<string, (Color c, int fam)> Derive(string bas, string accent, string eye, string glow)
        {
            Color b = Hex(bas), a = Hex(accent);
            return new Dictionary<string, (Color, int)>
            {
                { "base", (b, 1) }, { "baseLight", (Shift(b, 0.09f, 0.85f, -6), 1) }, { "baseShade", (Shift(b, -0.13f, 1.05f, 10), 1) },
                { "ink", (Shift(b, -0.45f, 0.6f, 12), 1) },
                { "accent", (a, 2) }, { "accentLight", (Shift(a, 0.08f, 0.8f, -4), 2) }, { "accentShade", (Shift(a, -0.12f, 1.05f, 8), 2) },
                { "eye", (Hex(eye), 2) }, { "glow", (Hex(glow), 3) },
            };
        }
    }

    /// Flattened SVG path (absolute M L C Q A Z, as used by the rig) → polylines in rig units.
    public class FlatPath
    {
        public readonly List<List<Vector2>> subpaths = new List<List<Vector2>>();
        public readonly List<bool> closed = new List<bool>();
        public Rect bounds;

        static readonly Regex Tok = new Regex(@"[MLCQAZmlcqaz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", RegexOptions.Compiled);

        public static FlatPath Parse(string d)
        {
            var p = new FlatPath();
            var toks = new List<string>();
            foreach (Match m in Tok.Matches(d)) toks.Add(m.Value);
            int i = 0; char cmd = 'M';
            List<Vector2> cur = null; Vector2 pos = Vector2.zero, start = Vector2.zero;
            float N() => float.Parse(toks[i++], CultureInfo.InvariantCulture);
            bool IsCmd(string s) => s.Length == 1 && char.IsLetter(s[0]);
            while (i < toks.Count)
            {
                if (IsCmd(toks[i])) cmd = toks[i++][0];
                switch (cmd)
                {
                    case 'M':
                        cur = new List<Vector2>(); p.subpaths.Add(cur); p.closed.Add(false);
                        pos = start = new Vector2(N(), N()); cur.Add(pos); cmd = 'L'; break;
                    case 'L': pos = new Vector2(N(), N()); cur.Add(pos); break;
                    case 'C':
                    {
                        Vector2 c1 = new Vector2(N(), N()), c2 = new Vector2(N(), N()), e = new Vector2(N(), N());
                        for (int k = 1; k <= 16; k++) { float t = k / 16f, u = 1 - t; cur.Add(u * u * u * pos + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * e); }
                        pos = e; break;
                    }
                    case 'Q':
                    {
                        Vector2 c1 = new Vector2(N(), N()), e = new Vector2(N(), N());
                        for (int k = 1; k <= 12; k++) { float t = k / 12f, u = 1 - t; cur.Add(u * u * pos + 2 * u * t * c1 + t * t * e); }
                        pos = e; break;
                    }
                    case 'A':
                    {
                        float rx = N(), ry = N(), rotDeg = N(); bool large = N() != 0, sweep = N() != 0; var e = new Vector2(N(), N());
                        Arc(cur, pos, e, rx, ry, rotDeg, large, sweep); pos = e; break;
                    }
                    case 'Z': case 'z':
                        p.closed[p.closed.Count - 1] = true; pos = start; cmd = 'M';
                        if (i < toks.Count && !IsCmd(toks[i])) throw new FormatException("Numbers after Z");
                        break;
                    default: throw new FormatException($"Unsupported path command {cmd}");
                }
            }
            float x0 = float.MaxValue, y0 = float.MaxValue, x1 = float.MinValue, y1 = float.MinValue;
            foreach (var sp in p.subpaths) foreach (var v in sp) { x0 = Mathf.Min(x0, v.x); y0 = Mathf.Min(y0, v.y); x1 = Mathf.Max(x1, v.x); y1 = Mathf.Max(y1, v.y); }
            p.bounds = Rect.MinMaxRect(x0, y0, x1, y1);
            return p;
        }

        // SVG endpoint arc → centre parameterisation (SVG 1.1 F.6.5).
        static void Arc(List<Vector2> o, Vector2 p0, Vector2 p1, float rx, float ry, float phiDeg, bool large, bool sweep)
        {
            float phi = phiDeg * Mathf.Deg2Rad, cs = Mathf.Cos(phi), sn = Mathf.Sin(phi);
            Vector2 d = (p0 - p1) / 2;
            float x1p = cs * d.x + sn * d.y, y1p = -sn * d.x + cs * d.y;
            rx = Mathf.Abs(rx); ry = Mathf.Abs(ry);
            float lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
            if (lam > 1) { float s = Mathf.Sqrt(lam); rx *= s; ry *= s; }
            float num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
            float den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
            float co = Mathf.Sqrt(Mathf.Max(0, num / den)) * (large == sweep ? -1 : 1);
            float cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
            Vector2 c = new Vector2(cs * cxp - sn * cyp + (p0.x + p1.x) / 2, sn * cxp + cs * cyp + (p0.y + p1.y) / 2);
            float Ang(Vector2 u, Vector2 v) { float a = Mathf.Atan2(u.x * v.y - u.y * v.x, Vector2.Dot(u, v)); return a; }
            var v1 = new Vector2((x1p - cxp) / rx, (y1p - cyp) / ry);
            var v2 = new Vector2((-x1p - cxp) / rx, (-y1p - cyp) / ry);
            float th1 = Ang(Vector2.right, v1), dth = Ang(v1, v2);
            if (!sweep && dth > 0) dth -= 2 * Mathf.PI; else if (sweep && dth < 0) dth += 2 * Mathf.PI;
            int n = Mathf.Max(8, Mathf.CeilToInt(Mathf.Abs(dth) / (Mathf.PI / 24)));
            for (int k = 1; k <= n; k++)
            {
                float t = th1 + dth * k / n;
                float ex = rx * Mathf.Cos(t), ey = ry * Mathf.Sin(t);
                o.Add(new Vector2(cs * ex - sn * ey + c.x, sn * ex + cs * ey + c.y));
            }
        }
    }

    /// A layer canvas in rig units (y down) rendered to pixels (y up for Unity textures).
    public class Canvas
    {
        public readonly int w, h; public readonly float ppu; public readonly float minX, maxY;
        public readonly Color[] col;   // straight colour (sRGB) + alpha
        public readonly Color[] mask;  // R base, G accent, B emissive, A glow

        public Canvas(Rect rigBounds, float pxPerUnit)
        {
            ppu = pxPerUnit; minX = rigBounds.xMin; maxY = rigBounds.yMax;
            w = Mathf.Max(4, Mathf.CeilToInt(rigBounds.width * ppu)); h = Mathf.Max(4, Mathf.CeilToInt(rigBounds.height * ppu));
            col = new Color[w * h]; mask = new Color[w * h];
        }

        public Vector2 PixelToRig(float px, float py) => new Vector2(minX + px / ppu, maxY - py / ppu);
        public Vector2 RigToPixel(Vector2 r) => new Vector2((r.x - minX) * ppu, (maxY - r.y) * ppu);

        /// Composites one part (already transformed into this canvas' rig space).
        public void Paint(PartDef part, List<List<Vector2>> polys, List<bool> closed, Dictionary<string, (Color c, int fam)> pal, float strokeScale)
        {
            float bx0 = float.MaxValue, by0 = float.MaxValue, bx1 = float.MinValue, by1 = float.MinValue;
            foreach (var pl in polys) foreach (var v in pl) { bx0 = Mathf.Min(bx0, v.x); by0 = Mathf.Min(by0, v.y); bx1 = Mathf.Max(bx1, v.x); by1 = Mathf.Max(by1, v.y); }
            var rb = Rect.MinMaxRect(bx0, by0, bx1, by1);
            if (part.fill != null) Composite(FillCoverage(polys), part.fill, part, pal, rb);
            if (part.stroke != null) Composite(StrokeCoverage(polys, closed, part.strokeWidth * strokeScale), part.stroke, part, pal, rb);
        }

        float[] FillCoverage(List<List<Vector2>> polys)
        {
            var cov = new float[w * h];
            const int SS = 4;
            var xs = new List<(float x, int dir)>();
            var pix = new List<List<Vector2>>();
            foreach (var poly in polys) { var l = new List<Vector2>(poly.Count); foreach (var p in poly) l.Add(RigToPixel(p)); pix.Add(l); }
            for (int sy = 0; sy < h * SS; sy++)
            {
                float y = (sy + 0.5f) / SS;
                xs.Clear();
                foreach (var poly in pix)
                    for (int k = 0; k < poly.Count; k++)
                    {
                        Vector2 a = poly[k], b = poly[(k + 1) % poly.Count];
                        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y))
                            xs.Add((a.x + (y - a.y) / (b.y - a.y) * (b.x - a.x), b.y > a.y ? 1 : -1));
                    }
                if (xs.Count < 2) continue;
                xs.Sort((p, q) => p.x.CompareTo(q.x));
                int wind = 0; int row = sy / SS;
                for (int k = 0; k < xs.Count - 1; k++)
                {
                    wind += xs[k].dir;
                    if (wind == 0) continue;
                    float x0 = xs[k].x, x1 = xs[k + 1].x;
                    int s0 = Mathf.Max(0, Mathf.CeilToInt(x0 * SS - 0.5f)), s1 = Mathf.Min(w * SS - 1, Mathf.FloorToInt(x1 * SS - 0.5f));
                    for (int s = s0; s <= s1; s++) cov[row * w + s / SS] += 1f / (SS * SS);
                }
            }
            return cov;
        }

        float[] StrokeCoverage(List<List<Vector2>> polys, List<bool> closed, float width)
        {
            var cov = new float[w * h];
            float half = width * ppu / 2;
            for (int pi = 0; pi < polys.Count; pi++)
            {
                var poly = polys[pi]; int n = poly.Count; int segs = closed[pi] ? n : n - 1;
                for (int k = 0; k < segs; k++)
                {
                    Vector2 a = RigToPixel(poly[k]), b = RigToPixel(poly[(k + 1) % n]);
                    int x0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(a.x, b.x) - half - 2)), x1 = Mathf.Min(w - 1, Mathf.CeilToInt(Mathf.Max(a.x, b.x) + half + 2));
                    int y0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(a.y, b.y) - half - 2)), y1 = Mathf.Min(h - 1, Mathf.CeilToInt(Mathf.Max(a.y, b.y) + half + 2));
                    Vector2 ab = b - a; float len2 = Mathf.Max(1e-6f, ab.sqrMagnitude);
                    for (int y = y0; y <= y1; y++)
                        for (int x = x0; x <= x1; x++)
                        {
                            var p = new Vector2(x + 0.5f, y + 0.5f);
                            float t = Mathf.Clamp01(Vector2.Dot(p - a, ab) / len2);
                            float dist = (a + ab * t - p).magnitude;
                            float c = Mathf.Clamp01(half - dist + 0.5f);
                            int i = y * w + x; if (c > cov[i]) cov[i] = c;
                        }
                }
            }
            return cov;
        }

        static void BoxBlur(float[] a, int w, int h, int r)
        {
            if (r < 1) return;
            var tmp = new float[a.Length];
            for (int y = 0; y < h; y++)
            {
                float acc = 0; int cnt = 0;
                for (int x = -r; x < w + r; x++)
                {
                    if (x + r < w && x + r >= 0) { acc += a[y * w + x + r]; cnt++; }
                    if (x - r - 1 >= 0) { acc -= a[y * w + x - r - 1]; cnt--; }
                    if (x >= 0 && x < w) tmp[y * w + x] = acc / (2 * r + 1);
                }
            }
            for (int x = 0; x < w; x++)
            {
                float acc = 0;
                for (int y = -r; y < h + r; y++)
                {
                    if (y + r < h && y + r >= 0) acc += tmp[(y + r) * w + x];
                    if (y - r - 1 >= 0) acc -= tmp[(y - r - 1) * w + x];
                    if (y >= 0 && y < h) a[y * w + x] = acc / (2 * r + 1);
                }
            }
        }

        (Color c, int fam) Resolve(string stop, Dictionary<string, (Color c, int fam)> pal) =>
            stop.StartsWith("#") ? (PaletteMath.Hex(stop), 0) : pal[stop];

        void Composite(float[] cov, Paint paint, PartDef part, Dictionary<string, (Color c, int fam)> pal, Rect rb)
        {
            for (int k = 0; k < cov.Length; k++) cov[k] = Mathf.Min(1, cov[k]);
            if (part.blur > 0) { int r = Mathf.Max(1, Mathf.RoundToInt(part.blur * ppu * 0.6f)); BoxBlur(cov, w, h, r); BoxBlur(cov, w, h, r); BoxBlur(cov, w, h, r); }
            Vector2 gFrom = new Vector2(paint.fx, paint.fy), gTo = new Vector2(paint.tx, paint.ty), gd = gTo - gFrom;
            float gl2 = Mathf.Max(1e-5f, gd.sqrMagnitude);
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                {
                    int i = y * w + x; float a = cov[i];
                    if (a <= 0.002f) continue;
                    var rp = PixelToRig(x + 0.5f, y + 0.5f);
                    Color c; int fam;
                    if (paint.gradient != null)
                    {
                        float t = Mathf.Clamp01(Vector2.Dot(rp - gFrom, gd) / gl2) * (paint.gradient.Length - 1);
                        int s = Mathf.Min(paint.gradient.Length - 2, Mathf.FloorToInt(t));
                        var c0 = Resolve(paint.gradient[s], pal); var c1 = Resolve(paint.gradient[s + 1], pal);
                        float u = t - s; u = u * u * (3 - 2 * u);
                        c = Color.Lerp(c0.c, c1.c, u); fam = c0.fam != 0 ? c0.fam : c1.fam;
                    }
                    else if (paint.token != null) (c, fam) = pal[paint.token];
                    else (c, fam) = (PaletteMath.Hex(paint.hex), 0);

                    // Painterly treatment: soft form shading toward the lower edge, top sheen, and a brush grain.
                    if (part.fill == paint && rb.height > 0)
                    {
                        float v = Mathf.Clamp01((rp.y - rb.yMin) / rb.height);
                        float shade = Mathf.Lerp(1.06f, 0.86f, v * v);
                        if (part.sheen) shade += 0.16f * Mathf.Exp(-Mathf.Pow((v - 0.18f) / 0.12f, 2));
                        float grain = Grain(rp.x, rp.y);
                        c = new Color(c.r * shade * grain, c.g * shade * grain, c.b * shade * grain, 1);
                    }
                    a *= paint.alpha;
                    var mk = new Color(fam == 1 ? 1 : 0, fam == 2 ? 1 : 0, part.emissive ? (part.blur > 0 ? 0.3f : 1) : 0, fam == 3 ? 1 : 0);
                    var dst = col[i];
                    float outA = a + dst.a * (1 - a);
                    if (outA > 0)
                    {
                        float k1 = a / outA, k0 = dst.a * (1 - a) / outA;
                        col[i] = new Color(c.r * k1 + dst.r * k0, c.g * k1 + dst.g * k0, c.b * k1 + dst.b * k0, outA);
                        mask[i] = mk * k1 + mask[i] * k0;
                    }
                }
        }

        // Two octaves of value noise along a diagonal "brush" direction: subtle (±4%).
        static float Grain(float x, float y)
        {
            float u = x * 0.9f + y * 0.35f, v = y * 1.6f - x * 0.2f;
            float n = Mathf.PerlinNoise(u * 0.55f + 17.3f, v * 0.55f + 3.1f) * 0.65f + Mathf.PerlinNoise(u * 2.1f + 5.7f, v * 2.1f + 9.2f) * 0.35f;
            return 0.96f + 0.08f * n;
        }

        public Texture2D ToTexture(bool maskTex)
        {
            var t = new Texture2D(w, h, TextureFormat.RGBA32, false, maskTex);
            if (maskTex) t.SetPixels(mask);
            else
            {
                // Bleed colour into transparent pixels so bilinear filtering never shows dark fringes.
                var o = new Color[col.Length];
                for (int i = 0; i < col.Length; i++) o[i] = col[i];
                for (int pass = 0; pass < 4; pass++)
                    for (int y = 0; y < h; y++)
                        for (int x = 0; x < w; x++)
                        {
                            int i = y * w + x; if (o[i].a > 0.01f || (o[i].r + o[i].g + o[i].b) > 0) continue;
                            Color acc = default; int n = 0;
                            for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++)
                            {
                                int xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
                                var q = o[yy * w + xx]; if (q.r + q.g + q.b > 0) { acc += q; n++; }
                            }
                            if (n > 0) o[i] = new Color(acc.r / n, acc.g / n, acc.b / n, 0);
                        }
                t.SetPixels(o);
            }
            t.Apply();
            return t;
        }
    }
}
