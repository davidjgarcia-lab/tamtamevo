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

}
