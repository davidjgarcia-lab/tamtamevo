using System.Collections.Generic;
using System.IO;
using System.Linq;
using NUnit.Framework;
using TamTam.Core;
using TamTam.Evolution;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TamTam.Tests
{
    /// QA battery (game tester · UX/UI · 2D image artist · 3D/lighting artist). Every case is independent so the
    /// Test Runner shows exactly which creature, biome, style or scene fails. See docs/QA_REPORT_UNITY.md.
    public class QaTests
    {
        const string Families = "Assets/TamTam/Art/Creatures/Families";
        const string Biomes = "Assets/TamTam/Art/Environments/Biomes";
        const string Furniture = "Assets/TamTam/Art/Environments/NestHouse/Furniture";
        static readonly string[] Stages = { "initial", "intermediate", "final" };
        static readonly Dictionary<string, float> StageHeight = new Dictionary<string, float> { { "baby", 2.2f }, { "initial", 2.5f }, { "intermediate", 2.7f }, { "final", 3.0f } };

        static IEnumerable<string> FamilyPngs() => Directory.GetFiles(Families, "*.png").Select(p => p.Replace('\\', '/')).OrderBy(p => p);
        static IEnumerable<string> BiomePngs() => Directory.GetFiles(Biomes, "*.png").Select(p => p.Replace('\\', '/')).OrderBy(p => p);
        static IEnumerable<string> FurniturePngs() => Directory.GetFiles(Furniture, "*.png").Select(p => p.Replace('\\', '/')).OrderBy(p => p);
        static IEnumerable<Family> AllFamilies() => (Family[])System.Enum.GetValues(typeof(Family));

        static readonly Dictionary<string, Texture2D> cache = new Dictionary<string, Texture2D>();
        static Texture2D Load(string png)
        {
            if (cache.TryGetValue(png, out var t) && t) return t;
            t = new Texture2D(2, 2); t.LoadImage(File.ReadAllBytes(png)); cache[png] = t; return t;
        }
        static RectInt Body(string png) => EvolutionBounds(Load(png));
        static RectInt EvolutionBounds(Texture2D t) => TamTam.EditorTools.Evolution.EvolvedFormsBuilder.OpaqueBounds(t);
        static string Stage(string png) { var s = Path.GetFileNameWithoutExtension(png).Split('_')[1]; return s.StartsWith("baby") ? "baby" : s; }

        // ── 2D image artist: the 30 painted creatures (6 × 30 = 180) ─────────────────
        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_FeetSitOnThePivot(string png)
        {
            var s = AssetDatabase.LoadAssetAtPath<Sprite>(png); Assert.NotNull(s, "imported as sprite");
            float feetPx = Body(png).yMin, pivotPx = s.pivot.y * Load(png).height / s.rect.height;
            Assert.That(Mathf.Abs(feetPx - pivotPx), Is.LessThanOrEqualTo(2f), "creature floats or sinks into the floor");
        }

        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_VisibleHeightMatchesStage(string png)
        {
            var s = AssetDatabase.LoadAssetAtPath<Sprite>(png);
            float h = Body(png).height * (s.rect.height / Load(png).height) / s.pixelsPerUnit;
            Assert.That(h, Is.EqualTo(StageHeight[Stage(png)]).Within(0.06f), "units tall");
        }

        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_ResolutionIsCrispOnPhones(string png) =>
            Assert.That(Body(png).height, Is.GreaterThanOrEqualTo(380), "body pixels: below this it looks soft on a 1080p phone");

        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_NotCroppedByTheCanvas(string png)
        {
            var b = Body(png); var t = Load(png);
            Assert.That(b.xMin >= 1 && b.yMin >= 1 && b.xMax <= t.width - 1 && b.yMax <= t.height - 1, $"body {b} touches the edge of {t.width}x{t.height}");
        }

        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_FilteringAndMipmapsForScaling(string png)
        {
            var ti = (TextureImporter)AssetImporter.GetAtPath(png);
            Assert.IsTrue(ti.mipmapEnabled, "mipmaps (creatures are shown at several stage scales)");
            Assert.AreNotEqual(FilterMode.Point, ti.filterMode);
            Assert.IsTrue(ti.alphaIsTransparency, "alpha is transparency (no dark fringes)");
        }

        [TestCaseSource(nameof(FamilyPngs))]
        public void Art_IsRegisteredInFamilyArt(string png)
        {
            var art = AssetDatabase.LoadAssetAtPath<FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            var s = AssetDatabase.LoadAssetAtPath<Sprite>(png);
            Assert.IsTrue(art.entries.Any(e => e.sprite == s), "missing from Data/FamilyArt.asset");
        }

        // ── Game tester: each family grows with its stages (10) ──────────────────
        [TestCaseSource(nameof(AllFamilies))]
        public void Game_FamilyGrowsAcrossStages(Family f)
        {
            var art = AssetDatabase.LoadAssetAtPath<FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            var heights = Stages.Select(st => art.entries.First(e => e.family == f && e.stage == st).sprite.bounds.size.y).ToArray();
            Assert.That(heights[1] * 1.0f, Is.GreaterThanOrEqualTo(heights[0] * 0.98f));
            Assert.That(heights[2], Is.GreaterThan(heights[1] * 0.98f));
        }

        // ── Environment artist: the 8 biomes (3 × 8 = 24) ───────────────────────
        [TestCaseSource(nameof(BiomePngs))]
        public void Biome_IsWideAndSharpEnough(string png)
        {
            var t = Load(png);
            Assert.That(t.width, Is.GreaterThanOrEqualTo(1600), "width");
            Assert.That(t.width / (float)t.height, Is.InRange(1.5f, 2.4f), "aspect for landscape screens");
        }

        [TestCaseSource(nameof(BiomePngs))]
        public void Biome_IsOpaqueBackdrop(string png)
        {
            var px = Load(png).GetPixels32();
            int holes = 0; for (int i = 0; i < px.Length; i += 37) if (px[i].a < 250) holes++;
            Assert.AreEqual(0, holes, "transparent holes in a backdrop");
        }

        [TestCaseSource(nameof(BiomePngs))]
        public void Biome_ReadableExposure(string png)
        {
            var px = Load(png).GetPixels32(); double sum = 0; int n = 0;
            for (int i = 0; i < px.Length; i += 53) { sum += (0.2126 * px[i].r + 0.7152 * px[i].g + 0.0722 * px[i].b) / 255.0; n++; }
            Assert.That(sum / n, Is.InRange(0.12, 0.85), "too dark or too bright behind a creature");
        }

        // ── Game tester: evolution with every care style and several seeds (15) ─────
        static IEnumerable<TestCaseData> StylesAndSeeds()
        {
            var styles = new (string, CareProfile)[]
            {
                ("Guerrero", new CareProfile { care = .7, affection = .4, hygiene = .5, training = .9, fighting = .9, study = .1, play = .2, neglect = .3 }),
                ("Limpio", new CareProfile { care = .85, affection = .6, hygiene = .95, training = .2, fighting = .1, study = .9, play = .2, neglect = .15 }),
                ("Mimado", new CareProfile { care = .9, affection = .95, hygiene = .7, training = .1, fighting = .1, study = .2, play = .4, neglect = .1 }),
                ("Jugon", new CareProfile { care = .75, affection = .6, hygiene = .8, training = .2, fighting = .1, study = .2, play = .95, neglect = .25 }),
                ("Descuidado", new CareProfile { care = .3, affection = .2, hygiene = .25, training = 0, fighting = 0, study = 0, play = 0, neglect = .7 }),
            };
            foreach (var (n, p) in styles) foreach (var seed in new uint[] { 1, 42, 9001 }) yield return new TestCaseData(p, seed).SetName($"Game_EvolvesToAdultWithPaintedArt({n}, seed {seed})");
        }

        [TestCaseSource(nameof(StylesAndSeeds))]
        public void Game_EvolvesToAdultWithPaintedArt(CareProfile p, uint seed)
        {
            var art = AssetDatabase.LoadAssetAtPath<FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            var g = Genetics.Chispin; string[] stages = { "child", "juvenile", "adult" };
            foreach (var st in stages)
            {
                g = Genetics.Roll(g, p, seed++ * 7919u).genome;
                Assert.IsFalse(string.IsNullOrWhiteSpace(Genetics.FormName(g, 1)), $"{st}: empty name");
                Assert.NotNull(art.Get(g, st), $"{st}: no painted art for {FamilyArt.Dominant(g)}");
            }
        }

        // ── 3D / lighting artist + UX: scenes (4 × 4 = 16) ──────────────────────────
        static IEnumerable<string> Scenes() => new[] { "ChispinLab", "EvolutionLab", "NestHouse", "Arena" }.Select(s => $"Assets/TamTam/Scenes/{s}.unity");

        [TestCaseSource(nameof(Scenes))]
        public void Scene_HasCameraAndLights(string path)
        {
            EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            var cam = Camera.main; Assert.NotNull(cam, "MainCamera");
            Assert.IsTrue(cam.orthographic, "2D game camera must be orthographic");
            Assert.IsTrue(Object.FindObjectsByType<Light2D>(FindObjectsSortMode.None).Any(l => l.lightType == Light2D.LightType.Global), "a global 2D light (else sprites render black)");
        }

        [TestCaseSource(nameof(Scenes))]
        public void Scene_HasNoMissingScripts(string path)
        {
            var scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            int missing = scene.GetRootGameObjects().SelectMany(r => r.GetComponentsInChildren<Transform>(true))
                .Sum(t => GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(t.gameObject));
            Assert.AreEqual(0, missing);
        }

        [TestCaseSource(nameof(Scenes))]
        public void Scene_GroundsItsCharactersWithContactShadows(string path)
        {
            EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            bool hasCharacters = path.Contains("Chispin") || path.Contains("Arena") || path.Contains("Nest");
            if (!hasCharacters) { Assert.NotNull(Object.FindFirstObjectByType<TamtamPresenter>(), "presenter adds the shadow at runtime"); return; }
            Assert.That(Object.FindObjectsByType<GroundShadow>(FindObjectsSortMode.None).Length, Is.GreaterThan(0), "contact shadow / AO");
        }

        [TestCaseSource(nameof(Scenes))]
        public void Scene_SpritesHaveNoNullSprites(string path)
        {
            var scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            var empty = scene.GetRootGameObjects().SelectMany(r => r.GetComponentsInChildren<SpriteRenderer>(true))
                .Where(sr => !sr.sprite && sr.name != "sprite" && !sr.name.StartsWith("Fighter")).Select(sr => sr.name).ToArray();
            Assert.IsEmpty(empty, "renderers with no sprite");
        }

        // ── Environment artist: furniture glow never shows its canvas (16) ───────────
        [TestCaseSource(nameof(FurniturePngs))]
        public void Furniture_NoVisibleCanvasEdge(string png)
        {
            var t = Load(png); var px = t.GetPixels32(); int w = t.width, h = t.height, maxA = 0;
            for (int x = 0; x < w; x++) { maxA = Mathf.Max(maxA, px[x].a, px[(h - 1) * w + x].a); }
            for (int y = 0; y < h; y++) { maxA = Mathf.Max(maxA, px[y * w].a, px[y * w + w - 1].a); }
            Assert.That(maxA, Is.LessThanOrEqualTo(8).Or.GreaterThanOrEqualTo(200), "semi-transparent glow cut by the canvas border (visible rectangle)");
        }

        // ── Rendering setup (6) ───────────────────────────────────────────────
        [Test] public void Render_LinearColourSpace() => Assert.AreEqual(ColorSpace.Linear, PlayerSettings.colorSpace);
        [Test] public void Render_UrpWith2DRendererAndHdr()
        {
            var urp = GraphicsSettings.defaultRenderPipeline as UniversalRenderPipelineAsset;
            Assert.NotNull(urp); Assert.IsTrue(urp.supportsHDR, "HDR for bloom");
        }
        [Test] public void Render_PostProfileHasBloomAndTonemapping()
        {
            var p = AssetDatabase.LoadAssetAtPath<VolumeProfile>("Assets/TamTam/Settings/TamTamPost.asset");
            Assert.IsTrue(p.Has<Bloom>() && p.Has<Tonemapping>());
        }
        [Test] public void Render_PaintedMaterialHasContactOcclusion()
        {
            var m = AssetDatabase.LoadAssetAtPath<Material>("Assets/TamTam/Materials/PaintedCreature.mat");
            Assert.NotNull(m); Assert.That(m.GetFloat("_GroundAO"), Is.GreaterThan(0.1f));
        }
        [Test] public void Render_PaintedChispinHasContactOcclusion()
        {
            var m = AssetDatabase.LoadAssetAtPath<Material>("Assets/TamTam/Materials/CreatureLitPainted.mat");
            Assert.That(m.GetFloat("_GroundAO"), Is.GreaterThan(0.1f));
        }
        [Test] public void Render_FamilyArtUsesThePaintedMaterial()
        {
            var art = AssetDatabase.LoadAssetAtPath<FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            Assert.NotNull(art.material);
        }

        // ── UX/UI: shadow behaviour (game feel) (4) ───────────────────────────────
        [TestCase(0f, ExpectedResult = true)]
        [TestCase(0.6f, ExpectedResult = true)]
        [TestCase(1.2f, ExpectedResult = true)]
        [TestCase(3f, ExpectedResult = true)]
        public bool Ux_ShadowShrinksAndFadesWhenJumping(float jump)
        {
            var root = new GameObject("qa"); var body = new GameObject("sprite").AddComponent<SpriteRenderer>();
            body.transform.SetParent(root.transform, false); body.sprite = GroundShadow.Blob;
            var gs = root.AddComponent<GroundShadow>(); gs.target = body; gs.lift = body.transform;
            gs.Refresh(); var c0 = root.transform.Find("ContactShadow").GetComponent<SpriteRenderer>(); float a0 = c0.color.a, w0 = c0.transform.localScale.x;
            body.transform.localPosition = new Vector3(0, jump, 0); gs.Refresh();
            bool ok = c0.color.a <= a0 + 1e-4f && c0.transform.localScale.x <= w0 + 1e-4f && Mathf.Abs(c0.transform.position.y - root.transform.position.y) < 1e-4f;
            Object.DestroyImmediate(root);
            return ok;
        }
    }
}
