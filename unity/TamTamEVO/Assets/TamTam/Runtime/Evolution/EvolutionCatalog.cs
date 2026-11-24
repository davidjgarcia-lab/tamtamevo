using System;
using System.Collections.Generic;
using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// All built evolved forms (prefabs made by TamTam ▸ Evoluciones from Data/Evolution). Colours are not baked:
    /// one prefab per body plan (shape) serves every palette and mutation through the tint mask.
    [CreateAssetMenu(menuName = "TamTam/Evolution Catalog")]
    public class EvolutionCatalog : ScriptableObject
    {
        [Serializable]
        public class Entry
        {
            public string shapeKey, name;
            public GameObject prefab;
            public Family[] parts = new Family[5];
            public int[] variant = new int[5];
            public string eyes, pattern;
            public bool floating;
        }

        [Tooltip("Baby stage: the painted Chispín.")]
        public GameObject babyPrefab;
        public List<Entry> entries = new List<Entry>();

        /// Exact body plan if built; otherwise the closest one (most matching slots, then eyes/pattern).
        public Entry Find(Genome g, out bool exact)
        {
            string k = GenomeKeys.ShapeKey(g);
            Entry best = null; int bestScore = -1;
            foreach (var e in entries)
            {
                if (!e.prefab) continue;
                if (e.shapeKey == k) { exact = true; return e; }
                int s = 0;
                for (int i = 0; i < 5; i++) { if (e.parts[i] == g.parts[i]) s += 10; if (e.parts[i] == g.parts[i] && e.variant[i] == g.variant[i]) s += 3; }
                if (e.eyes == g.eyes) s += 2;
                if (e.pattern == g.pattern) s += 1;
                if (s > bestScore) { bestScore = s; best = e; }
            }
            exact = false;
            return best;
        }
    }

    /// Palette of a genome (mirror of genomePalette in packages/art/src/modular/build.ts).
    public static class GenomePalette
    {
        public static (Color baseC, Color accent, Color eye, Color glow) Of(Genome g)
        {
            var b = Genetics.Defs[g.paletteBase];
            var a = Genetics.Defs[g.paletteAccent];
            Color baseC = Hex(b.Bases[g.shade % b.Bases.Length]), accent = Hex(a.Accent), glow = Hex(a.Glow), eye = Hex(Genetics.Defs[g[PartSlot.head]].Eye);
            if (g.mutation == "melanic") baseC = Hex("#1C1620");
            if (g.mutation == "albino") { baseC = Hex("#E8E2EA"); eye = Hex("#FF6F91"); }
            if (g.mutation == "aurora") { accent = Hex("#7CFFCB"); glow = Hex("#B8FFE6"); }
            if (g.mutation == "iridescent") { accent = Hex("#FF8FE0"); glow = Hex("#C8F4FF"); }
            return (baseC, accent, eye, glow);
        }
        public static Color Hex(string h) => ColorUtility.TryParseHtmlString(h, out var c) ? c : Color.magenta;
    }
}
