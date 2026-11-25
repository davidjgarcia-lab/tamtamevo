using System.Collections;
using UnityEngine;

namespace TamTam.Vfx
{
    /// Gameplay effects (one-shot): egg hatching, evolution ritual, hits/criticals, bath, eating. Colours come from
    /// the family glow (style guide). Every burst cleans itself up; nothing persists except the hybrid aura.
    public static class GameVfx
    {
        static ParticleSystem Burst(Vector3 pos, VfxShape shape, bool additive, Color a, Color b, int count, float life, float size,
            float speed, float gravity = 0, float spin = 0, int order = 60, float radius = 0.1f, bool converge = false)
        {
            var go = new GameObject($"burst_{shape}");
            go.transform.position = pos;
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.loop = false; main.duration = life; main.playOnAwake = false;
            main.startLifetime = new ParticleSystem.MinMaxCurve(life * 0.6f, life);
            main.startSpeed = converge ? 0 : new ParticleSystem.MinMaxCurve(speed * 0.5f, speed);
            main.startSize = new ParticleSystem.MinMaxCurve(size * 0.5f, size);
            main.startColor = new ParticleSystem.MinMaxGradient(a, b);
            main.gravityModifier = gravity; main.maxParticles = count + 4;
            main.simulationSpace = ParticleSystemSimulationSpace.World; main.stopAction = ParticleSystemStopAction.Destroy;
            if (spin != 0) main.startRotation = new ParticleSystem.MinMaxCurve(0, Mathf.PI * 2);
            var em = ps.emission; em.rateOverTime = 0; em.SetBursts(new[] { new ParticleSystem.Burst(0, (short)count) });
            var sh = ps.shape; sh.shapeType = ParticleSystemShapeType.Circle; sh.radius = radius; sh.radiusThickness = converge ? 0 : 1;
            if (converge)
            {
                var vel = ps.velocityOverLifetime; vel.enabled = true; vel.radial = new ParticleSystem.MinMaxCurve(-speed);
                vel.x = vel.y = vel.z = new ParticleSystem.MinMaxCurve(0);
            }
            if (spin != 0) { var r = ps.rotationOverLifetime; r.enabled = true; r.z = new ParticleSystem.MinMaxCurve(-spin * Mathf.Deg2Rad, spin * Mathf.Deg2Rad); }
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(Color.white, 1) },
                new[] { new GradientAlphaKey(1, 0), new GradientAlphaKey(0.8f, 0.5f), new GradientAlphaKey(0, 1) });
            col.color = g;
            var sz = ps.sizeOverLifetime; sz.enabled = true; sz.size = new ParticleSystem.MinMaxCurve(1, AnimationCurve.EaseInOut(0, 1, 1, 0.3f));
            var pr = go.GetComponent<ParticleSystemRenderer>();
            var lib = VfxLibrary.Instance; pr.sharedMaterial = lib ? lib.Get(shape, additive) : null; pr.sortingOrder = order;
            ps.Play();
            return ps;
        }

        /// Big soft additive flash that grows and fades (light reveal).
        static void Flash(Vector3 pos, Color c, float size, float life, int order = 70)
        {
            var ps = Burst(pos, VfxShape.Dot, true, c, c, 1, life, size, 0, order: order, radius: 0.001f);
            var sz = ps.sizeOverLifetime; sz.size = new ParticleSystem.MinMaxCurve(1, AnimationCurve.EaseInOut(0, 0.3f, 1, 1.4f));
        }

        public static void Hatch(Vector3 feet, Color glow)
        {
            var c = feet + Vector3.up * 0.8f;
            Burst(c, VfxShape.Shard, false, new Color(1f, 0.96f, 0.86f), new Color(0.93f, 0.85f, 0.7f), 22, 1.1f, 0.14f, 3.2f, gravity: 1.4f, spin: 540);
            Flash(c, glow * 1.6f, 4f, 0.7f);
            Burst(c, VfxShape.Sparkle, true, glow, Color.white, 16, 1.0f, 0.16f, 2.2f, spin: 180);
            CameraShake.Add(0.06f);
        }

        public static IEnumerator EvolveRitual(Vector3 feet, Color glow, float charge = 0.9f)
        {
            var c = feet + Vector3.up * 1.2f;
            Burst(c, VfxShape.Dot, true, glow, Color.white, 34, charge, 0.09f, 2.4f, radius: 2.2f, converge: true);
            yield return new WaitForSeconds(charge * 0.85f);
            Flash(c, Color.white * 1.8f, 6f, 0.55f);
            Burst(c, VfxShape.Sparkle, true, glow, Color.white, 28, 1.2f, 0.2f, 3.5f, spin: 200);
            Burst(c, VfxShape.Ring, true, glow, glow, 10, 0.8f, 0.3f, 4f);
            CameraShake.Add(0.08f);
        }

        public static void Hit(Vector3 at, bool critical, Color glow)
        {
            Burst(at, VfxShape.Sparkle, true, Color.white, glow, critical ? 26 : 12, 0.45f, critical ? 0.22f : 0.15f, critical ? 5f : 3.5f, spin: 300);
            if (critical) { Flash(at, Color.white * 2f, 2.4f, 0.25f); CameraShake.Add(0.12f); }
            else CameraShake.Add(0.04f);
        }

        public static void Bath(Vector3 feet, float width)
        {
            var c = feet + Vector3.up * 0.6f;
            Burst(c, VfxShape.Ring, false, new Color(1, 1, 1, 0.9f), new Color(0.8f, 0.95f, 1f, 0.8f), 26, 2.2f, 0.22f, 0.6f, gravity: -0.05f, radius: width * 0.45f);
            Burst(c + Vector3.up * 0.8f, VfxShape.Dot, false, new Color(0.62f, 0.9f, 1f, 0.9f), new Color(0.85f, 0.97f, 1f, 0.8f), 30, 0.9f, 0.06f, 2.5f, gravity: 1.6f, radius: width * 0.3f);
        }

        public static void Eat(Vector3 mouth)
        {
            Burst(mouth, VfxShape.Shard, false, new Color(0.85f, 0.58f, 0.29f), new Color(0.98f, 0.82f, 0.5f), 12, 0.8f, 0.07f, 1.6f, gravity: 2.2f, spin: 360);
        }

        /// Persistent hybrid aura: a slow ring of the second family's glow orbiting the body (replaces a flat disc).
        public static ParticleSystem Aura(Transform creature, Bounds bounds, Color glow, int order)
        {
            var l = new FamilyVfx.Layer { shape = VfxShape.Dot, additive = true, color = glow, color2 = Color.Lerp(glow, Color.white, 0.4f), rate = 10, life = 2.4f, size = 0.08f, speedUp = 0.05f, spreadX = 0.2f, orbit = true };
            var ps = FamilyVfx.Build(creature, l, bounds, order);
            ps.gameObject.name = "HybridAura";
            var sh = ps.shape; sh.radius = Mathf.Max(bounds.extents.x, bounds.extents.y) * 0.8f;
            return ps;
        }
    }
}
