using System.IO;
using UnityEditor;
using UnityEditor.U2D.Sprites;
using UnityEngine;

namespace TamTam.EditorTools.Rendering
{
    /// Bakes a normal map from a painted sprite so URP 2D lights give it volume (2.5D) without touching the art:
    /// height = blurred silhouette (rounded body) + a little luminance relief (painted detail), normals by Sobel.
    /// Saved in Art/Generated/Normals and attached as the sprite's _NormalMap secondary texture.
    public static class NormalMapBaker
    {
        public const string OutDir = "Assets/TamTam/Art/Generated/Normals";

        public static Texture2D Bake(string png, float bodyRound = 1f, float detail = 0.35f)
        {
            Directory.CreateDirectory(OutDir);
            var src = new Texture2D(2, 2); src.LoadImage(File.ReadAllBytes(png));
            int W = src.width, H = src.height; var px = src.GetPixels32();
            Object.DestroyImmediate(src);
            var a = new float[W * H]; var lum = new float[W * H];
            for (int i = 0; i < px.Length; i++) { a[i] = px[i].a / 255f; lum[i] = (px[i].r * 0.2126f + px[i].g * 0.7152f + px[i].b * 0.0722f) / 255f; }
            int r = Mathf.Max(2, Mathf.RoundToInt(Mathf.Min(W, H) * 0.035f));
            var dome = Blur(a, W, H, r); dome = Blur(dome, W, H, r);                 // rounded body from the silhouette
            var fine = Blur(lum, W, H, 1);                                             // painted relief
            var h = new float[W * H];
            for (int i = 0; i < h.Length; i++) h[i] = (Mathf.Sqrt(Mathf.Clamp01(dome[i])) * bodyRound + fine[i] * detail) * a[i];
            var outPx = new Color32[W * H];
            float k = 6f;
            for (int y = 0; y < H; y++)
                for (int x = 0; x < W; x++)
                {
                    float H_(int xx, int yy) => h[Mathf.Clamp(yy, 0, H - 1) * W + Mathf.Clamp(xx, 0, W - 1)];
                    float dx = (H_(x + 1, y - 1) + 2 * H_(x + 1, y) + H_(x + 1, y + 1)) - (H_(x - 1, y - 1) + 2 * H_(x - 1, y) + H_(x - 1, y + 1));
                    float dy = (H_(x - 1, y + 1) + 2 * H_(x, y + 1) + H_(x + 1, y + 1)) - (H_(x - 1, y - 1) + 2 * H_(x, y - 1) + H_(x + 1, y - 1));
                    var n = new Vector3(-dx * k, -dy * k, 1).normalized;
                    outPx[y * W + x] = new Color32((byte)((n.x * 0.5f + 0.5f) * 255), (byte)((n.y * 0.5f + 0.5f) * 255), (byte)((n.z * 0.5f + 0.5f) * 255), 255);
                }
            var t = new Texture2D(W, H, TextureFormat.RGBA32, false, true); t.SetPixels32(outPx); t.Apply();
            var path = $"{OutDir}/{Path.GetFileNameWithoutExtension(png)}_n.png";
            File.WriteAllBytes(path, t.EncodeToPNG());
            Object.DestroyImmediate(t);
            AssetDatabase.ImportAsset(path);
            var ni = (TextureImporter)AssetImporter.GetAtPath(path);
            ni.textureType = TextureImporterType.NormalMap; ni.convertToNormalmap = false; ni.mipmapEnabled = true;
            ni.maxTextureSize = 2048; ni.textureCompression = TextureImporterCompression.Compressed; ni.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
        }

        /// Adds/replaces the _NormalMap secondary texture, keeping any other secondary textures (e.g. _TintMask).
        public static void Attach(TextureImporter ti, Texture2D normal)
        {
            var factory = new SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti); dp.InitSpriteEditorDataProvider();
            var sec = dp.GetDataProvider<ISecondaryTextureDataProvider>();
            var list = new System.Collections.Generic.List<SecondarySpriteTexture>(sec.textures ?? new SecondarySpriteTexture[0]);
            list.RemoveAll(s => s.name == "_NormalMap");
            list.Add(new SecondarySpriteTexture { name = "_NormalMap", texture = normal });
            sec.textures = list.ToArray();
            dp.Apply(); ti.SaveAndReimport();
        }

        static float[] Blur(float[] s, int W, int H, int r)
        {
            var tmp = new float[s.Length]; var o = new float[s.Length]; float inv = 1f / (2 * r + 1);
            for (int y = 0; y < H; y++) { float acc = 0; for (int x = -r; x <= r; x++) acc += s[y * W + Mathf.Clamp(x, 0, W - 1)];
                for (int x = 0; x < W; x++) { tmp[y * W + x] = acc * inv; acc += s[y * W + Mathf.Min(W - 1, x + r + 1)] - s[y * W + Mathf.Max(0, x - r)]; } }
            for (int x = 0; x < W; x++) { float acc = 0; for (int y = -r; y <= r; y++) acc += tmp[Mathf.Clamp(y, 0, H - 1) * W + x];
                for (int y = 0; y < H; y++) { o[y * W + x] = acc * inv; acc += tmp[Mathf.Min(H - 1, y + r + 1) * W + x] - tmp[Mathf.Max(0, y - r) * W + x]; } }
            return o;
        }
    }
}
