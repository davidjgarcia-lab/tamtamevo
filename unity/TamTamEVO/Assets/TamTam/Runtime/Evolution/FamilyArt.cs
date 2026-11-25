using System;
using System.Collections.Generic;
using System.Linq;
using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Painted art of the 10 families × 3 stages (TamTam EVO art sheets, 2026-11-24), imported by
    /// TamTam ▸ Evoluciones ▸ 0 · Importar arte pintado de familias.
    [CreateAssetMenu(menuName = "TamTam/Family Art")]
    public class FamilyArt : ScriptableObject
    {
        [Serializable] public class Entry { public Family family; public string stage; public Sprite sprite; }
        public List<Entry> entries = new List<Entry>();
        [Tooltip("TamTam/CreatureLit with ground contact occlusion: lit by 2D lights, darker where the feet meet the floor.")]
        public Material material;

        /// Builds a painted Tamtam: sprite (pivot at the feet), procedural animation and contact shadow + AO.
        public PaintedCreature Spawn(Sprite sprite, Transform parent, string name)
        {
            var root = new GameObject(name);
            root.transform.SetParent(parent, false);
            var sr = new GameObject("sprite").AddComponent<SpriteRenderer>();
            sr.transform.SetParent(root.transform, false);
            sr.sprite = sprite;
            if (material) sr.sharedMaterial = material;
            var pc = root.AddComponent<PaintedCreature>();
            pc.body = sr;
            var gs = root.AddComponent<GroundShadow>();
            gs.target = sr; gs.lift = sr.transform;
            return pc;
        }

        /// Tamtam stage → art stage (babies are the painted starters).
        public static string ArtStage(string stage) => stage switch { "child" => "initial", "juvenile" => "intermediate", "adult" => "final", _ => "baby" };

        /// Family that shows: most parts, ties to the back part (mirror of dominantFamily in the web app).
        public static Family Dominant(Genome g)
        {
            var n = new Dictionary<Family, float>();
            foreach (var s in Genetics.Slots) { n.TryGetValue(g[s], out var v); n[g[s]] = v + (s == PartSlot.back ? 1.1f : 1f); }
            return n.OrderByDescending(kv => kv.Value).First().Key;
        }

        /// Evolution line (mirror of nextLine in packages/core/src/genetics/physics.ts): keep the previous line unless
        /// another family has more parts than it and at least 3 of the 5.
        public static Family NextLine(Family prev, Genome g)
        {
            var c = new Dictionary<Family, int>();
            foreach (var s in Genetics.Slots) { c.TryGetValue(g[s], out var v); c[g[s]] = v + 1; }
            c.TryGetValue(prev, out var bn); var best = prev;
            foreach (var kv in c) if (kv.Value > bn && kv.Value >= 3) { best = kv.Key; bn = kv.Value; }
            return best;
        }

        /// Second family with 2+ parts (shown as an aura), if any.
        public static Family? Secondary(Genome g, Family art)
        {
            var c = new Dictionary<Family, int>();
            foreach (var s in Genetics.Slots) { c.TryGetValue(g[s], out var v); c[g[s]] = v + 1; }
            var o = c.Where(kv => kv.Key != art && kv.Value >= 2).OrderByDescending(kv => kv.Value).ToList();
            return o.Count > 0 ? o[0].Key : (Family?)null;
        }

        public Sprite Get(Genome g, string stage, Family? line = null)
        {
            var st = ArtStage(stage);
            var f = st == "baby" ? Dominant(g) : line ?? Dominant(g);
            if (st == "baby" && f == Family.plasma && g.variant[(int)PartSlot.back] == 1) st = "baby2";
            return entries.FirstOrDefault(e => e.family == f && e.stage == st)?.sprite
                ?? entries.FirstOrDefault(e => e.family == f && e.stage == "initial")?.sprite;
        }
    }

    /// Procedural animation for a painted sprite with the family's physics and the starter's personality
    /// (same values as the web renderer: Data/Evolution/catalog.json "starters" and "motions").
    /// Clip ids as the rig: idle, walk, run, attack, eat, sleep, celebrate, sad, angry, pet, hit, bathe, train, hungry.
    public class PaintedCreature : MonoBehaviour
    {
        public SpriteRenderer body;
        public MotionJson motion = new MotionJson { bounce = 0.4f, sway = 0.1f, tail = 0.5f, tilt = 0.4f, breath = 0.5f, tempo = 1, speed = 1, gait = "walk" };
        [Tooltip("Eyelid for blinking (created by SetEye).")] public SpriteRenderer lid;
        public string Current { get; private set; } = "idle";
        public bool floating => motion != null && motion.@float;
        float start, seed;
        float lidOpenY;

        public void Play(string id) { Current = id; start = Time.time; }

        public void SetMutation(string m)
        {
            body.color = m switch
            {
                "melanic" => new Color(0.5f, 0.45f, 0.55f),
                "albino" => new Color(1f, 0.95f, 0.97f),
                "aurora" => new Color(0.75f, 1f, 0.9f),
                "iridescent" => new Color(1f, 0.85f, 1f),
                _ => Color.white,
            };
        }

        /// Eyelid at the starter's eye (normalised position in the sprite, radius as a fraction of the width).
        /// Soft aura of a second family behind the body (hybrids).
        public void SetAura(Color c)
        {
            if (!body || !body.sprite) return;
            var b = body.sprite.bounds;
            var go = new GameObject("aura");
            go.transform.SetParent(transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = Disc(); sr.color = new Color(c.r, c.g, c.b, 0.3f); sr.sortingOrder = body.sortingOrder - 1;
            go.transform.localPosition = new Vector3(b.center.x, b.max.y * 0.95f, 0);
            go.transform.localScale = new Vector3(b.size.x * 1.15f, b.size.y * 0.95f, 1);
            aura = sr;
        }
        SpriteRenderer aura;

        public void SetEye(EyeJson e)
        {
            if (e == null || !body || !body.sprite) return;
            var b = body.sprite.bounds;
            var go = new GameObject("eyelid");
            go.transform.SetParent(body.transform, false);
            lid = go.AddComponent<SpriteRenderer>();
            lid.sprite = Disc();
            lid.color = ColorUtility.TryParseHtmlString(e.lid, out var c) ? c : Color.black;
            lid.sortingOrder = body.sortingOrder + 1;
            float r = e.r * b.size.x * 1.25f;
            go.transform.localPosition = new Vector3(b.min.x + e.x * b.size.x, b.max.y - e.y * b.size.y, 0);
            go.transform.localScale = new Vector3(r * 2, 0.0001f, 1);
            lidOpenY = r * 2;
        }

        static Sprite disc;
        static Sprite Disc()
        {
            if (disc) return disc;
            const int n = 64; var t = new Texture2D(n, n, TextureFormat.RGBA32, false);
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
            {
                float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(n / 2f, n / 2f)) / (n / 2f);
                t.SetPixel(x, y, new Color(1, 1, 1, Mathf.Clamp01((1 - d) * 8)));
            }
            t.Apply();
            return disc = Sprite.Create(t, new Rect(0, 0, n, n), new Vector2(0.5f, 1f), n);
        }

        void Awake() => seed = UnityEngine.Random.value * 5;

        void LateUpdate()
        {
            if (!body) return;
            var m = motion;
            float t = Time.time, u = t - start, T = t * m.tempo + seed;
            float sx = 1, sy = 1, x = 0, y = 0, rot = 0;
            // Personality & physics (idle layer).
            sy += m.breath * 0.035f * Mathf.Sin(T * 1.9f);
            float hop = m.gait == "bounce" ? Mathf.Abs(Mathf.Sin(T * 2.4f)) : Mathf.Max(0, Mathf.Sin(T * 2.6f)) * 0.35f;
            if (m.gait == "bounce") { float sq = 0.12f * Mathf.Cos(T * 4.8f) * m.bounce; sy -= sq; sx += sq; }
            y += hop * m.bounce * 0.12f;
            if (m.@float) { y += m.lift / 40f + Mathf.Sin(T * 1.5f) * 0.06f * m.sway; x += Mathf.Sin(T * 0.9f) * 0.07f * m.sway; }
            if (m.flap > 0) y += Mathf.Sin(T * 5.5f) * 0.07f * m.flap;
            rot += m.tilt * 4f * Mathf.Sin(T * 0.7f) * Mathf.Max(0, Mathf.Sin(T * 0.23f));
            if (m.jitter > 0 && Mathf.Sin(T * 1.7f) > 0.6f) rot += Mathf.Sin(T * 23f) * 2f * m.jitter;
            if (m.wave > 0) { rot += Mathf.Sin(T * 3f) * 3f * m.wave; sx += Mathf.Sin(T * 3f + 1) * 0.03f * m.wave; }
            if (m.shake > 0 && Mathf.Sin(T * 1.3f) > 0.85f) x += Mathf.Sin(T * 30f) * 0.012f * m.shake;
            // Clip layer.
            switch (Current)
            {
                case "walk": case "run":
                    float f = (Current == "run" ? 11f : 7f) * m.speed;
                    y += Mathf.Abs(Mathf.Sin(t * f)) * 0.07f; rot += Mathf.Sin(t * f) * 3f; break;
                case "attack":
                    float k = Mathf.Clamp01(u / 0.5f); x += Mathf.Sin(k * Mathf.PI) * 0.45f; sx += Mathf.Sin(k * Mathf.PI) * 0.08f;
                    if (u > 0.7f) Play("idle"); break;
                case "hit":
                    x -= Mathf.Sin(Mathf.Clamp01(u / 0.35f) * Mathf.PI) * 0.2f; rot -= 8f * Mathf.Exp(-u * 6);
                    if (u > 0.5f) Play("idle"); break;
                case "celebrate": case "train":
                    y += Mathf.Abs(Mathf.Sin(u * 7f)) * 0.35f; sy += Mathf.Sin(u * 14f) * 0.05f;
                    if (u > 2.2f) Play("idle"); break;
                case "eat":
                    rot += Mathf.Sin(u * 12f) * 4f; sy -= Mathf.Abs(Mathf.Sin(u * 12f)) * 0.04f;
                    if (u > 2.1f) Play("idle"); break;
                case "pet":
                    rot += Mathf.Sin(u * 6f) * 5f; sx += 0.03f; if (u > 2.4f) Play("idle"); break;
                case "sleep":
                    sy = 0.9f + Mathf.Sin(t * 1.2f) * 0.02f; sx = 1.04f; rot = -3f; y = m.@float ? m.lift / 80f : 0; break;
                case "sad": case "hungry":
                    sy -= 0.06f; rot -= 4f; break;
                case "angry":
                    x += Mathf.Sin(u * 40f) * 0.02f; sy += 0.03f; if (u > 1.4f) Play("idle"); break;
                case "bathe":
                    rot += Mathf.Sin(u * 9f) * 6f; if (u > 3f) Play("idle"); break;
            }
            body.transform.localPosition = new Vector3(x, y, 0);
            body.transform.localScale = new Vector3(sx, sy, 1);
            body.transform.localRotation = Quaternion.Euler(0, 0, rot);
            if (aura) { var ac = aura.color; ac.a = 0.28f + 0.12f * Mathf.Sin(t * 2.1f); aura.color = ac; }
            // Blink every ~4.3 s; closed while sleeping.
            if (lid)
            {
                float cyc = (t + seed * 1.7f) % 4.3f;
                float close = cyc < 0.16f ? Mathf.Sin(cyc / 0.16f * Mathf.PI) : 0;
                if (Current == "sleep") close = 1;
                var s = lid.transform.localScale; s.y = Mathf.Max(0.0001f, lidOpenY * close); lid.transform.localScale = s;
            }
        }
    }
}
