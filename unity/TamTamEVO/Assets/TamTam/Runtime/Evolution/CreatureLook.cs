using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Technical-art look of a painted Tamtam (docs/STYLE_GUIDE_UNITY.md): family rim light, auto-emission of the bright
    /// paint (flames, crystals, plasma, halos) and the genome's mutation as a material variation. Uses a
    /// MaterialPropertyBlock on the shared TamTam/CreatureLit material, so there is no material per creature.
    public static class CreatureLook
    {
        static readonly int RimColor = Shader.PropertyToID("_RimColor"), RimStrength = Shader.PropertyToID("_RimStrength"),
            AutoEmission = Shader.PropertyToID("_AutoEmission"), Mutation = Shader.PropertyToID("_Mutation");
        static MaterialPropertyBlock mpb;

        /// How much of the family's paint is "light" (fire and plasma glow, rock and plant barely do).
        public static float EmissionOf(Family f) => f switch
        {
            Family.fire => 0.6f, Family.plasma => 0.6f, Family.electric => 0.55f, Family.crystal => 0.5f, Family.light => 0.3f,
            Family.mystic => 0.45f, Family.shadow => 0.4f, Family.water => 0.3f, Family.rock => 0.25f, _ => 0.15f,
        };

        public static int MutationIndex(string m) => m switch { "melanic" => 1, "albino" => 2, "aurora" => 3, "iridescent" => 4, _ => 0 };

        public static Color GlowOf(Family f) =>
            ColorUtility.TryParseHtmlString(Genetics.Defs[f].Glow, out var c) ? c : Color.white;

        public static void Apply(Renderer r, Family family, string mutation, float rim = 0.55f)
        {
            if (!r) return;
            mpb ??= new MaterialPropertyBlock();
            r.GetPropertyBlock(mpb);
            mpb.SetColor(RimColor, GlowOf(family));
            mpb.SetFloat(RimStrength, rim);
            mpb.SetFloat(AutoEmission, EmissionOf(family));
            mpb.SetFloat("_EmitThreshold", 0.84f);
            mpb.SetFloat(Mutation, MutationIndex(mutation));
            r.SetPropertyBlock(mpb);
        }

        /// Sober version for house props: soft neutral rim, emission only on light sources.
        public static void ApplyProp(Renderer r, string itemId)
        {
            if (!r) return;
            mpb ??= new MaterialPropertyBlock();
            r.GetPropertyBlock(mpb);
            bool emissive = itemId.Contains("lantern") || itemId.Contains("lamp") || itemId.Contains("mushroom") || itemId.Contains("crystal") || itemId.Contains("brazier") || itemId.Contains("stove");
            mpb.SetColor(RimColor, new Color(1f, 0.92f, 0.8f));
            mpb.SetFloat(RimStrength, 0.22f);
            mpb.SetFloat(AutoEmission, emissive ? 0.8f : 0f);
            mpb.SetFloat(Mutation, 0);
            r.SetPropertyBlock(mpb);
        }
    }
}
