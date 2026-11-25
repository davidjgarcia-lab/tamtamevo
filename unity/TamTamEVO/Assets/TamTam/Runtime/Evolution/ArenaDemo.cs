using System.Collections.Generic;
using TamTam.Core;
using TamTam.Vfx;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace TamTam.Evolution
{
    /// Arena preview: two painted Tamtams face each other over one of the 8 painted biomes, each biome with its own
    /// scene light (style guide §6). Buttons change biome and fighters and play attack/hit with hit or critical VFX.
    public class ArenaDemo : MonoBehaviour
    {
        public SpriteRenderer backdrop;
        public Sprite[] biomes;
        public FamilyArt familyArt;
        public SpriteRenderer left, right;
        public Camera cam;
        [Tooltip("Scene/back light tinted per biome.")] public Light2D biomeLight;
        int biome, famL, famR = 5;
        Family shownL = (Family)(-1), shownR = (Family)(-1);
        static readonly Family[] Families = (Family[])System.Enum.GetValues(typeof(Family));

        public static readonly Dictionary<string, string> BiomeLight = new Dictionary<string, string>
        {
            { "lava", "#FF7A2A" }, { "crystal_cave", "#7FD8FF" }, { "mushroom_shadow", "#C77DFF" }, { "forest", "#CFFF9A" },
            { "waterfall", "#9FE6FF" }, { "ruins_sunset", "#FFB070" }, { "sky_islands", "#FFF3C4" }, { "colosseum", "#FFD9A0" },
        };

        void Start() => Apply();

        public void SetBiome(int i) { biome = (i % biomes.Length + biomes.Length) % biomes.Length; Apply(); }
        public void SetFamilies(int l, int r) { famL = l % Families.Length; famR = r % Families.Length; Apply(); }

        public void Apply()
        {
            left = SetFighter(left, Families[famL], ref shownL);
            right = SetFighter(right, Families[famR], ref shownR);
            if (backdrop && biomes != null && biomes.Length > 0)
            {
                backdrop.sprite = biomes[biome];
                // QA fix: each biome has its floor at a different height; align it with the fighters' feet.
                BiomeFloor.Fit(backdrop, cam, left ? left.transform.parent.position.y : -2.2f);
                if (biomeLight && BiomeLight.TryGetValue(biomes[biome].name, out var hex) && ColorUtility.TryParseHtmlString(hex, out var c)) biomeLight.color = c;
            }
        }

        SpriteRenderer SetFighter(SpriteRenderer sr, Family f, ref Family shown)
        {
            if (!sr || !familyArt) return sr;
            var e = familyArt.entries.Find(x => x.family == f && x.stage == "final");
            if (e == null) return sr;
            var pc = sr.GetComponentInParent<PaintedCreature>();
            if (shown != f || sr.sprite != e.sprite)
            {
                pc = familyArt.Respawn(pc, e.sprite);        // the rig is per sprite: rebuild the puppet
                pc.SetLook(f, "none");
                FamilyVfx.Attach(pc.transform, f, pc.body.bounds, pc.body.sortingOrder);
                shown = f;
            }
            return pc.body;
        }

        void Turn(SpriteRenderer attacker, SpriteRenderer target)
        {
            attacker.GetComponentInParent<PaintedCreature>()?.Play("attack");
            target.GetComponentInParent<PaintedCreature>()?.Play("hit");
            bool crit = Random.value < 0.2f;
            var fam = attacker == left ? Families[famL] : Families[famR];
            GameVfx.Hit(target.bounds.center, crit, CreatureLook.GlowOf(fam));
        }

        void OnGUI()
        {
            float s = Mathf.Max(1, Screen.height / 720f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1));
            GUILayout.BeginArea(new Rect(12, 12, 220, 400));
            GUILayout.Label($"<b>Arena</b> · {(biomes != null && biomes.Length > 0 ? biomes[biome].name : "-")}", new GUIStyle(GUI.skin.label) { richText = true, fontSize = 15 });
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("◀ Bioma", GUILayout.Height(26))) SetBiome(biome - 1);
            if (GUILayout.Button("Bioma ▶", GUILayout.Height(26))) SetBiome(biome + 1);
            GUILayout.EndHorizontal();
            if (GUILayout.Button($"Izquierda: {Families[famL]}", GUILayout.Height(26))) { famL = (famL + 1) % Families.Length; Apply(); }
            if (GUILayout.Button($"Derecha: {Families[famR]}", GUILayout.Height(26))) { famR = (famR + 1) % Families.Length; Apply(); }
            if (GUILayout.Button("Ataca izquierda", GUILayout.Height(26))) Turn(left, right);
            if (GUILayout.Button("Ataca derecha", GUILayout.Height(26))) Turn(right, left);
            GUILayout.EndArea();
        }
    }
}
