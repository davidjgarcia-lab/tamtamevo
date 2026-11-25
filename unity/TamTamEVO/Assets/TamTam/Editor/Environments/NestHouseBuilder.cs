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

        /// QA fix: soft glows (lamp, brazier) were cut by the canvas edge and showed a rectangle. Caps the alpha of
        /// semi-transparent pixels (glow, not the solid drawing) so it reaches 0 at the border. Idempotent (min).
        public static bool FeatherGlow(string png)
        {
            var t = new Texture2D(2, 2); t.LoadImage(File.ReadAllBytes(png));
            var px = t.GetPixels32(); int w = t.width, h = t.height; bool changed = false;
            float band = Mathf.Min(w, h) * 0.22f;
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                {
                    int i = y * w + x; var c = px[i];
                    if (c.a == 0 || c.a >= 160) continue;
                    float d = Mathf.Min(Mathf.Min(x, w - 1 - x), Mathf.Min(y, h - 1 - y));
                    float k = Mathf.Clamp01(d / band); k = k * k * (3 - 2 * k);
                    byte cap = (byte)Mathf.FloorToInt(160 * k);
                    if (c.a > cap) { c.a = cap; px[i] = c; changed = true; }
                }
            if (changed) { t.SetPixels32(px); t.Apply(); File.WriteAllBytes(png, t.EncodeToPNG()); }
            UnityEngine.Object.DestroyImmediate(t);
            return changed;
        }

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
                if (rel.StartsWith("Furniture/")) FeatherGlow(png);
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

        static bool HasNormal(TextureImporter ti)
        {
            var factory = new UnityEditor.U2D.Sprites.SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti); dp.InitSpriteEditorDataProvider();
            var tex = dp.GetDataProvider<UnityEditor.U2D.Sprites.ISecondaryTextureDataProvider>().textures;
            return tex != null && tex.Any(t => t.name == "_NormalMap" && t.texture);
        }

        /// Shared material for furniture and props: TamTam/CreatureLit with light contact occlusion (per-object look via MPB).
        static Material PropMaterial()
        {
            const string path = "Assets/TamTam/Materials/PropLit.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!m) { m = new Material(Shader.Find("TamTam/CreatureLit")); AssetDatabase.CreateAsset(m, path); }
            m.SetFloat("_GroundAO", 0.22f); m.SetFloat("_GroundAOHeight", 0.4f); m.SetFloat("_Emission", 0); m.SetFloat("_EmissionStrength", 1.2f);
            EditorUtility.SetDirty(m);
            return m;
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
            cam.allowHDR = true;
            cam.gameObject.AddComponent<UniversalAdditionalCameraData>().renderPostProcessing = true;
            cam.gameObject.AddComponent<TamTam.Vfx.CameraShake>();
            var light = new GameObject("Global Light 2D").AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Global; light.intensity = 0.9f;
            // Grading: global profile + day and night looks, blended by DayNight.
            var dayVol = Rendering.StyleSetup.AddVolumes(Rendering.StyleSetup.SceneLook.NestHouse_Day);
            var nightVol = new GameObject("Volume · NestHouse_Night").AddComponent<UnityEngine.Rendering.Volume>();
            nightVol.isGlobal = true; nightVol.priority = 2; nightVol.weight = 0;
            nightVol.sharedProfile = AssetDatabase.LoadAssetAtPath<UnityEngine.Rendering.VolumeProfile>($"{Rendering.StyleSetup.Dir}/NestHouse_Night.asset");
            var propMat = PropMaterial();
            var dayLights = new System.Collections.Generic.List<Light2D>();
            var nightLights = new System.Collections.Generic.List<Light2D>();
            float W = g.w / PPU, Hh = g.h / PPU;
            // Window light (day): the key light from the upper left through the round window, casting the 2D shadows.
            var win = Rendering.StyleSetup.Point("Window light (day key)", new Vector3(W * 0.42f, -Hh * 0.22f, 0), "#FFE6C8", 0.85f, Hh * 0.75f, shadows: true);
            dayLights.Add(win);

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
                if (p.layer != "wall" && p.layer != "rug")
                {
                    var gs = sr.gameObject.AddComponent<GroundShadow>();
                    gs.target = sr; gs.contactOpacity = 0.35f; gs.ambientOpacity = 0.2f; gs.widthFactor = 0.7f; gs.sortingOrder = -2;
                    sr.gameObject.AddComponent<ShadowCaster2D>().selfShadows = false;      // projected shadow from the window
                }
                // Technical art for furniture and props: normal map, sober rim, emission on light sources (via MPB).
                if (p.layer != "wall")
                {
                    sr.sharedMaterial = propMat;
                    var ti = (TextureImporter)AssetImporter.GetAtPath($"{Dir}/{meta.path}");
                    if (ti && !HasNormal(ti)) Rendering.NormalMapBaker.Attach(ti, Rendering.NormalMapBaker.Bake($"{Dir}/{meta.path}", 0.6f, 0.25f));
                    sr.sprite = S(meta.path);
                    TamTam.Evolution.CreatureLook.ApplyProp(sr, p.itemId);
                }
                // Night: every light source of the room gets a warm (or its own) light.
                string id = p.itemId;
                string lightHex = id.Contains("lantern") || id.Contains("lamp") || id.Contains("brazier") || id.Contains("stove") ? "#FFB066"
                    : id.Contains("mushroom_cyan") ? "#7FF3FF" : id.Contains("crystal_blue") ? "#7FD8FF" : id.Contains("crystal_purple") ? "#C77DFF"
                    : id.Contains("crystal_amber") ? "#FFC266" : null;
                if (lightHex != null)
                {
                    var b = sr.bounds;
                    var l = Rendering.StyleSetup.Point($"Night light · {id}", new Vector3(b.center.x, b.center.y + b.extents.y * 0.3f, 0), lightHex, 0, 2.4f);
                    nightLights.Add(l);
                    var flicker = id.Contains("lantern") || id.Contains("lamp") || id.Contains("brazier") || id.Contains("stove");
                    if (flicker) l.gameObject.AddComponent<FlickerLight2D>().amount = 0.08f;
                }
            }

            // A resident Tamtam (Brasildo starter) so the room shows a creature under its lights and shadows.
            var art = AssetDatabase.LoadAssetAtPath<TamTam.Evolution.FamilyArt>("Assets/TamTam/Data/FamilyArt.asset");
            var catalogText = AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/TamTam/Data/Evolution/catalog.json");
            if (art && catalogText)
            {
                var anchor = new GameObject("Tamtam (resident)");
                anchor.transform.position = new Vector3(W * 0.5f, -(g.floorTop + 2.6f * g.floorCellH) / PPU, 0);
                var presenter = anchor.AddComponent<TamTam.Evolution.TamtamPresenter>();
                presenter.familyArt = art; presenter.catalogJson = catalogText;
                presenter.catalog = AssetDatabase.LoadAssetAtPath<TamTam.Evolution.EvolutionCatalog>("Assets/TamTam/Data/EvolutionCatalog.asset");
                anchor.AddComponent<TamTam.World.ResidentTamtam>();
            }

            var dn = new GameObject("Day/Night").AddComponent<TamTam.World.DayNight>();
            dn.dayBackdrop = back; dn.nightBackdrop = night; dn.dayVolume = dayVol; dn.nightVolume = nightVol; dn.globalLight = light;
            dn.dayLights = dayLights.ToArray(); dn.nightLights = nightLights.ToArray();
            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"TamTam: {ScenePath} built with {layout.placements.Length} placements.");
        }
    }
}
