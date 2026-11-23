using System;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TamTam.EditorTools
{
    /// Phase 1/2 rendering foundation: URP with the 2D Renderer (2D lights), HDR, linear colour, and a
    /// post-processing profile with Bloom + tonemapping + colour grading for glowing creatures.
    public static class RenderSetup
    {
        public const string Dir = "Assets/TamTam/Settings";
        public const string PipelinePath = Dir + "/TamTamURP.asset";
        public const string RendererPath = Dir + "/TamTam2DRenderer.asset";
        public const string ProfilePath = Dir + "/TamTamPost.asset";

        [MenuItem("TamTam/Setup URP 2D + Bloom")]
        public static void Setup()
        {
            Directory.CreateDirectory(Dir);
            var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath);
            if (!pipeline)
            {
                var renderer = AssetDatabase.LoadAssetAtPath<Renderer2DData>(RendererPath) ?? CreateRenderer2D(RendererPath);
                pipeline = UniversalRenderPipelineAsset.Create(renderer);
                AssetDatabase.CreateAsset(pipeline, PipelinePath);
            }
            pipeline.supportsHDR = true;
            pipeline.msaaSampleCount = 1;
            EditorUtility.SetDirty(pipeline);

            GraphicsSettings.defaultRenderPipeline = pipeline;
            int current = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = pipeline;
            }
            QualitySettings.SetQualityLevel(current, false);

            PlayerSettings.colorSpace = ColorSpace.Linear;
            // Input System package installed → enable both backends (IMGUI demo + new input).
            var ps = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset").FirstOrDefault();
            if (ps)
            {
                var so = new SerializedObject(ps);
                var p = so.FindProperty("activeInputHandler");
                if (p != null && p.intValue != 2) { p.intValue = 2; so.ApplyModifiedPropertiesWithoutUndo(); }
            }

            EnsurePostProfile();
            AssetDatabase.SaveAssets();
            Debug.Log("TamTam: URP 2D renderer, HDR, linear colour and bloom profile ready.");
        }

        static Renderer2DData CreateRenderer2D(string path)
        {
            // Same code path as Assets ▸ Create ▸ Rendering ▸ URP 2D Renderer (internal in URP 17).
            var menus = Type.GetType("UnityEditor.Rendering.Universal.Renderer2DMenus, Unity.RenderPipelines.Universal.Editor");
            var m = menus?.GetMethod("CreateRendererAsset", BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            if (m != null)
            {
                var typeParam = m.GetParameters()[1].ParameterType;
                var data = m.Invoke(null, new object[] { path, Enum.Parse(typeParam, "_2DRenderer"), false, "Renderer" }) as Renderer2DData;
                if (data) return data;
            }
            var fallback = ScriptableObject.CreateInstance<Renderer2DData>();
            AssetDatabase.CreateAsset(fallback, path);
            ResourceReloader.ReloadAllNullIn(fallback, "Packages/com.unity.render-pipelines.universal");
            return fallback;
        }

        public static VolumeProfile EnsurePostProfile()
        {
            var profile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(ProfilePath);
            if (profile) return profile;
            profile = ScriptableObject.CreateInstance<VolumeProfile>();
            AssetDatabase.CreateAsset(profile, ProfilePath);

            var bloom = profile.Add<Bloom>(true);
            bloom.threshold.Override(1.0f);
            bloom.intensity.Override(1.15f);
            bloom.scatter.Override(0.68f);
            bloom.tint.Override(new Color(1f, 0.86f, 0.7f));
            bloom.highQualityFiltering.Override(true);

            var tone = profile.Add<Tonemapping>(true);
            tone.mode.Override(TonemappingMode.Neutral);

            var grade = profile.Add<ColorAdjustments>(true);
            grade.contrast.Override(12f);
            grade.saturation.Override(8f);
            grade.postExposure.Override(0.15f);

            var vignette = profile.Add<Vignette>(true);
            vignette.intensity.Override(0.3f);
            vignette.smoothness.Override(0.45f);
            vignette.color.Override(new Color(0.05f, 0.02f, 0.08f));

            foreach (var c in profile.components) { c.hideFlags = HideFlags.HideInInspector | HideFlags.HideInHierarchy; AssetDatabase.AddObjectToAsset(c, profile); }
            EditorUtility.SetDirty(profile);
            AssetDatabase.SaveAssets();
            return profile;
        }
    }
}
