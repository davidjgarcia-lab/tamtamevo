using System.IO;
using System.Linq;
using TamTam.Vfx;
using UnityEditor;
using UnityEngine;

namespace TamTam.EditorTools.VfxTools
{
    /// Generates the particle textures (soft dot, 4-point sparkle, leaf/feather, bubble ring, smoke puff, rune, shard)
    /// and one additive (HDR, bloom) + one alpha material per shape, stored in Resources/TamTamVfx.asset.
    public static class VfxLibraryBuilder
    {
        const string Dir = "Assets/TamTam/Art/Generated/Vfx";
        const string LibPath = "Assets/TamTam/Resources/TamTamVfx.asset";

        [MenuItem("TamTam/VFX/Generar biblioteca de partículas")]
        public static VfxLibrary Build()
        {
            Directory.CreateDirectory(Dir); Directory.CreateDirectory(Path.GetDirectoryName(LibPath));
            var add = Shader.Find("TamTam/EmberAdditive");
            var alpha = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            var lib = AssetDatabase.LoadAssetAtPath<VfxLibrary>(LibPath);
            if (!lib) { lib = ScriptableObject.CreateInstance<VfxLibrary>(); AssetDatabase.CreateAsset(lib, LibPath); }
            lib.entries = System.Enum.GetValues(typeof(VfxShape)).Cast<VfxShape>().Select(s =>
            {
                var tex = Texture(s);
                Material M(Shader sh, string suffix, float intensity)
                {
                    var path = $"{Dir}/vfx_{s}_{suffix}.mat";
                    var m = AssetDatabase.LoadAssetAtPath<Material>(path);
                    if (!m) { m = new Material(sh); AssetDatabase.CreateAsset(m, path); }
                    m.shader = sh; m.mainTexture = tex; if (m.HasProperty("_Intensity")) m.SetFloat("_Intensity", intensity);
                    EditorUtility.SetDirty(m); return m;
                }
                return new VfxLibrary.Entry { shape = s, additive = M(add, "add", 2.6f), alpha = M(alpha, "alpha", 1) };
            }).ToArray();
            EditorUtility.SetDirty(lib); AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: VFX library with {lib.entries.Length} shapes.");
            return lib;
        }

        static Texture2D Texture(VfxShape s)
        {
            const int N = 64; var px = new Color32[N * N];
            for (int y = 0; y < N; y++)
                for (int x = 0; x < N; x++)
                {
                    float u = (x + 0.5f) / N * 2 - 1, v = (y + 0.5f) / N * 2 - 1, r = Mathf.Sqrt(u * u + v * v), a;
                    switch (s)
                    {
                        case VfxShape.Sparkle: a = Mathf.Clamp01(1 - (Mathf.Abs(u) * 6 + Mathf.Abs(v) * 0.9f)) + Mathf.Clamp01(1 - (Mathf.Abs(v) * 6 + Mathf.Abs(u) * 0.9f)) + Mathf.Clamp01(1 - r * 2.2f) * 0.8f; break;
                        case VfxShape.Leaf: { float lx = u * 1.8f, ly = v; a = Mathf.Clamp01((1 - (lx * lx + ly * ly)) * 6) * Mathf.Clamp01(1 - Mathf.Abs(u) * 0.2f); if (Mathf.Abs(u) < 0.04f) a *= 0.6f; break; }
                        case VfxShape.Ring: a = Mathf.Clamp01(1 - Mathf.Abs(r - 0.78f) * 9) + Mathf.Clamp01(1 - Mathf.Abs(new Vector2(u + 0.3f, v - 0.35f).magnitude) * 7) * 0.7f + Mathf.Clamp01(1 - r) * 0.12f; break;
                        case VfxShape.Puff: a = Mathf.Clamp01(1 - r) * (0.75f + 0.25f * Mathf.PerlinNoise(u * 3 + 7, v * 3 + 3)); a *= a; break;
                        case VfxShape.Rune: a = Mathf.Clamp01(1 - Mathf.Abs(r - 0.72f) * 12) + (Mathf.Abs(u) < 0.07f && Mathf.Abs(v) < 0.55f ? 1 : 0) + (Mathf.Abs(v - 0.15f) < 0.07f && Mathf.Abs(u) < 0.4f ? 1 : 0) + (Mathf.Abs(u + v * 0.6f) < 0.06f && v < -0.1f && v > -0.55f ? 1 : 0); break;
                        case VfxShape.Shard: { float sx = Mathf.Abs(u) + Mathf.Abs(v) * 0.55f; a = Mathf.Clamp01((0.75f - sx) * 10); break; }
                        default: a = Mathf.Clamp01(1 - r); a = a * a * (3 - 2 * a); break;
                    }
                    px[y * N + x] = new Color32(255, 255, 255, (byte)(Mathf.Clamp01(a) * 255));
                }
            var t = new Texture2D(N, N, TextureFormat.RGBA32, false); t.SetPixels32(px); t.Apply();
            var path = $"{Dir}/vfx_{s}.png"; File.WriteAllBytes(path, t.EncodeToPNG()); Object.DestroyImmediate(t);
            AssetDatabase.ImportAsset(path);
            var ti = (TextureImporter)AssetImporter.GetAtPath(path); ti.alphaIsTransparency = true; ti.mipmapEnabled = true; ti.wrapMode = TextureWrapMode.Clamp; ti.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
        }
    }
}
