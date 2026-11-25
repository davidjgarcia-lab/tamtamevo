using System;
using System.Collections.Generic;
using System.Linq;
using TamTam.Core;
using TamTam.Vfx;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Procedural animation for a painted Tamtam with the family's physics and the starter's personality
    /// (values from Data/Evolution/catalog.json "starters" and "motions", shared with the web game — never changed here).
    /// Two layers, both cross-faded when the clip changes:
    ///  • whole-body layer (position, tilt, squash & stretch with anticipation on hops/landings, float/fly drift);
    ///  • bone layer on the auto-rig (PuppetRigBuilder + PuppetSkin): head look/nod, tail with spring follow-through,
    ///    leg cycles per gait, wing flap, crawl wave, heavy-step ground tremble.
    /// Clip ids as the rig: idle, walk, run, attack, eat, sleep, celebrate, sad, angry, pet, hit, bathe, train, hungry.
    public class PaintedCreature : MonoBehaviour
    {
        public SpriteRenderer body;
        public MotionJson motion = new MotionJson { bounce = 0.4f, sway = 0.1f, tail = 0.5f, tilt = 0.4f, breath = 0.5f, tempo = 1, speed = 1, gait = "walk" };
        [Tooltip("Eyelid for blinking (created by SetEye).")] public SpriteRenderer lid;
        [Tooltip("Seconds of cross-fade between clips (no pose pops).")] public float crossFade = 0.22f;
        public string Current { get; private set; } = "idle";
        public bool floating => motion != null && motion.@float;
        public bool HasRig => bones.Count > 0;
        public IReadOnlyDictionary<string, Transform> Bones => bones;

        float start, seed, lidOpenY, blendStart = -10;
        readonly Dictionary<string, Transform> bones = new Dictionary<string, Transform>();
        readonly Dictionary<string, Quaternion> boneRest = new Dictionary<string, Quaternion>();
        // Pose = whole-body (x, y, rot, sx, sy) + bone angles; "from" is what was on screen when the clip changed.
        float[] last = new float[16], from = new float[16];
        float tailVel, tailAngle, lastLegPhase;
        SpriteRenderer aura;
        ParticleSystem auraFx;

        static readonly string[] BoneOrder = { "head", "body", "tail1", "tail2", "tail3", "legF", "legB", "wing" };

        public void Play(string id)
        {
            if (id == Current && Time.time - start < 0.05f) return;
            Array.Copy(last, from, last.Length);
            blendStart = Time.time;
            Current = id; start = Time.time;
        }

        /// Binds the auto-rig bones (if the sprite has them) — called by FamilyArt.Spawn.
        public void BindRig(Dictionary<string, Transform> rig)
        {
            bones.Clear(); boneRest.Clear();
            foreach (var kv in rig) { bones[kv.Key] = kv.Value; boneRest[kv.Key] = kv.Value.localRotation; }
            if (lid && bones.TryGetValue("head", out var head)) lid.transform.SetParent(head, true);
        }

        /// Family look on the shared material (rim in the family glow, auto-emission, mutation as material variation).
        public void SetLook(Family family, string mutation)
        {
            body.color = Color.white;
            if (body.sharedMaterial && body.sharedMaterial.HasProperty("_Mutation")) CreatureLook.Apply(body, family, mutation);
            else SetMutation(mutation);
        }

        /// Fallback for materials without the mutation feature: tint (PROVISIONAL, only used without CreatureLit).
        public void SetMutation(string m)
        {
            if (body.sharedMaterial && body.sharedMaterial.HasProperty("_Mutation"))
            {
                var mpb = new MaterialPropertyBlock(); body.GetPropertyBlock(mpb);
                mpb.SetFloat("_Mutation", CreatureLook.MutationIndex(m)); body.SetPropertyBlock(mpb); return;
            }
            body.color = m switch
            {
                "melanic" => new Color(0.5f, 0.45f, 0.55f),
                "albino" => new Color(1f, 0.95f, 0.97f),
                "aurora" => new Color(0.75f, 1f, 0.9f),
                "iridescent" => new Color(1f, 0.85f, 1f),
                _ => Color.white,
            };
        }

        /// Hybrid aura: an orbiting ring of the second family's glow plus a very faint halo (no flat disc over the body).
        public void SetAura(Color c)
        {
            if (!body || !body.sprite) return;
            var b = body.sprite.bounds;
            var go = new GameObject("aura");
            go.transform.SetParent(transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = Disc(); sr.color = new Color(c.r, c.g, c.b, 0.12f); sr.sortingOrder = body.sortingOrder - 1;
            go.transform.localPosition = new Vector3(b.center.x, b.max.y * 0.95f, 0);
            go.transform.localScale = new Vector3(b.size.x * 1.15f, b.size.y * 0.95f, 1);
            aura = sr;
            auraFx = GameVfx.Aura(transform, body.bounds, c, body.sortingOrder + 3);
        }

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
            if (bones.TryGetValue("head", out var head)) lid.transform.SetParent(head, true);
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

        static float Ease(float u) => u * u * (3 - 2 * u);

        void LateUpdate()
        {
            if (!body) return;
            var m = motion;
            float t = Time.time, u = t - start, T = t * m.tempo + seed, dt = Mathf.Max(1e-4f, Time.deltaTime);
            var p = new float[16];
            float sx = 1, sy = 1, x = 0, y = 0, rot = 0;
            // ── Whole-body layer: personality & physics (idle), same formulas as the web renderer. ──
            sy += m.breath * 0.035f * Mathf.Sin(T * 1.9f);
            float hopPhase = m.gait == "bounce" ? Mathf.Abs(Mathf.Sin(T * 2.4f)) : Mathf.Max(0, Mathf.Sin(T * 2.6f)) * 0.35f;
            if (m.gait == "bounce")
            {
                // Squash on contact, stretch in the air, anticipation squash before take-off (jelly).
                float contact = 1 - Mathf.Clamp01(hopPhase * 4);
                float sq = 0.16f * m.bounce * contact - 0.08f * m.bounce * hopPhase;
                sy -= sq; sx += sq * 0.9f;
            }
            y += hopPhase * m.bounce * 0.12f;
            if (m.@float) { y += m.lift / 40f + Mathf.Sin(T * 1.5f) * 0.06f * m.sway; x += Mathf.Sin(T * 0.9f) * 0.07f * m.sway; }
            if (m.flap > 0) y += Mathf.Sin(T * 5.5f) * 0.07f * m.flap;
            rot += m.tilt * 4f * Mathf.Sin(T * 0.7f) * Mathf.Max(0, Mathf.Sin(T * 0.23f));
            if (m.jitter > 0 && Mathf.Sin(T * 1.7f) > 0.6f) rot += Mathf.Sin(T * 23f) * 2f * m.jitter;
            if (m.wave > 0) { rot += Mathf.Sin(T * 3f) * 3f * m.wave; sx += Mathf.Sin(T * 3f + 1) * 0.03f * m.wave; }
            if (m.shake > 0 && Mathf.Sin(T * 1.3f) > 0.85f) x += Mathf.Sin(T * 30f) * 0.012f * m.shake;

            // ── Bone layer defaults (degrees, relative to the rest pose). ──
            float head = Mathf.Sin(T * 0.9f) * 3f * m.tilt + Mathf.Sin(T * 0.37f) * 2f;   // look around
            float bodyB = Mathf.Sin(T * 1.9f) * 1.2f * m.breath;
            float tailDrive = Mathf.Sin(T * 2.1f) * 10f * m.tail;
            float legF = 0, legB = 0, wing = m.flap > 0 ? Mathf.Sin(T * 5.5f) * 26f * m.flap : 0;
            bool walking = false; float stepF = 7f;

            // ── Clip layer. ──
            switch (Current)
            {
                case "walk": case "run":
                    walking = true;
                    stepF = (Current == "run" ? 11f : 7f) * m.speed * (m.gait == "heavy" ? 0.6f : 1f);
                    float sw = Mathf.Sin(t * stepF);
                    y += Mathf.Abs(sw) * (m.gait == "heavy" ? 0.04f : 0.07f); rot += sw * 3f;
                    legF = sw * (m.gait == "heavy" ? 14f : 20f); legB = -legF;
                    if (m.gait == "swim" || m.wave > 0) bodyB += Mathf.Sin(t * stepF * 0.5f) * 6f;      // crawl/swim wave
                    if (m.gait == "fly") wing = Mathf.Sin(t * 9f) * 32f;
                    tailDrive += Mathf.Sin(t * stepF) * 8f;
                    break;
                case "attack":
                    float k = Mathf.Clamp01(u / 0.5f);
                    float antic = k < 0.3f ? -Mathf.Sin(k / 0.3f * Mathf.PI) * 0.12f : 0;               // anticipation
                    x += Mathf.Sin(k * Mathf.PI) * 0.45f + antic; sx += Mathf.Sin(k * Mathf.PI) * 0.08f; sy -= Mathf.Sin(k * Mathf.PI) * 0.04f;
                    head = -10 * Mathf.Sin(k * Mathf.PI) + (k < 0.3f ? 8 : 0); legF = -18 * Mathf.Sin(k * Mathf.PI);
                    if (u > 0.7f) Play("idle"); break;
                case "hit":
                    float hk = Mathf.Clamp01(u / 0.35f);
                    x -= Mathf.Sin(hk * Mathf.PI) * 0.2f; rot -= 8f * Mathf.Exp(-u * 6);
                    sx -= 0.06f * Mathf.Exp(-u * 8); sy += 0.06f * Mathf.Exp(-u * 8); head = 14 * Mathf.Exp(-u * 6);
                    if (u > 0.5f) Play("idle"); break;
                case "celebrate": case "train":
                    float jp = (u * 7f) % Mathf.PI, j = Mathf.Sin(jp);
                    float land = 1 - Mathf.Clamp01(j * 5);                                              // squash at take-off/landing
                    y += j * 0.35f; sy += j * 0.06f - land * 0.08f; sx += land * 0.07f;
                    head = 12 + Mathf.Sin(u * 14f) * 4; wing = m.flap > 0 ? Mathf.Sin(u * 14f) * 34f : wing; tailDrive = Mathf.Sin(u * 16f) * 22f * Mathf.Max(0.4f, m.tail);
                    legF = -j * 16; legB = j * 16;
                    if (u > 2.2f) Play("idle"); break;
                case "eat":
                    float chew = Mathf.Sin(u * 12f);
                    rot += chew * 2f; sy -= Mathf.Abs(chew) * 0.04f; head = -14 + chew * 6;
                    if (u > 2.1f) Play("idle"); break;
                case "pet":
                    rot += Mathf.Sin(u * 6f) * 4f; sx += 0.03f; head = 10 + Mathf.Sin(u * 6f) * 6; tailDrive = Mathf.Sin(u * 12f) * 20f;
                    if (u > 2.4f) Play("idle"); break;
                case "sleep":
                    sy = 0.9f + Mathf.Sin(t * 1.2f) * 0.02f; sx = 1.04f; rot = -3f; y = m.@float ? m.lift / 80f : 0;
                    head = -16; tailDrive = 4; wing = 0; legF = legB = 0; break;
                case "sad": case "hungry":
                    sy -= 0.06f; rot -= 4f; head = -12; tailDrive *= 0.3f; break;
                case "angry":
                    x += Mathf.Sin(u * 40f) * 0.02f; sy += 0.03f; head = 6 + Mathf.Sin(u * 30f) * 2; tailDrive = Mathf.Sin(u * 20f) * 14f;
                    if (u > 1.4f) Play("idle"); break;
                case "bathe":
                    rot += Mathf.Sin(u * 9f) * 6f; head = Mathf.Sin(u * 9f + 1) * 10; tailDrive = Mathf.Sin(u * 18f) * 18f;
                    if (u > 3f) Play("idle"); break;
            }

            // Heavy walkers: a short ground tremble on each footfall.
            if (walking && m.gait == "heavy")
            {
                float ph = Mathf.Sin(t * stepF);
                if (Mathf.Sign(ph) != Mathf.Sign(lastLegPhase)) CameraShake.Add(0.025f * Mathf.Max(0.3f, m.shake));
                lastLegPhase = ph;
            }

            // Tail follow-through: a damped spring chasing the drive (lags behind body motion).
            float stiffness = 40f, damping = 7f;
            float acc = stiffness * (tailDrive - tailAngle) - damping * tailVel;
            tailVel += acc * dt; tailAngle += tailVel * dt;

            p[0] = x; p[1] = y; p[2] = rot; p[3] = sx; p[4] = sy;
            p[5] = head; p[6] = bodyB; p[7] = tailAngle * 0.5f; p[8] = tailAngle * 0.8f; p[9] = tailAngle;
            p[10] = legF; p[11] = legB; p[12] = wing;

            // Cross-fade from what was on screen when the clip changed.
            float w = Ease(Mathf.Clamp01((t - blendStart) / Mathf.Max(0.01f, crossFade)));
            for (int i = 0; i < 13; i++) p[i] = Mathf.Lerp(from[i], p[i], w);
            Array.Copy(p, last, p.Length);

            body.transform.localPosition = new Vector3(p[0], p[1], 0);
            body.transform.localScale = new Vector3(p[3], p[4], 1);
            body.transform.localRotation = Quaternion.Euler(0, 0, p[2]);
            if (bones.Count > 0)
            {
                Rot("head", p[5]); Rot("body", p[6]); Rot("tail1", p[7]); Rot("tail2", p[8]); Rot("tail3", p[9]);
                Rot("legF", p[10]); Rot("legB", p[11]); Rot("wing", p[12]);
            }
            if (aura) { var ac = aura.color; ac.a = 0.10f + 0.05f * Mathf.Sin(t * 2.1f); aura.color = ac; }
            // Blink every ~4.3 s; closed while sleeping.
            if (lid)
            {
                float cyc = (t + seed * 1.7f) % 4.3f;
                float close = cyc < 0.16f ? Mathf.Sin(cyc / 0.16f * Mathf.PI) : 0;
                if (Current == "sleep") close = 1;
                var s = lid.transform.localScale; s.y = Mathf.Max(0.0001f, lidOpenY * close); lid.transform.localScale = s;
            }
        }

        void Rot(string bone, float deg)
        {
            if (bones.TryGetValue(bone, out var tr) && tr) tr.localRotation = boneRest[bone] * Quaternion.Euler(0, 0, deg);
        }
    }
}
