using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TamTam.EditorTools.Rendering
{
    /// Art direction in Unity (docs/STYLE_GUIDE_UNITY.md): one global post-processing profile and one profile per
    /// scene layered on top (higher priority, only the overrides it needs), plus an audit of how sharp every sprite
    /// renders at its in-game size.
    public static class StyleSetup
    {
        public const string Dir = "Assets/TamTam/Rendering";
        public const string Global = Dir + "/TamTamGlobal.asset";

        public enum SceneLook { NestHouse_Day, NestHouse_Night, EvolutionLab, Arena, ChispinLab }

        [MenuItem("TamTam/Estilo/Crear perfiles de post-proceso")]
        public static void CreateProfiles()
        {
            Directory.CreateDirectory(Dir);
            Profile(Global, p =>
            {
                var t = p.Add<Tonemapping>(true); t.mode.Override(TonemappingMode.Neutral);
                var b = p.Add<Bloom>(true); b.threshold.Override(1.0f); b.intensity.Override(0.9f); b.scatter.Override(0.62f); b.highQualityFiltering.Override(false);
                var c = p.Add<ColorAdjustments>(true); c.saturation.Override(6f); c.contrast.Override(4f);
                var v = p.Add<Vignette>(true); v.intensity.Override(0.18f); v.smoothness.Override(0.5f); v.color.Override(new Color(0.09f, 0.075f, 0.17f));
            });
            foreach (SceneLook look in System.Enum.GetValues(typeof(SceneLook)))
                Profile($"{Dir}/{look}.asset", p =>
                {
                    var c = p.Add<ColorAdjustments>(true); var w = p.Add<WhiteBalance>(true); var v = p.Add<Vignette>(true);
                    switch (look)
                    {
                        case SceneLook.NestHouse_Day: c.postExposure.Override(0.1f); c.contrast.Override(-5f); w.temperature.Override(6f); break;
                        case SceneLook.NestHouse_Night: c.postExposure.Override(-0.6f); c.saturation.Override(-10f); w.temperature.Override(-12f); v.intensity.Override(0.32f); break;
                        case SceneLook.EvolutionLab: c.contrast.Override(8f); v.intensity.Override(0.24f); break;
                        case SceneLook.Arena: c.saturation.Override(-8f); v.intensity.Override(0.22f); break;
                        case SceneLook.ChispinLab: c.contrast.Override(6f); v.intensity.Override(0.26f); break;
                    }
                });
            AssetDatabase.SaveAssets();
            Debug.Log("TamTam: style profiles ready (global + 5 scene looks).");
        }

        static void Profile(string path, System.Action<VolumeProfile> fill)
        {
            AssetDatabase.DeleteAsset(path);
            var p = ScriptableObject.CreateInstance<VolumeProfile>();
            AssetDatabase.CreateAsset(p, path);
            fill(p);
            foreach (var c in p.components) { c.hideFlags = HideFlags.HideInInspector | HideFlags.HideInHierarchy; AssetDatabase.AddObjectToAsset(c, p); }
            EditorUtility.SetDirty(p);
        }

        /// Adds the global volume (priority 0) and the scene look (priority 1, overrides only what it sets).
        public static Volume AddVolumes(SceneLook look, string name = null)
        {
            if (!File.Exists(Global)) CreateProfiles();
            var g = new GameObject("Volume · Global (TamTamGlobal)").AddComponent<Volume>();
            g.isGlobal = true; g.priority = 0; g.sharedProfile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(Global);
            var s = new GameObject(name ?? $"Volume · {look}").AddComponent<Volume>();
            s.isGlobal = true; s.priority = 1; s.sharedProfile = AssetDatabase.LoadAssetAtPath<VolumeProfile>($"{Dir}/{look}.asset");
            return s;
        }

        /// Turns on normal-map lighting (volume on the painted art) and, for the key light, projected 2D shadows.
        public static void LightFeatures(Light2D l, bool shadows, bool normals, float shadowStrength = 0.35f)
        {
            var so = new SerializedObject(l);
            var q = so.FindProperty("m_NormalMapQuality");
            if (q != null && normals) { int i = System.Array.IndexOf(q.enumNames, "Accurate"); q.enumValueIndex = i >= 0 ? i : 0; }
            var d = so.FindProperty("m_NormalMapDistance"); if (d != null) d.floatValue = 2.5f;
            so.ApplyModifiedPropertiesWithoutUndo();
            l.shadowsEnabled = shadows; l.shadowIntensity = shadowStrength;
        }

        public static Light2D Point(string name, Vector3 pos, string hex, float intensity, float radius, bool shadows = false, bool normals = true)
        {
            var l = new GameObject(name).AddComponent<Light2D>();
            l.transform.position = pos; l.lightType = Light2D.LightType.Point;
            l.color = ColorUtility.TryParseHtmlString(hex, out var c) ? c : Color.white; l.intensity = intensity;
            l.pointLightOuterRadius = radius; l.pointLightInnerRadius = radius * 0.15f; l.falloffIntensity = 0.6f;
            LightFeatures(l, shadows, normals);
            return l;
        }

        // ── Import audit (sharpness and apparent scale) ──────────────────────────
        /// Unified import parameters for user art: bilinear, mipmaps on sprites that are shown smaller than source,
        /// high-quality compression, max size large enough not to downscale the source. Then writes a report with the
        /// texel density each sprite gets on a 1080-px-tall phone screen (1.0 = one texel per screen pixel).
        [MenuItem("TamTam/Estilo/Auditar importación de sprites")]
        public static void AuditImports()
        {
            var rows = new List<(string group, string name, int w, int h, float density, string note)>();
            void Each(string dir, string group, float orthoSize, float shownHeightUnits, bool mip)
            {
                foreach (var png in Directory.GetFiles(dir, "*.png").Select(p => p.Replace('\\', '/')).OrderBy(p => p))
                {
                    var ti = (TextureImporter)AssetImporter.GetAtPath(png);
                    if (!ti) continue;
                    var t = new Texture2D(2, 2); t.LoadImage(File.ReadAllBytes(png));
                    bool changed = ti.filterMode != FilterMode.Bilinear || ti.mipmapEnabled != mip || ti.maxTextureSize < Mathf.NextPowerOfTwo(Mathf.Max(t.width, t.height))
                                   || ti.textureCompression != TextureImporterCompression.CompressedHQ;
                    ti.filterMode = FilterMode.Bilinear; ti.mipmapEnabled = mip; ti.alphaIsTransparency = true;
                    ti.maxTextureSize = Mathf.Max(ti.maxTextureSize, Mathf.NextPowerOfTwo(Mathf.Max(t.width, t.height)));
                    ti.textureCompression = TextureImporterCompression.CompressedHQ;
                    if (changed) ti.SaveAndReimport();
                    var s = AssetDatabase.LoadAssetAtPath<Sprite>(png);
                    float screenPxPerUnit = 1080f / (orthoSize * 2);
                    float texelsPerUnit = s ? s.pixelsPerUnit : 100;
                    if (group == "Bioma") texelsPerUnit = t.height / (orthoSize * 2); // backdrops are scaled to cover the screen
                    float density = texelsPerUnit / screenPxPerUnit;
                    string note = density >= 0.9f ? "nítido" : density >= 0.6f ? "algo blando" : "blando: resolución de origen baja (PROVISIONAL)";
                    rows.Add((group, Path.GetFileNameWithoutExtension(png), t.width, t.height, density, note));
                    Object.DestroyImmediate(t);
                }
            }
            Each("Assets/TamTam/Art/Creatures/Families", "Criatura", 2.7f, 3f, true);
            Each("Assets/TamTam/Art/Environments/NestHouse/Props", "Objeto", 6.75f, 1.5f, true);
            Each("Assets/TamTam/Art/Environments/Biomes", "Bioma", 3.4f, 6.8f, false);
            var sb = new StringBuilder();
            sb.AppendLine("# Auditoría de importación (generada por TamTam ▸ Estilo ▸ Auditar importación de sprites)\n");
            sb.AppendLine("Densidad = texels por píxel de pantalla en un móvil de 1080 px de alto con la cámara de su escena (1,0 = nítido; <0,6 = blando).\n");
            sb.AppendLine("| Tipo | Sprite | Origen | Densidad | Lectura |\n|---|---|---|---|---|");
            foreach (var r in rows) sb.AppendLine($"| {r.group} | {r.name} | {r.w}×{r.h} | {r.density:0.00} | {r.note} |");
            var outPath = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/IMPORT_AUDIT_UNITY.md"));
            File.WriteAllText(outPath, sb.ToString());
            Debug.Log($"TamTam: import audit → {outPath} ({rows.Count} sprites, {rows.Count(r => r.density < 0.6f)} soft)");
        }
    }
}
