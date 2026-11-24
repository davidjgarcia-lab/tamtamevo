using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Arena preview: two painted Tamtams face each other over one of the 8 painted biomes.
    /// Buttons change biome and fighters and play attack/hit like a battle turn.
    public class ArenaDemo : MonoBehaviour
    {
        public SpriteRenderer backdrop;
        public Sprite[] biomes;
        public FamilyArt familyArt;
        public SpriteRenderer left, right;
        public Camera cam;
        int biome, famL, famR = 5;
        static readonly Family[] Families = (Family[])System.Enum.GetValues(typeof(Family));

        void Start() => Apply();

        public void SetBiome(int i) { biome = (i % biomes.Length + biomes.Length) % biomes.Length; Apply(); }

        public void Apply()
        {
            if (backdrop && biomes != null && biomes.Length > 0)
            {
                backdrop.sprite = biomes[biome];
                FitBackdrop();
            }
            SetFighter(left, Families[famL]);
            SetFighter(right, Families[famR]);
        }

        void FitBackdrop()
        {
            if (!cam || !backdrop.sprite) return;
            float h = cam.orthographicSize * 2, w = h * cam.aspect;
            var size = backdrop.sprite.bounds.size;
            float s = Mathf.Max(w / size.x, h / size.y);
            backdrop.transform.localScale = new Vector3(s, s, 1);
        }

        void SetFighter(SpriteRenderer sr, Family f)
        {
            if (!sr || !familyArt) return;
            var e = familyArt.entries.Find(x => x.family == f && x.stage == "final");
            if (e != null) sr.sprite = e.sprite;
            var pc = sr.GetComponentInParent<PaintedCreature>();
            if (pc) pc.floating = f == Family.shadow || f == Family.light || f == Family.plasma;
        }

        void Turn(SpriteRenderer attacker, SpriteRenderer target)
        {
            attacker.GetComponentInParent<PaintedCreature>()?.Play("attack");
            target.GetComponentInParent<PaintedCreature>()?.Play("hit");
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
