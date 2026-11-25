using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace TamTam.EditorTools.Environments
{
    /// Imports the nest-house assets exported from the web prototype (tools/export-unity-assets.mjs)
    /// and builds the NestHouse scene with the starter furniture in the same places as in the game.
    public static class NestHouseBuilder
    {
        const string Dir = "Assets/TamTam/Art/Environments/NestHouse";
        const string ScenePath = "Assets/TamTam/Scenes/NestHouse.unity";
        const float PPU = 100f;

        [Serializable] class V2 { public float x, y, w, h; }
        [Serializable] class Asset { public string path, name, layer; public V2 footprint, rectPx, size; public int level, comfort, price; public bool prop; }
        [Serializable] class AssetList { public Asset[] assets; }
        [Serializable] class Placement { public string uid, itemId, layer; public int x, y; public bool mirrored, rotated; }
        [Serializable] class Geom { public float w, h, wallTop, wallBottom, floorTop, floorBottom, wallCell, wallX0, floorCellW, floorCellH, floorX0; }
        [Serializable] class Layout { public Placement[] placements; public Geom geom; }

        [MenuItem("TamTam/Entornos/1 · Importar assets de la casa-nido")]
        public static void ImportAll()
        {
            var list = JsonUtility.FromJson<AssetList>(File.ReadAllText($"{Dir}/assets.json"));
            var geom = JsonUtility.FromJson<Layout>(File.ReadAllText($"{Dir}/nest_layout.json")).geom;
            AssetDatabase.Refresh();
            foreach (var png in Directory.GetFiles(Dir, "*.png", SearchOption.AllDirectories).Select(p => p.Replace('\\', '/')))
            {
                var rel = png.Substring(Dir.Length + 1);
                var meta = list.assets.FirstOrDefault(a => a.path == rel);
                var ti = (TextureImporter)AssetImporter.GetAtPath(png);
                if (ti == null) continue;
                ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single;
                ti.mipmapEnabled = false; ti.alphaIsTransparency = true; ti.textureCompression = TextureImporterCompression.CompressedHQ;
                ti.wrapMode = rel.StartsWith("Walls/") || rel.StartsWith("Floors/") ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;
                var st = new TextureImporterSettings(); ti.ReadTextureSettings(st);
                st.spritePixelsPerUnit = PPU; st.spriteMeshType = SpriteMeshType.FullRect;
                if (meta != null && meta.prop)
                {
                    // Painted prop: as wide as its footprint (like the web), standing on its base (rugs/wall items centred).
                    var tex = new Texture2D(2, 2); tex.LoadImage(File.ReadAllBytes(png));
                    float cell = meta.layer == "wall" ? geom.wallCell : geom.floorCellW;
                    st.spritePixelsPerUnit = tex.width / (meta.footprint.w * cell * (meta.layer == "floor" && meta.footprint.w < 1.5f ? 1.45f : 1.12f) / PPU);
                    st.spriteAlignment = (int)(meta.layer == "floor" ? SpriteAlignment.BottomCenter : SpriteAlignment.Center);
                    UnityEngine.Object.DestroyImmediate(tex);
                }
                else if (meta?.rectPx != null && meta.size != null && meta.size.w > 0)
                {
                    // Pivot: middle of the footprint's front edge (floor items) / of the frame's bottom (wall items).
                    st.spriteAlignment = (int)SpriteAlignment.Custom;
                    st.spritePivot = new Vector2((meta.rectPx.x + meta.rectPx.w / 2) / meta.size.w, 1 - (meta.rectPx.y + meta.rectPx.h) / meta.size.h);
                }
                else st.spriteAlignment = (int)SpriteAlignment.TopLeft;
                ti.SetTextureSettings(st);
                ti.SaveAndReimport();
            }
            Debug.Log($"TamTam: nest-house assets imported ({list.assets.Length}).");
        }

        [MenuItem("TamTam/Entornos/2 · Construir escena NestHouse")]
        public static void BuildScene()
        {
            ImportAll();
            RenderSetup.Setup();
            var layout = JsonUtility.FromJson<Layout>(File.ReadAllText($"{Dir}/nest_layout.json"));
            var list = JsonUtility.FromJson<AssetList>(File.ReadAllText($"{Dir}/assets.json"));
            var g = layout.geom;
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var cam = new GameObject("Main Camera").AddComponent<Camera>();
            cam.tag = "MainCamera"; cam.orthographic = true; cam.orthographicSize = g.h / PPU / 2;
            cam.transform.position = new Vector3(g.w / PPU / 2, -g.h / PPU / 2, -10);
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = new Color32(0x17, 0x13, 0x2B, 255);
            cam.gameObject.AddComponent<UniversalAdditionalCameraData>();
            var light = new GameObject("Global Light 2D").AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Global; light.intensity = 1f;

            var room = new GameObject("NestRoom").transform;
            Sprite S(string rel) => AssetDatabase.LoadAssetAtPath<Sprite>($"{Dir}/{rel}");
            var back = new GameObject("Backdrop_day").AddComponent<SpriteRenderer>();
            back.transform.SetParent(room, false); back.sprite = S("Rooms/nest_room_day.png"); back.sortingOrder = -100;
            var night = new GameObject("Backdrop_night").AddComponent<SpriteRenderer>();
            night.transform.SetParent(room, false); night.sprite = S("Rooms/nest_room_night.png"); night.sortingOrder = -99;
            night.gameObject.SetActive(false);

            foreach (var p in layout.placements)
            {
                var meta = list.assets.FirstOrDefault(a => a.path.EndsWith("/" + p.itemId + ".png"));
                if (meta == null) { Debug.LogWarning($"TamTam: no asset for {p.itemId}"); continue; }
                float x, y;
                if (p.layer == "wall") { x = g.wallX0 + (p.x + meta.footprint.w / 2) * g.wallCell; y = g.wallTop + (p.y + meta.footprint.h * (meta.prop ? 0.5f : 1f)) * g.wallCell; }
                else { x = g.floorX0 + (p.x + meta.footprint.w / 2) * g.floorCellW; y = g.floorTop + (p.y + meta.footprint.h * (meta.prop && p.layer == "rug" ? 0.5f : 1f)) * g.floorCellH; }
                var sr = new GameObject(p.itemId).AddComponent<SpriteRenderer>();
                sr.transform.SetParent(room, false);
                sr.transform.localPosition = new Vector3(x / PPU, -y / PPU, 0);
                sr.sprite = S(meta.path); sr.flipX = p.mirrored;
                sr.sortingOrder = p.layer == "wall" ? -50 : p.layer == "rug" ? -40 : 10 * (p.y + 1);
            }
            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"TamTam: {ScenePath} built with {layout.placements.Length} placements.");
        }
    }
}
