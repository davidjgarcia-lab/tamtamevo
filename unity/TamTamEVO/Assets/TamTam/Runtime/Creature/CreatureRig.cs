using System;
using System.Collections.Generic;
using UnityEngine;

namespace TamTam
{
    /// Living layer on top of the Animator — port of applyProcedural (packages/rig/src/pose.ts):
    /// breathing, deterministic blinking, follow-through of tail/flames behind their driver bones and flame flicker.
    /// Also plays clips by id, recolours the creature (TamTam/CreatureLit) and drives the ember particles.
    [DefaultExecutionOrder(100)]
    public class CreatureRig : MonoBehaviour
    {
        [Serializable]
        public class ClipInfo
        {
            public string id; public bool loop = true;
            public float breath = 1, breathRate = 0.45f, flicker = 1; public bool blink = true;
            public float embers = 2.4f;
        }

        [Serializable]
        public class Secondary
        {
            public Transform bone, driver;
            public float lag, gain, velocityGain, swayAmp, swayFreq, flickerAmp, flickerFreq;
            [NonSerialized] public Queue<(float t, float rot)> history;
        }

        public Animator animator;
        public ClipInfo[] clips;
        public Secondary[] secondary;
        public Transform breathBone;
        public Transform[] eyeBones;
        [Tooltip("Active while the eyes are open (blink only then).")]
        public GameObject eyesOpen;
        [Tooltip("Painted rigs: a closed-eye overlay shown during blinks (instead of squashing eye bones).")]
        public GameObject blinkOverlay;
        public ParticleSystem embers;
        public Renderer[] tinted;
        public float seed = 1;
        [Tooltip("Horizontal speed in rig units/s; drags the tail and flames back.")]
        public float velocity;
        public float crossFade = 0.15f;

        public string Current { get; private set; } = "idle";
        ClipInfo info;
        float clipStart;
        MaterialPropertyBlock mpb;

        static readonly int BaseColor = Shader.PropertyToID("_BaseColor"), AccentColor = Shader.PropertyToID("_AccentColor"),
            GlowColor = Shader.PropertyToID("_GlowColor"), EyeColor = Shader.PropertyToID("_EyeColor"), Emission = Shader.PropertyToID("_Emission");

        void OnEnable() { Play(Current, 0); }

        public void Play(string id, float fade = -1)
        {
            info = Array.Find(clips ?? Array.Empty<ClipInfo>(), c => c.id == id);
            if (info == null) { Debug.LogWarning($"CreatureRig: unknown clip {id}"); return; }
            Current = id; clipStart = Time.time;
            if (animator && animator.runtimeAnimatorController)
                animator.CrossFadeInFixedTime(id, fade < 0 ? crossFade : fade, 0, 0);
            if (embers) { var em = embers.emission; em.rateOverTime = info.embers; }
        }

        /// Recolours every tinted renderer (colours in sRGB, like the genome palette).
        public void SetPalette(Color baseC, Color accent, Color eye, Color glow, float emission = 1)
        {
            mpb ??= new MaterialPropertyBlock();
            foreach (var r in tinted)
            {
                if (!r) continue;
                r.GetPropertyBlock(mpb);
                mpb.SetColor(BaseColor, baseC); mpb.SetColor(AccentColor, accent); mpb.SetColor(GlowColor, glow); mpb.SetColor(EyeColor, eye);
                mpb.SetFloat(Emission, emission);
                r.SetPropertyBlock(mpb);
            }
            if (embers) { var main = embers.main; main.startColor = new ParticleSystem.MinMaxGradient(glow * 2.2f, accent * 2.6f); }
        }

        void LateUpdate()
        {
            if (info == null) return;
            if (!info.loop && Time.time - clipStart > 0.05f && animator && animator.GetCurrentAnimatorStateInfo(0).IsName("idle") && !animator.IsInTransition(0))
            {
                Current = "idle";
                info = Array.Find(clips, c => c.id == "idle") ?? info;
                if (embers) { var em = embers.emission; em.rateOverTime = info.embers; }
            }
            float time = Time.time;

            // Breathing (scaleY up, scaleX slightly down).
            if (breathBone && info.breath > 0)
            {
                float w = Mathf.Sin(time * Mathf.PI * 2 * info.breathRate);
                var s = breathBone.localScale;
                breathBone.localScale = new Vector3(s.x * (1 - 0.012f * info.breath * w), s.y * (1 + 0.028f * info.breath * w), s.z);
            }

            // Blink only while the eyes are in the "open" state.
            if (info.blink && (!eyesOpen || eyesOpen.activeInHierarchy))
            {
                float open = Mathf.Max(0.08f, BlinkOpenness(time, seed));
                foreach (var e in eyeBones) { var s = e.localScale; e.localScale = new Vector3(s.x, s.y * open, s.z); }
            }
            if (info.blink && blinkOverlay && !blinkOverlay.activeSelf && BlinkOpenness(time, seed) < 0.5f) blinkOverlay.SetActive(true);

            // Follow-through. Rig rotations are clockwise (SVG); Unity's z is counter-clockwise → signs flip.
            if (secondary != null)
                foreach (var s in secondary)
                {
                    if (!s.bone || !s.driver) continue;
                    s.history ??= new Queue<(float, float)>();
                    float drv = -s.driver.localEulerAngles.z;
                    s.history.Enqueue((time, drv));
                    float past = drv;
                    foreach (var h in s.history) { if (h.t <= time - s.lag) past = h.rot; else break; }
                    while (s.history.Count > 2 && s.history.Peek().t < time - s.lag - 0.1f) s.history.Dequeue();
                    float lagDelta = Mathf.DeltaAngle(past, drv);
                    float boneIndex = s.bone.GetSiblingIndex();
                    float sway = s.swayAmp * Mathf.Sin(time * Mathf.PI * 2 * s.swayFreq + boneIndex);
                    float add = -s.gain * lagDelta - s.velocityGain * velocity + sway;
                    var e = s.bone.localEulerAngles; e.z -= add; s.bone.localEulerAngles = e;
                    if (s.flickerAmp > 0)
                    {
                        float f = time * Mathf.PI * 2 * s.flickerFreq;
                        float n = Mathf.Sin(f) * 0.6f + Mathf.Sin(f * 2.37f + 1.3f) * 0.3f + Mathf.Sin(f * 5.1f + 0.7f) * 0.1f;
                        var sc = s.bone.localScale;
                        s.bone.localScale = new Vector3(sc.x * (1 - s.flickerAmp * 0.4f * n) * (0.7f + 0.3f * info.flicker),
                            sc.y * (1 + s.flickerAmp * n) * (0.55f + 0.45f * info.flicker), sc.z);
                    }
                }
        }

        static float Hash01(float n) { float s = Mathf.Sin(n * 12.9898f + 78.233f) * 43758.5453f; return s - Mathf.Floor(s); }

        /// Deterministic blink: every ~3.8 s, sometimes double. Same function as the web prototype.
        public static float BlinkOpenness(float time, float seed)
        {
            const float period = 3.8f, dur = 0.16f;
            float cycle = Mathf.Floor(time / period);
            float local = time - cycle * period - Hash01(cycle + seed) * 1.2f;
            float CloseAt(float x) => x >= 0 && x < dur ? Mathf.Abs(Mathf.Cos(x / dur * Mathf.PI)) : 1;
            float open = CloseAt(local);
            if (Hash01(cycle * 3.1f + seed) > 0.75f) open = Mathf.Min(open, CloseAt(local - 0.28f));
            return open;
        }
    }
}
