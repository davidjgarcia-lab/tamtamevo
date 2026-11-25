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

        /// Tamtam stage → art stage (the baby is the painted Chispín).
        public static string ArtStage(string stage) => stage switch { "child" => "initial", "juvenile" => "intermediate", "adult" => "final", _ => "initial" };

        /// Family that shows: most parts, ties to the back part (mirror of dominantFamily in the web app).
        public static Family Dominant(Genome g)
        {
            var n = new Dictionary<Family, float>();
            foreach (var s in Genetics.Slots) { n.TryGetValue(g[s], out var v); n[g[s]] = v + (s == PartSlot.back ? 1.1f : 1f); }
            return n.OrderByDescending(kv => kv.Value).First().Key;
        }

        public Sprite Get(Genome g, string stage)
        {
            var f = Dominant(g); var st = ArtStage(stage);
            return entries.FirstOrDefault(e => e.family == f && e.stage == st)?.sprite;
        }
    }

    /// Procedural animation for a painted sprite (same clip ids as the rig: idle, walk, run, attack, eat, sleep,
    /// celebrate, sad, angry, pet, hit, bathe, train, hungry). Squash & stretch, bob, lunge, hop and tilt.
    public class PaintedCreature : MonoBehaviour
    {
        public SpriteRenderer body;
        public bool floating;
        public string Current { get; private set; } = "idle";
        float start;

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

        void LateUpdate()
        {
            if (!body) return;
            float t = Time.time, u = t - start;
            float sx = 1, sy = 1, x = 0, y = floating ? 0.18f + Mathf.Sin(t * 2.2f) * 0.04f : 0, rot = 0;
            float breath = Mathf.Sin(t * 2.8f) * 0.018f;
            sy += breath; sx -= breath * 0.5f;
            switch (Current)
            {
                case "walk": case "run":
                    float f = Current == "run" ? 11f : 7f;
                    y += Mathf.Abs(Mathf.Sin(t * f)) * 0.07f; rot = Mathf.Sin(t * f) * 3f; break;
                case "attack":
                    float k = Mathf.Clamp01(u / 0.5f); x = Mathf.Sin(k * Mathf.PI) * 0.45f; sx += Mathf.Sin(k * Mathf.PI) * 0.08f;
                    if (u > 0.7f) Play("idle"); break;
                case "hit":
                    x = -Mathf.Sin(Mathf.Clamp01(u / 0.35f) * Mathf.PI) * 0.2f; rot = -8f * Mathf.Exp(-u * 6);
                    if (u > 0.5f) Play("idle"); break;
                case "celebrate": case "train":
                    y += Mathf.Abs(Mathf.Sin(u * 7f)) * 0.35f; sy += Mathf.Sin(u * 14f) * 0.05f;
                    if (u > 2.2f) Play("idle"); break;
                case "eat":
                    rot = Mathf.Sin(u * 12f) * 4f; sy -= Mathf.Abs(Mathf.Sin(u * 12f)) * 0.04f;
                    if (u > 2.1f) Play("idle"); break;
                case "pet":
                    rot = Mathf.Sin(u * 6f) * 5f; sx += 0.03f; if (u > 2.4f) Play("idle"); break;
                case "sleep":
                    sy = 0.9f + Mathf.Sin(t * 1.2f) * 0.02f; sx = 1.04f; rot = -3f; break;
                case "sad": case "hungry":
                    sy -= 0.06f; rot = -4f; break;
                case "angry":
                    x = Mathf.Sin(u * 40f) * 0.02f; sy += 0.03f; if (u > 1.4f) Play("idle"); break;
                case "bathe":
                    rot = Mathf.Sin(u * 9f) * 6f; if (u > 3f) Play("idle"); break;
            }
            body.transform.localPosition = new Vector3(x, y, 0);
            body.transform.localScale = new Vector3(sx, sy, 1);
            body.transform.localRotation = Quaternion.Euler(0, 0, rot);
        }
    }
}
