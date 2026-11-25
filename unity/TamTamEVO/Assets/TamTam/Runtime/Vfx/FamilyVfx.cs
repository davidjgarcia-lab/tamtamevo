using TamTam.Core;
using UnityEngine;

namespace TamTam.Vfx
{
    /// Particle signature per family (docs/STYLE_GUIDE_UNITY.md §2, colours from catalog.json particleColor/glow).
    /// Cheap by design: ≤ 2 emitters per creature, ≤ 40 live particles, no collision, no lights.
    public static class FamilyVfx
    {
        public struct Layer
        {
            public VfxShape shape; public bool additive; public Color color, color2; public float rate, life, size, speedUp, spreadX, gravity, noise, spin;
            public bool fromFeet, stretch, orbit, trail, rainbow;
        }

        static Color C(string hex) => ColorUtility.TryParseHtmlString(hex, out var c) ? c : Color.white;

        public static Layer[] Of(Family f) => f switch
        {
            Family.fire => new[]
            {
                new Layer { shape = VfxShape.Dot, additive = true, color = C("#FFD166"), color2 = C("#FF7A24"), rate = 6, life = 1.4f, size = 0.07f, speedUp = 0.7f, spreadX = 0.35f, noise = 0.3f },
                new Layer { shape = VfxShape.Puff, additive = false, color = new Color(1f, 0.55f, 0.3f, 0.10f), color2 = new Color(1f, 0.8f, 0.6f, 0f), rate = 2, life = 1.6f, size = 0.5f, speedUp = 0.5f, spreadX = 0.3f, noise = 0.5f },
            },
            Family.water => new[]
            {
                new Layer { shape = VfxShape.Ring, additive = true, color = C("#9FE6FF"), color2 = C("#E6FBFF"), rate = 3, life = 2.2f, size = 0.1f, speedUp = 0.35f, spreadX = 0.45f, noise = 0.35f },
                new Layer { shape = VfxShape.Dot, additive = false, color = C("#5CE6FF"), color2 = C("#9FF0FF"), rate = 2, life = 0.9f, size = 0.05f, speedUp = 0.4f, spreadX = 0.4f, gravity = 1.2f },
            },
            Family.plant => new[]
            {
                new Layer { shape = VfxShape.Leaf, additive = false, color = C("#9BE15D"), color2 = C("#6E8F2E"), rate = 1.6f, life = 3f, size = 0.12f, speedUp = -0.15f, spreadX = 0.6f, noise = 0.4f, spin = 120 },
                new Layer { shape = VfxShape.Dot, additive = true, color = C("#E8FFB0"), color2 = C("#D4FF8A"), rate = 3, life = 2.4f, size = 0.04f, speedUp = 0.15f, spreadX = 0.6f, noise = 0.5f },
            },
            Family.electric => new[]
            {
                new Layer { shape = VfxShape.Sparkle, additive = true, color = C("#FFE45C"), color2 = C("#9FE8FF"), rate = 7, life = 0.35f, size = 0.1f, speedUp = 0.2f, spreadX = 0.5f, noise = 1.2f, stretch = true },
            },
            Family.rock => new[]
            {
                new Layer { shape = VfxShape.Puff, additive = false, color = new Color(0.79f, 0.64f, 0.48f, 0.16f), color2 = new Color(0.79f, 0.64f, 0.48f, 0f), rate = 1.5f, life = 1.6f, size = 0.45f, speedUp = 0.1f, spreadX = 0.5f, fromFeet = true },
                new Layer { shape = VfxShape.Shard, additive = false, color = C("#C9A27A"), color2 = C("#6B5340"), rate = 1, life = 0.8f, size = 0.06f, speedUp = 0.6f, spreadX = 0.4f, gravity = 1.6f, spin = 360, fromFeet = true },
            },
            Family.shadow => new[]
            {
                new Layer { shape = VfxShape.Puff, additive = false, color = new Color(0.61f, 0.42f, 0.88f, 0.16f), color2 = new Color(0.23f, 0.12f, 0.42f, 0f), rate = 3, life = 2.6f, size = 0.7f, speedUp = 0.08f, spreadX = 0.6f, noise = 0.3f, fromFeet = true },
            },
            Family.light => new[]
            {
                new Layer { shape = VfxShape.Sparkle, additive = true, color = C("#FFF0B0"), color2 = C("#FFFFFF"), rate = 3, life = 1.2f, size = 0.12f, speedUp = 0.25f, spreadX = 0.6f, spin = 90 },
                new Layer { shape = VfxShape.Leaf, additive = false, color = new Color(1f, 0.98f, 0.92f, 0.9f), color2 = new Color(1f, 0.95f, 0.85f, 0f), rate = 0.7f, life = 3.2f, size = 0.12f, speedUp = -0.12f, spreadX = 0.6f, noise = 0.3f, spin = 60 },
            },
            Family.crystal => new[]
            {
                new Layer { shape = VfxShape.Sparkle, additive = true, color = C("#C8F4FF"), color2 = C("#FFFFFF"), rate = 4, life = 0.9f, size = 0.11f, speedUp = 0.1f, spreadX = 0.55f, spin = 180, rainbow = true },
            },
            Family.plasma => new[]
            {
                new Layer { shape = VfxShape.Dot, additive = true, color = C("#E3A6FF"), color2 = C("#FF7BE0"), rate = 2, life = 2.2f, size = 0.09f, speedUp = 0.05f, spreadX = 0.2f, orbit = true, trail = true },
            },
            Family.mystic => new[]
            {
                new Layer { shape = VfxShape.Rune, additive = true, color = C("#FFC2EC"), color2 = C("#9EE8FF"), rate = 1.2f, life = 2.4f, size = 0.16f, speedUp = 0.3f, spreadX = 0.5f, spin = 45 },
                new Layer { shape = VfxShape.Dot, additive = true, color = C("#9EE8FF"), color2 = C("#FFC2EC"), rate = 3, life = 1.8f, size = 0.035f, speedUp = 0.2f, spreadX = 0.6f, noise = 0.6f },
            },
            _ => new Layer[0],
        };

        /// Attaches the family signature to a creature. bounds = the creature's visible sprite bounds (world).
        public static GameObject Attach(Transform creature, Family f, Bounds bounds, int sortingOrder)
        {
            var root = new GameObject($"VFX_{f}");
            root.transform.SetParent(creature, false);
            int i = 0;
            foreach (var l in Of(f)) Build(root.transform, l, bounds, sortingOrder + 2 + i++);
            return root;
        }

        public static ParticleSystem Build(Transform parent, Layer l, Bounds bounds, int order)
        {
            var go = new GameObject(l.shape.ToString());
            go.transform.SetParent(parent, false);
            var local = parent.InverseTransformPoint(new Vector3(bounds.center.x, l.fromFeet ? bounds.min.y + 0.05f : bounds.center.y, 0));
            go.transform.localPosition = local;
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.loop = true; main.playOnAwake = true; main.duration = 2;
            main.startLifetime = new ParticleSystem.MinMaxCurve(l.life * 0.7f, l.life);
            main.startSpeed = 0; main.startSize = new ParticleSystem.MinMaxCurve(l.size * 0.6f, l.size);
            main.startColor = new ParticleSystem.MinMaxGradient(l.color, l.color2);
            main.simulationSpace = ParticleSystemSimulationSpace.World; main.maxParticles = 40;
            main.gravityModifier = l.gravity;
            if (l.spin != 0) main.startRotation = new ParticleSystem.MinMaxCurve(0, Mathf.PI * 2);
            var em = ps.emission; em.rateOverTime = l.rate;
            var shape = ps.shape; shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(Mathf.Max(0.1f, bounds.size.x * l.spreadX), l.fromFeet ? 0.05f : bounds.size.y * 0.6f, 0.01f);
            var vel = ps.velocityOverLifetime; vel.enabled = true; vel.space = ParticleSystemSimulationSpace.World;
            vel.x = new ParticleSystem.MinMaxCurve(-0.15f, 0.15f); vel.y = new ParticleSystem.MinMaxCurve(l.speedUp * 0.6f, l.speedUp); vel.z = new ParticleSystem.MinMaxCurve(0, 0);
            if (l.orbit) { vel.orbitalZ = new ParticleSystem.MinMaxCurve(1.6f, 2.4f); vel.radial = new ParticleSystem.MinMaxCurve(0, 0); shape.shapeType = ParticleSystemShapeType.Circle; shape.radius = bounds.size.x * 0.45f; shape.radiusThickness = 0; }
            if (l.noise > 0) { var n = ps.noise; n.enabled = true; n.strength = l.noise; n.frequency = 0.8f; n.quality = ParticleSystemNoiseQuality.Low; }
            if (l.spin != 0) { var rot = ps.rotationOverLifetime; rot.enabled = true; rot.z = new ParticleSystem.MinMaxCurve(-l.spin * Mathf.Deg2Rad, l.spin * Mathf.Deg2Rad); }
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            if (l.rainbow)
                g.SetKeys(new[] { new GradientColorKey(new Color(1f, 0.8f, 1f), 0), new GradientColorKey(new Color(0.7f, 0.95f, 1f), 0.5f), new GradientColorKey(new Color(1f, 1f, 0.8f), 1) },
                    new[] { new GradientAlphaKey(0, 0), new GradientAlphaKey(1, 0.15f), new GradientAlphaKey(0, 1) });
            else
                g.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(Color.white, 1) },
                    new[] { new GradientAlphaKey(0, 0), new GradientAlphaKey(1, 0.15f), new GradientAlphaKey(0.8f, 0.6f), new GradientAlphaKey(0, 1) });
            col.color = g;
            var sz = ps.sizeOverLifetime; sz.enabled = true; sz.size = new ParticleSystem.MinMaxCurve(1, AnimationCurve.EaseInOut(0, 0.6f, 1, l.shape == VfxShape.Puff ? 1.6f : 0.4f));
            if (l.trail) { var tr = ps.trails; tr.enabled = true; tr.lifetime = 0.35f; tr.widthOverTrail = new ParticleSystem.MinMaxCurve(1, AnimationCurve.Linear(0, 1, 1, 0)); tr.dieWithParticles = true; }
            var pr = go.GetComponent<ParticleSystemRenderer>();
            var lib = VfxLibrary.Instance;
            pr.sharedMaterial = lib ? lib.Get(l.shape, l.additive) : null;
            if (l.trail && lib) pr.trailMaterial = lib.Get(VfxShape.Dot, true);
            pr.sortingOrder = order;
            if (l.stretch) { pr.renderMode = ParticleSystemRenderMode.Stretch; pr.velocityScale = 0.08f; pr.lengthScale = 2.5f; }
            ps.Play();
            return ps;
        }
    }
}
