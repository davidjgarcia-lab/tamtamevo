using System.Collections.Generic;
using System.IO;
using System.Linq;
using TamTam.Evolution;
using UnityEditor;
using UnityEditor.U2D.Sprites;
using UnityEngine;
using UnityEngine.U2D;

namespace TamTam.EditorTools.Animation
{
    /// Automatic 2D Animation rig (bones + grid mesh + weights) for the user's painted single-piece creatures.
    /// The art is not modified: only the sprite's skinning data. Bones are placed from the silhouette (and the starter's
    /// eye from catalog.json): body, head, a 3-bone tail when there is mass behind the body, front/back legs for
    /// walkers, a wing bone for flyers. Weights are region-gated so legs never pull the back and the head never pulls
    /// the tail. Anatomy-specific rigs (tentacles, separate wings, shell plates) need layered art: PROVISIONAL.
    public static class PuppetRigBuilder
    {
        public struct Profile { public bool legs, wings, tail; public Vector2? eye; }

        static readonly Dictionary<string, (string gait, bool flap)> FinalGaits = new Dictionary<string, (string, bool)>();

        public static Profile ProfileFor(string spriteName, CatalogJson cat)
        {
            var p = new Profile { legs = true, tail = true };
            var starter = cat?.starters?.FirstOrDefault(s => s.art == spriteName);
            MotionJson m = starter?.motion;
            if (m == null && cat?.motions != null)
            {
                var parts = spriteName.Split('_');
                m = cat.motions.FirstOrDefault(x => x.family == parts[0] && x.stage == parts[1])?.motion;
            }
            if (m != null)
            {
                p.legs = m.gait == "walk" || m.gait == "dash" || m.gait == "heavy";
                p.wings = m.flap > 0 || m.gait == "fly";
            }
            if (starter?.eye != null && starter.eye.r > 0) p.eye = new Vector2(starter.eye.x, starter.eye.y);
            return p;
        }

        public static void Rig(string png, TextureImporter ti, Profile prof)
        {
            var tex = new Texture2D(2, 2); tex.LoadImage(File.ReadAllBytes(png));
            int W = tex.width, H = tex.height; var px = tex.GetPixels32();
            Object.DestroyImmediate(tex);
            bool Solid(int x, int y) => x >= 0 && y >= 0 && x < W && y < H && px[y * W + x].a > 96;

            // Silhouette measurements (texture space, y up).
            int x0 = W, x1 = 0, y0 = H, y1 = 0; long n = 0; double cx = 0, cy = 0;
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) if (Solid(x, y)) { x0 = Mathf.Min(x0, x); x1 = Mathf.Max(x1, x); y0 = Mathf.Min(y0, y); y1 = Mathf.Max(y1, y); cx += x; cy += y; n++; }
            if (n == 0) return;
            float w = x1 - x0, h = y1 - y0;
            Vector2 Centroid(System.Func<int, int, bool> region)
            {
                double sx = 0, sy = 0; long c = 0;
                for (int y = y0; y <= y1; y += 2) for (int x = x0; x <= x1; x += 2) if (Solid(x, y) && region(x, y)) { sx += x; sy += y; c++; }
                return c > 0 ? new Vector2((float)(sx / c), (float)(sy / c)) : new Vector2(float.NaN, float.NaN);
            }
            long Mass(System.Func<int, int, bool> region) { long c = 0; for (int y = y0; y <= y1; y += 2) for (int x = x0; x <= x1; x += 2) if (Solid(x, y) && region(x, y)) c++; return c; }

            var body = Centroid((x, y) => x > x0 + 0.3f * w && x < x0 + 0.7f * w);
            if (float.IsNaN(body.x)) body = new Vector2((float)(cx / n), (float)(cy / n));
            Vector2 head = prof.eye.HasValue
                ? new Vector2(prof.eye.Value.x * W, (1 - prof.eye.Value.y) * H)
                : Centroid((x, y) => x > x0 + 0.62f * w && y > y0 + 0.5f * h);
            if (float.IsNaN(head.x)) head = new Vector2(x0 + 0.8f * w, y0 + 0.75f * h);
            long total = Mass((x, y) => true);
            bool hasTail = prof.tail && Mass((x, y) => x < x0 + 0.2f * w) > total * 0.03f;
            var tailTip = Centroid((x, y) => x < x0 + 0.16f * w);
            var neck = Vector2.Lerp(body, head, 0.45f);

            var bones = new List<(string name, string parent, Vector2 a, Vector2 b)>();
            var root = new Vector2(x0 + w * 0.5f, y0);
            bones.Add(("root", null, root, root + Vector2.right * 8));
            bones.Add(("body", "root", body - new Vector2(0.18f * w, 0), body + new Vector2(0.18f * w, 0)));
            bones.Add(("head", "body", neck, head + (head - neck) * 0.4f));
            if (hasTail && !float.IsNaN(tailTip.x))
            {
                var t0 = body - new Vector2(0.2f * w, 0);
                for (int i = 0; i < 3; i++)
                    bones.Add(($"tail{i + 1}", i == 0 ? "body" : $"tail{i}", Vector2.Lerp(t0, tailTip, i / 3f), Vector2.Lerp(t0, tailTip, (i + 1) / 3f)));
            }
            if (prof.legs)
            {
                bones.Add(("legF", "body", new Vector2(x0 + 0.64f * w, y0 + 0.3f * h), new Vector2(x0 + 0.66f * w, y0)));
                bones.Add(("legB", "body", new Vector2(x0 + 0.36f * w, y0 + 0.3f * h), new Vector2(x0 + 0.34f * w, y0)));
            }
            if (prof.wings)
            {
                var wingTip = Centroid((x, y) => y > y0 + 0.78f * h && x > x0 + 0.15f * w && x < x0 + 0.62f * w);
                if (!float.IsNaN(wingTip.x)) bones.Add(("wing", "body", new Vector2(x0 + 0.48f * w, y0 + 0.62f * h), wingTip));
            }

            // SpriteBone data: root in rect pixels; children relative to parent frame (rotation along the bone).
            var ang = bones.ToDictionary(b => b.name, b => { var d = b.b - b.a; return Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg; });
            var pos = bones.ToDictionary(b => b.name, b => b.a);
            var index = bones.Select((b, i) => (b.name, i)).ToDictionary(t => t.name, t => t.i);
            var spriteBones = bones.Select(b =>
            {
                int parent = b.parent == null ? -1 : index[b.parent];
                Vector3 p; Quaternion r;
                if (parent < 0) { p = b.a; r = Quaternion.Euler(0, 0, ang[b.name]); }
                else { p = Quaternion.Euler(0, 0, -ang[b.parent]) * (b.a - pos[b.parent]); r = Quaternion.Euler(0, 0, ang[b.name] - ang[b.parent]); }
                return new SpriteBone { name = b.name, guid = GUID.Generate().ToString(), parentId = parent, position = p, rotation = r, length = Mathf.Max(1, (b.b - b.a).magnitude) };
            }).ToList();

            // Grid mesh over the silhouette and region-gated weights.
            const int cell = 18;
            int cw = Mathf.CeilToInt(W / (float)cell), ch = Mathf.CeilToInt(H / (float)cell);
            var used = new bool[cw, ch];
            for (int gy = 0; gy < ch; gy++) for (int gx = 0; gx < cw; gx++)
            {
                bool any = false;
                for (int y = gy * cell; y < Mathf.Min(H, (gy + 1) * cell) && !any; y += 2)
                    for (int x = gx * cell; x < Mathf.Min(W, (gx + 1) * cell); x += 2) if (px[y * W + x].a > 6) { any = true; break; }
                used[gx, gy] = any;
            }
            bool Allowed(string bone, Vector2 p) => bone switch
            {
                "head" => p.x > neck.x - 0.04f * w && p.y > y0 + 0.38f * h,
                "legF" or "legB" => p.y < y0 + 0.34f * h,
                "wing" => p.y > y0 + 0.58f * h && p.x < neck.x,
                _ when bone.StartsWith("tail") => p.x < body.x - 0.12f * w,
                "root" => false,
                _ => true,
            };
            BoneWeight Weigh(Vector2 p)
            {
                var cand = bones.Where(b => Allowed(b.name, p)).Select(b =>
                {
                    var ab = b.b - b.a; float t = Mathf.Clamp01(Vector2.Dot(p - b.a, ab) / Mathf.Max(1, ab.sqrMagnitude));
                    float d = (b.a + ab * t - p).magnitude; float s = 0.12f * Mathf.Max(w, h);
                    return (b.name, wgt: 1f / Mathf.Pow(d * d + s * s, 2));
                }).OrderByDescending(x => x.wgt).Take(3).ToArray();
                float sum = cand.Sum(c => c.wgt);
                var bw = new BoneWeight { boneIndex0 = index[cand[0].name], weight0 = cand[0].wgt / sum };
                if (cand.Length > 1) { bw.boneIndex1 = index[cand[1].name]; bw.weight1 = cand[1].wgt / sum; }
                if (cand.Length > 2) { bw.boneIndex2 = index[cand[2].name]; bw.weight2 = cand[2].wgt / sum; }
                return bw;
            }
            var verts = new List<Vertex2DMetaData>(); var vi = new Dictionary<Vector2Int, int>();
            int V(int gx, int gy)
            {
                var k = new Vector2Int(gx, gy);
                if (vi.TryGetValue(k, out int id)) return id;
                var p = new Vector2(Mathf.Min(gx * cell, W), Mathf.Min(gy * cell, H));
                verts.Add(new Vertex2DMetaData { position = p, boneWeight = Weigh(p) });
                vi[k] = verts.Count - 1; return verts.Count - 1;
            }
            var tris = new List<int>(); var edges = new Dictionary<(int, int), int>();
            void E(int a, int b) { var k = a < b ? (a, b) : (b, a); edges[k] = edges.TryGetValue(k, out int c) ? c + 1 : 1; }
            for (int gy = 0; gy < ch; gy++) for (int gx = 0; gx < cw; gx++)
            {
                if (!used[gx, gy]) continue;
                int a = V(gx, gy), b = V(gx + 1, gy), c = V(gx + 1, gy + 1), d = V(gx, gy + 1);
                tris.AddRange(new[] { a, c, b, a, d, c }); E(a, b); E(b, c); E(c, d); E(d, a);
            }

            var factory = new SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti);
            dp.InitSpriteEditorDataProvider();
            var guid = dp.GetSpriteRects()[0].spriteID;
            dp.GetDataProvider<ISpriteBoneDataProvider>().SetBones(guid, spriteBones);
            var mp = dp.GetDataProvider<ISpriteMeshDataProvider>();
            mp.SetVertices(guid, verts.ToArray()); mp.SetIndices(guid, tris.ToArray());
            mp.SetEdges(guid, edges.Where(e => e.Value == 1).Select(e => new Vector2Int(e.Key.Item1, e.Key.Item2)).ToArray());
            dp.Apply();
            ti.SaveAndReimport();
        }
    }
}
