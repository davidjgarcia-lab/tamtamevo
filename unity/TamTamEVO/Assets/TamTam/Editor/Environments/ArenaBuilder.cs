using System.IO;
using System.Linq;
using TamTam.Evolution;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TamTam.EditorTools.Environments
{
    /// Arena scene: the 8 painted biomes (Art/Environments/Biomes) as backdrop and two painted final-stage Tamtams.
    public static class ArenaBuilder
    {
        const string BiomeDir = "Assets/TamTam/Art/Environments/Biomes";
        const string ScenePath = "Assets/TamTam/Scenes/Arena.unity";

        public static Sprite[] ImportBiomes()
        {
            var sprites = Directory.GetFiles(BiomeDir, "*.png").Select(p => p.Replace('\\', '/')).OrderBy(p => p).Select(p =>
            {
                var ti = (TextureImporter)AssetImporter.GetAtPath(p);
                ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single;
                ti.mipmapEnabled = false; ti.maxTextureSize = 4096; ti.textureCompression = TextureImporterCompression.CompressedHQ;
                ti.spritePixelsPerUnit = 100; ti.SaveAndReimport();
                return AssetDatabase.LoadAssetAtPath<Sprite>(p);
            }).ToArray();
            Debug.Log($"TamTam: {sprites.Length} biomes imported.");
            return sprites;
        }

        static SpriteRenderer Fighter(FamilyArt art, string name, float x, bool facingLeft)
        {
            var pc = art.Spawn(null, null, name);
            pc.transform.position = new Vector3(x, -2.2f, 0);
            pc.transform.localScale = Vector3.one * 1.05f;
            pc.body.flipX = facingLeft; pc.body.sortingOrder = 10;
            return pc.body;
        }

        static void AddPoint(string name, Vector3 pos, Color c, float intensity, float radius)
        {
            var l = new GameObject(name).AddComponent<Light2D>();
            l.transform.position = pos; l.lightType = Light2D.LightType.Point; l.color = c; l.intensity = intensity;
            l.pointLightOuterRadius = radius; l.pointLightInnerRadius = radius * 0.15f; l.falloffIntensity = 0.6f;
        }

        [MenuItem("TamTam/Entornos/3 · Construir escena Arena (biomas)")]
        public static void BuildScene()
        {
            RenderSetup.Setup();
            var biomes = ImportBiomes();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cam = new GameObject("Main Camera").AddComponent<Camera>();
            cam.tag = "MainCamera"; cam.orthographic = true; cam.orthographicSize = 3.4f; cam.transform.position = new Vector3(0, 0, -10);
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = new Color32(0x17, 0x13, 0x2B, 255);
            cam.gameObject.AddComponent<UniversalAdditionalCameraData>().renderPostProcessing = true;
            var vol = new GameObject("Global Volume").AddComponent<Volume>();
            vol.isGlobal = true; vol.sharedProfile = RenderSetup.EnsurePostProfile();
            var light = new GameObject("Global Light 2D").AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Global; light.intensity = 0.9f;

            var bg = new GameObject("Backdrop").AddComponent<SpriteRenderer>();
            bg.sortingOrder = -100;
            var demo = new GameObject("Arena").AddComponent<ArenaDemo>();
            demo.backdrop = bg; demo.biomes = biomes; demo.cam = cam;
            demo.familyArt = AssetDatabase.LoadAssetAtPath<FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            demo.left = Fighter(demo.familyArt, "Fighter_L", -3.2f, false);
            demo.right = Fighter(demo.familyArt, "Fighter_R", 3.2f, true);
            AddPoint("Key", new Vector3(-4f, 3.5f, 0), new Color(1f, 0.92f, 0.8f), 0.45f, 9f);
            AddPoint("Rim", new Vector3(4.5f, 2.5f, 0), new Color(0.6f, 0.7f, 1f), 0.3f, 6f);
            demo.Apply();
            EditorSceneManager.SaveScene(scene, ScenePath);
            var list = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).ToList();
            list.Add(new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = list.ToArray();
            Debug.Log($"TamTam: {ScenePath} built with {biomes.Length} biomes.");
        }

        /// Contact sheet of the 8 biomes with a pair of fighters each (batch verification).
        public static void RenderSheet()
        {
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            var demo = Object.FindFirstObjectByType<ArenaDemo>();
            var cam = Camera.main;
            const int W = 800, H = 450, COLS = 4;
            int rows = Mathf.CeilToInt(demo.biomes.Length / (float)COLS);
            var sheet = new Texture2D(W * COLS, H * rows, TextureFormat.RGBA32, false);
            var rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32);
            cam.targetTexture = rt; cam.Render();
            var read = new Texture2D(W, H, TextureFormat.RGBA32, false);
            var fams = (TamTam.Core.Family[])System.Enum.GetValues(typeof(TamTam.Core.Family));
            for (int i = 0; i < demo.biomes.Length; i++)
            {
                typeof(ArenaDemo).GetField("famL", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).SetValue(demo, i % fams.Length);
                typeof(ArenaDemo).GetField("famR", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).SetValue(demo, (i + 5) % fams.Length);
                demo.SetBiome(i);
                foreach (var gs in Object.FindObjectsByType<GroundShadow>(FindObjectsSortMode.None)) gs.Refresh();
                cam.Render();
                RenderTexture.active = rt; read.ReadPixels(new Rect(0, 0, W, H), 0, 0); read.Apply();
                sheet.SetPixels((i % COLS) * W, (rows - 1 - i / COLS) * H, W, H, read.GetPixels());
            }
            sheet.Apply(); RenderTexture.active = null; cam.targetTexture = null;
            var outDir = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/media/unity"));
            Directory.CreateDirectory(outDir);
            File.WriteAllBytes(Path.Combine(outDir, "arena-biomes.png"), sheet.EncodeToPNG());
            Debug.Log("TamTam: arena sheet saved");
        }
    }
}
