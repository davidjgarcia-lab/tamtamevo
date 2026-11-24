using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TamTam.Core;
using TamTam.EditorTools.Chispin;
using TamTam.Evolution;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace TamTam.EditorTools.Evolution
{
    /// Builds the evolved Tamtams in Unity from the data exported by the web prototype (tools/export-unity.ts):
    /// the same 9 families, 2 variants per part, eye styles, patterns, palettes and mutations (110.199.605.760 combinations).
    /// Each body plan becomes a prefab with Chispín's skeleton and 14 clips; colours come from the genome at runtime.
    public static class EvolvedFormsBuilder
    {
        const string DataDir = "Assets/TamTam/Data/Evolution";
        const string CatalogPath = "Assets/TamTam/Data/EvolutionCatalog.asset";
        const string ArtDir = "Assets/TamTam/Art/Creatures/Forms";
        const string AnimDir = "Assets/TamTam/Animation/Forms";
        const string PrefabDir = "Assets/TamTam/Prefabs/Forms";
        const string ScenePath = "Assets/TamTam/Scenes/EvolutionLab.unity";

        const string FamilyArtDir = "Assets/TamTam/Art/Creatures/Families";
        const string FamilyArtPath = "Assets/TamTam/Data/FamilyArt.asset";

        /// Imports the painted family art (10 families × initial/intermediate/final) as sprites (pivot at the feet,
        /// about 2.6 units tall like Chispín) and fills Data/FamilyArt.asset.
        [MenuItem("TamTam/Evoluciones/0 · Importar arte pintado de familias")]
        public static FamilyArt ImportFamilyArt()
        {
            AssetDatabase.Refresh();
            var art = AssetDatabase.LoadAssetAtPath<FamilyArt>(FamilyArtPath);
            if (!art)
            {
                art = ScriptableObject.CreateInstance<FamilyArt>();
                Directory.CreateDirectory(Path.GetDirectoryName(FamilyArtPath));
                AssetDatabase.CreateAsset(art, FamilyArtPath);
            }
            art.entries.Clear();
            foreach (var png in Directory.GetFiles(FamilyArtDir, "*.png").Select(p => p.Replace('\\', '/')))
            {
                var name = Path.GetFileNameWithoutExtension(png);
                var parts = name.Split('_');
                if (parts.Length != 2 || !Enum.TryParse(parts[0], out Family fam)) continue;
                var ti = (TextureImporter)AssetImporter.GetAtPath(png);
                var tex = new Texture2D(2, 2); tex.LoadImage(File.ReadAllBytes(png));
                ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single;
                ti.mipmapEnabled = true; ti.alphaIsTransparency = true; ti.textureCompression = TextureImporterCompression.CompressedHQ;
                var st = new TextureImporterSettings(); ti.ReadTextureSettings(st);
                float height = parts[1] == "final" ? 3.0f : parts[1] == "intermediate" ? 2.7f : 2.5f;
                st.spritePixelsPerUnit = tex.height / height; st.spriteAlignment = (int)SpriteAlignment.BottomCenter;
                st.spriteMeshType = SpriteMeshType.Tight;
                ti.SetTextureSettings(st); ti.SaveAndReimport();
                UnityEngine.Object.DestroyImmediate(tex);
                art.entries.Add(new FamilyArt.Entry { family = fam, stage = parts[1], sprite = AssetDatabase.LoadAssetAtPath<Sprite>(png) });
            }
            EditorUtility.SetDirty(art);
            AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: painted family art imported ({art.entries.Count} sprites, expected 30).");
            return art;
        }

        static CatalogJson LoadCatalog() => JsonUtility.FromJson<CatalogJson>(File.ReadAllText($"{DataDir}/catalog.json"));

        [MenuItem("TamTam/Evoluciones/1 · Construir formas exportadas (todas)")]
        public static void BuildAll() => BuildForms(int.MaxValue);

        [MenuItem("TamTam/Evoluciones/1b · Construir solo las 18 formas puras (rápido)")]
        public static void BuildPure() => BuildForms(18);

        static void BuildForms(int max)
        {
            var index = JsonUtility.FromJson<FormsIndexJson>(File.ReadAllText($"{DataDir}/forms_index.json"));
            var catalog = LoadOrCreateCatalog();
            var done = new HashSet<string>();
            int n = 0;
            try
            {
                AssetDatabase.StartAssetEditing();
                foreach (var item in index.forms.Take(max))
                {
                    var form = JsonUtility.FromJson<FormJson>(File.ReadAllText($"{DataDir}/Forms/{item.file}"));
                    var g = form.genome.ToGenome();
                    string shape = GenomeKeys.ShapeKey(g);
                    if (!done.Add(shape)) continue;
                    if (EditorUtility.DisplayCancelableProgressBar("TamTam · formas evolucionadas", $"{form.name} ({shape})", n / (float)Math.Min(max, index.forms.Length))) break;
                    AssetDatabase.StopAssetEditing();
                    Build(catalog, g, form.rig, form.@float);
                    AssetDatabase.StartAssetEditing();
                    n++;
                }
            }
            finally
            {
                AssetDatabase.StopAssetEditing();
                EditorUtility.ClearProgressBar();
            }
            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: {n} evolved forms built · catalog has {catalog.entries.Count} body plans · {CatalogPath}");
        }

        [MenuItem("TamTam/Evoluciones/2 · Construir forma desde genoma (portapapeles)")]
        public static void BuildFromClipboard()
        {
            GenomeJson gj;
            try { gj = JsonUtility.FromJson<GenomeJson>(EditorGUIUtility.systemCopyBuffer); }
            catch (Exception e) { EditorUtility.DisplayDialog("TamTam", "El portapapeles no contiene un genoma JSON.\nEn la app web: DEV ▸ Copiar genoma para Unity.\n\n" + e.Message, "Vale"); return; }
            if (gj?.parts == null) { EditorUtility.DisplayDialog("TamTam", "El portapapeles no contiene un genoma JSON.\nEn la app web: DEV ▸ Copiar genoma para Unity.", "Vale"); return; }
            var g = gj.ToGenome();
            BuildGenome(g);
        }

        /// Builds any genome from the part library (no need to bake it in the web first).
        public static EvolutionCatalog.Entry BuildGenome(Genome g)
        {
            var cat = LoadCatalog();
            var rig = GenomeKeys.Assemble(cat, g);
            var legs = cat.library.First(e => e.slot == "legs" && e.label == $"{g[PartSlot.legs]}_{g.variant[(int)PartSlot.legs]}");
            var catalog = LoadOrCreateCatalog();
            var entry = Build(catalog, g, rig, legs.@float);
            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: built {Genetics.FormName(g, 1)} ({entry.shapeKey}).");
            return entry;
        }

        static EvolutionCatalog.Entry Build(EvolutionCatalog catalog, Genome g, RigJson rigJson, bool floating)
        {
            string shape = GenomeKeys.ShapeKey(g);
            string safe = shape.Replace("-", "_");
            var prefab = ChispinBuilder.BuildCreature(ToRigDef(rigJson), "Form_" + safe, $"{ArtDir}/{safe}", $"{AnimDir}/{safe}", $"{PrefabDir}/{safe}.prefab");
            var e = catalog.entries.FirstOrDefault(x => x.shapeKey == shape);
            if (e == null) { e = new EvolutionCatalog.Entry { shapeKey = shape }; catalog.entries.Add(e); }
            e.name = Genetics.FormName(g, 1);
            e.prefab = prefab;
            e.parts = (Family[])g.parts.Clone();
            e.variant = (int[])g.variant.Clone();
            e.eyes = g.eyes; e.pattern = g.pattern; e.floating = floating;
            return e;
        }

        static EvolutionCatalog LoadOrCreateCatalog()
        {
            var c = AssetDatabase.LoadAssetAtPath<EvolutionCatalog>(CatalogPath);
            if (!c)
            {
                c = ScriptableObject.CreateInstance<EvolutionCatalog>();
                Directory.CreateDirectory(Path.GetDirectoryName(CatalogPath));
                AssetDatabase.CreateAsset(c, CatalogPath);
            }
            if (!c.babyPrefab)
                c.babyPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/TamTam/Prefabs/ChispinPainted.prefab")
                    ?? AssetDatabase.LoadAssetAtPath<GameObject>("Assets/TamTam/Prefabs/Chispin.prefab");
            return c;
        }

        // ── JSON → RigDef (the model ChispinBuilder paints and rigs) ─────────
        static Paint ToPaint(PaintJson p)
        {
            if (p == null || string.IsNullOrEmpty(p.kind)) return null;
            var r = p.kind switch
            {
                "tint" => Paint.T(p.token, p.alpha),
                "color" => Paint.H(p.hex, p.alpha),
                _ => Paint.G(p.stops, p.fx, p.fy, p.tx, p.ty),
            };
            r.alpha = p.alpha;
            return r;
        }

        public static RigDef ToRigDef(RigJson j)
        {
            var rig = new RigDef { id = j.id, breathBone = string.IsNullOrEmpty(j.breathBone) ? null : j.breathBone, eyeBones = j.eyeBones };
            foreach (var b in j.bones) rig.bones.Add(new BoneDef(b.id, string.IsNullOrEmpty(b.parent) ? null : b.parent, b.x, b.y, b.rot));
            foreach (var p in j.parts)
            {
                var d = new PartDef(p.id, p.bone, p.d, p.z) { fill = ToPaint(p.fill), stroke = ToPaint(p.stroke), strokeWidth = p.strokeWidth, blur = p.blur, emissive = p.emissive, sheen = p.sheen };
                if (!string.IsNullOrEmpty(p.faceSlot)) d.Face(p.faceSlot, p.faceStates);
                if (p.tiers != null && p.tiers.Length == 2) d.Tiers(p.tiers[0], p.tiers[1]);
                rig.parts.Add(d);
            }
            if (j.secondary != null)
                foreach (var s in j.secondary)
                    rig.secondary.Add(new SecondaryDef { bone = s.bone, driver = s.driver, lag = s.lag, gain = s.gain, velocityGain = s.velocityGain, swayAmp = s.swayAmp, swayFreq = s.swayFreq, flickerAmp = s.flickerAmp, flickerFreq = s.flickerFreq });
            return rig;
        }

        [MenuItem("TamTam/Actualizar todo (criaturas, evoluciones y entornos)", priority = 0)]
        public static void UpdateEverything()
        {
            ImportFamilyArt();
            BuildAll();
            BuildScene();
            TamTam.EditorTools.Environments.NestHouseBuilder.BuildScene();
            EditorUtility.DisplayDialog("TamTam", "Actualizado: arte pintado de las 10 familias, formas evolucionadas, escena EvolutionLab y casa-nido.\nAbre Assets/TamTam/Scenes/EvolutionLab.unity y pulsa Play.", "Vale");
        }

        // ── Lab scene ──────────────────────────────────────────────────────
        [MenuItem("TamTam/Evoluciones/3 · Crear escena EvolutionLab")]
        public static void BuildScene()
        {
            RenderSetup.Setup();
            var catalog = LoadOrCreateCatalog();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cam = new GameObject("Main Camera").AddComponent<Camera>();
            cam.tag = "MainCamera"; cam.orthographic = true; cam.orthographicSize = 3.2f;
            cam.transform.position = new Vector3(0, 0.6f, -10);
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = new Color32(0x17, 0x13, 0x2B, 255);
            cam.gameObject.AddComponent<UniversalAdditionalCameraData>();
            var light = new GameObject("Global Light 2D").AddComponent<Light2D>();
            light.lightType = Light2D.LightType.Global; light.intensity = 1f;
            var go = new GameObject("Tamtam");
            var presenter = go.AddComponent<TamtamPresenter>();
            presenter.catalog = catalog;
            presenter.familyArt = AssetDatabase.LoadAssetAtPath<FamilyArt>(FamilyArtPath) ?? ImportFamilyArt();
            go.AddComponent<EvolutionLabDemo>().presenter = presenter;
            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"TamTam: {ScenePath} created. Press Play and use the buttons to evolve with different care styles.");
        }
    }
}
