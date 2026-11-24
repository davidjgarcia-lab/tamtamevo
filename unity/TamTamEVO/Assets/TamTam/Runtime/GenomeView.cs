using TamTam.Core;
using UnityEngine;
using UnityEngine.U2D.Animation;

namespace TamTam
{
    /// <summary>
    /// Shows an evolved Tamtam from its genome on the shared skinned rig (Unity 2D Animation).
    /// Every body part is a skinned sprite whose image comes from a Sprite Library:
    ///   category = slot ("body", "head", "legs", "tail", "back", "eyes", "pattern")
    ///   label    = "{family}_{variant}"  (e.g. "crystal_1"), eyes/pattern use their style id.
    /// Painted parts share bone weights, so all animations (Animator) work for any mix.
    /// Colours go to the "TamTam/CreatureLit" Shader Graph through a MaterialPropertyBlock.
    /// </summary>
    public class GenomeView : MonoBehaviour
    {
        [System.Serializable]
        public struct SlotResolver { public string category; public SpriteResolver[] resolvers; }

        public SlotResolver[] slots;
        public Transform body;
        [Tooltip("Floating families (shadow, light) hover this high, in units.")]
        public float floatHeight = 0.18f;
        public Renderer[] tintedRenderers;

        static readonly int BaseColor = Shader.PropertyToID("_BaseColor");
        static readonly int AccentColor = Shader.PropertyToID("_AccentColor");
        static readonly int GlowColor = Shader.PropertyToID("_GlowColor");
        static readonly int EyeColor = Shader.PropertyToID("_EyeColor");
        static readonly int Iridescence = Shader.PropertyToID("_Iridescence");
        static readonly int Emission = Shader.PropertyToID("_Emission");

        Vector3 bodyRest;
        bool floating;

        void Awake() { if (body) bodyRest = body.localPosition; }

        public void Apply(Genome g, float emission = 1f)
        {
            foreach (var s in slots)
            {
                string label = s.category switch
                {
                    "eyes" => g.eyes,
                    "pattern" => g.pattern,
                    _ => $"{g[(PartSlot)System.Enum.Parse(typeof(PartSlot), s.category)]}_{g.variant[(int)System.Enum.Parse(typeof(PartSlot), s.category)]}",
                };
                foreach (var r in s.resolvers) r.SetCategoryAndLabel(s.category, label);
            }

            var basePal = Genetics.Defs[g.paletteBase];
            var accentPal = Genetics.Defs[g.paletteAccent];
            Color baseC = Hex(basePal.Bases[g.shade % basePal.Bases.Length]), accent = Hex(accentPal.Accent), glow = Hex(accentPal.Glow), eye = Hex(Genetics.Defs[g[PartSlot.head]].Eye);
            if (g.mutation == "melanic") baseC = Hex("#1C1620");
            if (g.mutation == "albino") { baseC = Hex("#E8E2EA"); eye = Hex("#FF6F91"); }
            if (g.mutation == "aurora") { accent = Hex("#7CFFCB"); glow = Hex("#B8FFE6"); }

            var mpb = new MaterialPropertyBlock();
            foreach (var r in tintedRenderers)
            {
                r.GetPropertyBlock(mpb);
                mpb.SetColor(BaseColor, baseC);
                mpb.SetColor(AccentColor, accent);
                mpb.SetColor(GlowColor, glow);
                mpb.SetColor(EyeColor, eye);
                mpb.SetFloat(Iridescence, g.mutation == "iridescent" ? 1f : 0f);
                mpb.SetFloat(Emission, emission);
                r.SetPropertyBlock(mpb);
            }
            floating = Genetics.Defs[g[PartSlot.legs]].Locomotion == "float";
        }

        void LateUpdate()
        {
            if (!body || !floating) return;
            body.localPosition = bodyRest + Vector3.up * (floatHeight + Mathf.Sin(Time.time * 1.6f) * 0.03f);
        }

        static Color Hex(string h) => ColorUtility.TryParseHtmlString(h, out var c) ? c : Color.magenta;
    }
}
