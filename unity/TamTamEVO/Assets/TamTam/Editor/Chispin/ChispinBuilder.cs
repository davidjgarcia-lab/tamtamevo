using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEditor.U2D.Sprites;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.U2D;
using UnityEngine.U2D.Animation;

namespace TamTam.EditorTools.Chispin
{
    /// Builds Chispín in Unity from the prototype's rig (ChispinData):
    ///  • one painted layer per bone/face-state group (colour PNG + tint-mask secondary texture → TamTam/CreatureLit),
    ///  • the tail as ONE skinned sprite with 4 bones and smooth weights (2D Animation SpriteSkin),
    ///  • bone hierarchy, 14 AnimationClips + Animator Controller, ember particles, crest light,
    ///  • the ChispinLab scene (URP 2D lights + Bloom) and a preview contact sheet.
    /// When the AI-painted PSB arrives it replaces the generated layers; bones, clips and scene stay.
    public static class ChispinBuilder
    {
        const float PX = 8f;          // texture pixels per rig unit
        const float UNIT = 1f / 40f;  // world units per rig unit (Chispín ≈ 2.4 units tall)
        const float PPU = PX / UNIT;
        const float STROKE_SCALE = 0.6f; // finer line art than the web prototype (less "drawn", more painted)

        const string Root = "Assets/TamTam";
        const string GenDir = Root + "/Art/Creatures/Chispin/Generated";
        const string AnimDir = Root + "/Animation/Chispin";
        const string MatDir = Root + "/Materials";
        const string PrefabPath = Root + "/Prefabs/Chispin.prefab";
        const string ScenePath = Root + "/Scenes/ChispinLab.unity";
        static readonly string[] TailBones = { "tail1", "tail2", "tail3", "tail4" };

        class Group
        {
            public string name, bone, faceSlot; public string[] faceStates; public bool skinned;
            public readonly List<PartDef> parts = new List<PartDef>();
            public Rect bounds; public Vector2 pivot; public Sprite sprite;
        }

        [MenuItem("TamTam/Build Chispín (rig, clips, scene)")]
        public static void BuildAll()
        {
            RenderSetup.Setup();
            var rig = ChispinData.Rig();
            var clips = ChispinData.Clips();
            foreach (var d in new[] { GenDir, AnimDir, MatDir, Path.GetDirectoryName(PrefabPath), Path.GetDirectoryName(ScenePath) }) Directory.CreateDirectory(d);

            var rest = RestMatrices(rig);
            var groups = MakeGroups(rig);
            var pal = PaletteMath.Derive("#7D2430", "#FF7A24", "#FFC247", "#FFB347");
            PaintGroups(rig, groups, rest, pal);
            AssetDatabase.Refresh();
            foreach (var g in groups) ImportGroup(rig, g, rest);

            var mat = CreatureMaterial(pal);
            var emberMat = EmberMaterial();
            var go = BuildHierarchy(rig, groups, mat, emberMat, out var bones, out var faceObjects);
            var animClips = BuildClips(rig, clips, go, bones, faceObjects);
            var controller = BuildController(clips, animClips);
            go.GetComponent<Animator>().runtimeAnimatorController = controller;
            SetupRig(go, rig, clips, bones, faceObjects);

            PrefabUtility.SaveAsPrefabAsset(go, PrefabPath);
            UnityEngine.Object.DestroyImmediate(go);
            BuildScene();
            AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: Chispín built — {groups.Count} painted layers, {animClips.Count} clips, scene {ScenePath}.");
        }

        // ── Rig maths (rig space: y down, clockwise degrees) ─────────────────
        static Dictionary<string, Matrix4x4> RestMatrices(RigDef rig)
        {
            var w = new Dictionary<string, Matrix4x4>();
            foreach (var b in rig.bones)
            {
                var local = Matrix4x4.TRS(new Vector3(b.x, b.y), Quaternion.Euler(0, 0, b.rot), Vector3.one);
                w[b.id] = b.parent == null ? local : w[b.parent] * local;
            }
            return w;
        }

        static List<Group> MakeGroups(RigDef rig)
        {
            var groups = new List<Group>();
            Group tail = null;
            foreach (var p in rig.parts.Where(p => p.tiers == null).OrderBy(p => p.z))
            {
                bool skinned = TailBones.Contains(p.bone) && p.z >= 2 && p.z <= 3;
                if (skinned)
                {
                    if (tail == null) { tail = new Group { name = "tailSkin", bone = "tail1", skinned = true }; groups.Add(tail); }
                    tail.parts.Add(p); continue;
                }
                string face = p.faceSlot == null ? "" : p.faceSlot + ":" + string.Join(",", p.faceStates);
                var last = groups.Count > 0 ? groups[groups.Count - 1] : null;
                if (last != null && !last.skinned && last.bone == p.bone && FaceKey(last) == face) { last.parts.Add(p); continue; }
                groups.Add(new Group { name = $"{groups.Count:00}_{p.bone}_{p.id}", bone = p.bone, faceSlot = p.faceSlot, faceStates = p.faceStates });
                groups[groups.Count - 1].parts.Add(p);
            }
            return groups;
        }

        static string FaceKey(Group g) => g.faceSlot == null ? "" : g.faceSlot + ":" + string.Join(",", g.faceStates);

        /// Part polygons in the group's space (bone space; tail parts → tail1 rest space).
        static (List<List<Vector2>> polys, List<bool> closed) PartPolys(PartDef p, Group g, Dictionary<string, Matrix4x4> rest)
        {
            var path = FlatPath.Parse(p.d);
            var m = rest[g.bone].inverse * rest[p.bone];
            var polys = path.subpaths.Select(sp => sp.Select(v => (Vector2)m.MultiplyPoint3x4(v)).ToList()).ToList();
            return (polys, path.closed);
        }

        static void PaintGroups(RigDef rig, List<Group> groups, Dictionary<string, Matrix4x4> rest, Dictionary<string, (Color c, int fam)> pal)
        {
            foreach (var g in groups)
            {
                float x0 = float.MaxValue, y0 = float.MaxValue, x1 = float.MinValue, y1 = float.MinValue;
                foreach (var p in g.parts)
                {
                    var (polys, _) = PartPolys(p, g, rest);
                    float pad = (p.stroke != null ? p.strokeWidth * STROKE_SCALE / 2 : 0) + p.blur * 3 + 1.5f;
                    foreach (var poly in polys) foreach (var v in poly)
                    { x0 = Mathf.Min(x0, v.x - pad); y0 = Mathf.Min(y0, v.y - pad); x1 = Mathf.Max(x1, v.x + pad); y1 = Mathf.Max(y1, v.y + pad); }
                }
                g.bounds = Rect.MinMaxRect(Mathf.Floor(x0), Mathf.Floor(y0), Mathf.Ceil(x1), Mathf.Ceil(y1));
                var canvas = new Canvas(g.bounds, PX);
                foreach (var p in g.parts)
                {
                    var (polys, closed) = PartPolys(p, g, rest);
                    canvas.Paint(p, polys, closed, pal, STROKE_SCALE);
                }
                g.pivot = new Vector2(-g.bounds.xMin * PX / canvas.w, g.bounds.yMax * PX / canvas.h);
                File.WriteAllBytes($"{GenDir}/{g.name}.png", canvas.ToTexture(false).EncodeToPNG());
                File.WriteAllBytes($"{GenDir}/{g.name}_mask.png", canvas.ToTexture(true).EncodeToPNG());
            }
        }

        static void ImportGroup(RigDef rig, Group g, Dictionary<string, Matrix4x4> rest)
        {
            string colPath = $"{GenDir}/{g.name}.png", maskPath = $"{GenDir}/{g.name}_mask.png";
            var mi = (TextureImporter)AssetImporter.GetAtPath(maskPath);
            mi.textureType = TextureImporterType.Default; mi.sRGBTexture = false; mi.alphaSource = TextureImporterAlphaSource.FromInput;
            mi.alphaIsTransparency = false; mi.mipmapEnabled = false; mi.textureCompression = TextureImporterCompression.Uncompressed;
            mi.wrapMode = TextureWrapMode.Clamp; mi.npotScale = TextureImporterNPOTScale.None;
            mi.SaveAndReimport();
            var mask = AssetDatabase.LoadAssetAtPath<Texture2D>(maskPath);

            var ti = (TextureImporter)AssetImporter.GetAtPath(colPath);
            ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single;
            ti.mipmapEnabled = false; ti.alphaIsTransparency = true; ti.textureCompression = TextureImporterCompression.Uncompressed;
            ti.wrapMode = TextureWrapMode.Clamp; ti.filterMode = FilterMode.Bilinear;
            var st = new TextureImporterSettings(); ti.ReadTextureSettings(st);
            st.spritePixelsPerUnit = PPU; st.spriteAlignment = (int)SpriteAlignment.Custom; st.spritePivot = g.pivot;
            st.spriteMeshType = g.skinned ? SpriteMeshType.FullRect : SpriteMeshType.Tight; st.spriteGenerateFallbackPhysicsShape = false;
            ti.SetTextureSettings(st);
            ti.SaveAndReimport();

            var factory = new SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti);
            dp.InitSpriteEditorDataProvider();
            var rects = dp.GetSpriteRects();
            var guid = rects[0].spriteID;
            dp.GetDataProvider<ISecondaryTextureDataProvider>().textures = new[] { new SecondarySpriteTexture { name = "_TintMask", texture = mask } };
            if (g.skinned) SkinTail(dp, guid, g, rest, rects[0].rect.size);
            dp.Apply();
            ti.SaveAndReimport();
            g.sprite = AssetDatabase.LoadAssetAtPath<Sprite>(colPath);
        }

        /// Bones + grid mesh + smooth weights for the tail sprite (sprite pixels, origin bottom-left).
        static void SkinTail(ISpriteEditorDataProvider dp, GUID guid, Group g, Dictionary<string, Matrix4x4> rest, Vector2 size)
        {
            var pivotPx = new Vector2(g.pivot.x * size.x, g.pivot.y * size.y);
            var bones = new List<SpriteBone>();
            float[] lengths = { 18, 16, 14, 16 };
            var toTail = rest["tail1"].inverse;
            for (int i = 0; i < TailBones.Length; i++)
            {
                var def = ChispinData.Rig().Bone(TailBones[i]);
                bones.Add(new SpriteBone
                {
                    name = TailBones[i], guid = GUID.Generate().ToString(), parentId = i - 1,
                    position = i == 0 ? (Vector3)pivotPx : new Vector3(def.x * PX, -def.y * PX, 0),
                    rotation = Quaternion.Euler(0, 0, -def.rot), length = lengths[i] * PX,
                });
            }
            dp.GetDataProvider<ISpriteBoneDataProvider>().SetBones(guid, bones);

            // Bone segments in tail1 rig space (tail grows toward -x of each bone).
            var segs = new List<(Vector2 a, Vector2 b)>();
            for (int i = 0; i < TailBones.Length; i++)
            {
                var m = toTail * rest[TailBones[i]];
                segs.Add((m.MultiplyPoint3x4(Vector3.zero), m.MultiplyPoint3x4(new Vector3(-lengths[i], 0))));
            }

            var readable = new Texture2D(2, 2); readable.LoadImage(File.ReadAllBytes($"{GenDir}/{g.name}.png"));
            var px = readable.GetPixels32();
            int w = readable.width, h = readable.height; const int cell = 12;
            int cw = Mathf.CeilToInt(w / (float)cell), ch = Mathf.CeilToInt(h / (float)cell);
            var used = new bool[cw, ch];
            for (int cy = 0; cy < ch; cy++)
                for (int cx = 0; cx < cw; cx++)
                {
                    bool any = false;
                    for (int y = cy * cell; y < Mathf.Min(h, (cy + 1) * cell) && !any; y++)
                        for (int x = cx * cell; x < Mathf.Min(w, (cx + 1) * cell); x++) if (px[y * w + x].a > 4) { any = true; break; }
                    used[cx, cy] = any;
                }
            var index = new Dictionary<Vector2Int, int>();
            var verts = new List<Vertex2DMetaData>();
            int V(int gx, int gy)
            {
                var k = new Vector2Int(gx, gy);
                if (index.TryGetValue(k, out int id)) return id;
                var pos = new Vector2(Mathf.Min(gx * cell, w), Mathf.Min(gy * cell, h));
                var rp = new Vector2(g.bounds.xMin + pos.x / PX, g.bounds.yMax - pos.y / PX);
                verts.Add(new Vertex2DMetaData { position = pos, boneWeight = Weights(rp, segs) });
                index[k] = verts.Count - 1; return verts.Count - 1;
            }
            var tris = new List<int>(); var edgeCount = new Dictionary<(int, int), int>();
            void E(int a, int b) { var k = a < b ? (a, b) : (b, a); edgeCount[k] = edgeCount.TryGetValue(k, out int n) ? n + 1 : 1; }
            for (int cy = 0; cy < ch; cy++)
                for (int cx = 0; cx < cw; cx++)
                {
                    if (!used[cx, cy]) continue;
                    int a = V(cx, cy), b = V(cx + 1, cy), c = V(cx + 1, cy + 1), d = V(cx, cy + 1);
                    tris.AddRange(new[] { a, c, b, a, d, c });
                    E(a, b); E(b, c); E(c, d); E(d, a);
                }
            var mp = dp.GetDataProvider<ISpriteMeshDataProvider>();
            mp.SetVertices(guid, verts.ToArray());
            mp.SetIndices(guid, tris.ToArray());
            mp.SetEdges(guid, edgeCount.Where(e => e.Value == 1).Select(e => new Vector2Int(e.Key.Item1, e.Key.Item2)).ToArray());
        }

        static BoneWeight Weights(Vector2 p, List<(Vector2 a, Vector2 b)> segs)
        {
            var w = new float[segs.Count];
            for (int i = 0; i < segs.Count; i++)
            {
                var (a, b) = segs[i]; var ab = b - a;
                float t = Mathf.Clamp01(Vector2.Dot(p - a, ab) / ab.sqrMagnitude);
                float d = (a + ab * t - p).magnitude;
                w[i] = 1f / Mathf.Pow(d * d + 4f, 2);
            }
            var top = Enumerable.Range(0, w.Length).OrderByDescending(i => w[i]).Take(2).ToArray();
            float s = w[top[0]] + w[top[1]];
            return new BoneWeight { boneIndex0 = top[0], weight0 = w[top[0]] / s, boneIndex1 = top[1], weight1 = w[top[1]] / s };
        }

        // ── Materials ───────────────────────────────────────────────────────
        static Material CreatureMaterial(Dictionary<string, (Color c, int fam)> pal)
        {
            string path = $"{MatDir}/CreatureLit.mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!mat) { mat = new Material(Shader.Find("TamTam/CreatureLit")); AssetDatabase.CreateAsset(mat, path); }
            mat.shader = Shader.Find("TamTam/CreatureLit");
            mat.SetColor("_RefBase", pal["base"].c); mat.SetColor("_RefAccent", pal["accent"].c); mat.SetColor("_RefGlow", pal["glow"].c);
            mat.SetColor("_BaseColor", pal["base"].c); mat.SetColor("_AccentColor", pal["accent"].c); mat.SetColor("_GlowColor", pal["glow"].c);
            mat.SetColor("_EyeColor", pal["eye"].c);
            EditorUtility.SetDirty(mat);
            return mat;
        }

        static Material EmberMaterial()
        {
            string texPath = $"{GenDir}/ember_dot.png";
            const int n = 64; var t = new Texture2D(n, n, TextureFormat.RGBA32, false);
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
            {
                float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(n / 2f, n / 2f)) / (n / 2f);
                float a = Mathf.Clamp01(1 - d); a = a * a * (3 - 2 * a);
                t.SetPixel(x, y, new Color(1, 1, 1, a));
            }
            File.WriteAllBytes(texPath, t.EncodeToPNG());
            AssetDatabase.ImportAsset(texPath);
            var ti = (TextureImporter)AssetImporter.GetAtPath(texPath); ti.alphaIsTransparency = true; ti.mipmapEnabled = false; ti.SaveAndReimport();
            string path = $"{MatDir}/Embers.mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!mat) { mat = new Material(Shader.Find("TamTam/EmberAdditive")); AssetDatabase.CreateAsset(mat, path); }
            mat.mainTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(texPath);
            mat.SetFloat("_Intensity", 3.2f);
            EditorUtility.SetDirty(mat);
            return mat;
        }

        // ── Hierarchy ───────────────────────────────────────────────────────
        static GameObject BuildHierarchy(RigDef rig, List<Group> groups, Material mat, Material emberMat,
            out Dictionary<string, Transform> bones, out List<(GameObject go, Group g)> faceObjects)
        {
            var go = new GameObject("Chispin");
            go.AddComponent<Animator>();
            bones = new Dictionary<string, Transform>();
            foreach (var b in rig.bones)
            {
                var t = new GameObject(b.id).transform;
                t.SetParent(b.parent == null ? go.transform : bones[b.parent], false);
                t.localPosition = new Vector3(b.x * UNIT, -b.y * UNIT, 0);
                t.localRotation = Quaternion.Euler(0, 0, -b.rot);
                bones[b.id] = t;
            }
            faceObjects = new List<(GameObject, Group)>();
            for (int i = 0; i < groups.Count; i++)
            {
                var g = groups[i];
                var layer = new GameObject("gfx_" + g.name);
                if (g.skinned)
                {
                    layer.transform.SetParent(bones["body"], false);
                    layer.transform.localPosition = bones["tail1"].localPosition;
                }
                else layer.transform.SetParent(bones[g.bone], false);
                var sr = layer.AddComponent<SpriteRenderer>();
                sr.sprite = g.sprite; sr.sharedMaterial = mat; sr.sortingOrder = i;
                if (g.skinned)
                {
                    var skin = layer.AddComponent<SpriteSkin>();
                    skin.SetRootBone(bones["tail1"]);
                    var tailTransforms = new Transform[TailBones.Length];
                    for (int k = 0; k < TailBones.Length; k++) tailTransforms[k] = bones[TailBones[k]];
                    var state = skin.SetBoneTransforms(tailTransforms);
                    skin.alwaysUpdate = true;
                    if (state != SpriteSkinState.Ready) Debug.LogWarning($"TamTam: tail SpriteSkin state {state}");
                }
                if (g.faceSlot != null)
                {
                    faceObjects.Add((layer, g));
                    layer.SetActive(g.faceStates.Contains(FaceDefaults.Fallback[g.faceSlot]));
                }
            }

            // Embers rising from the crest.
            var emb = new GameObject("Embers");
            emb.transform.SetParent(bones["crest1"], false);
            emb.transform.localPosition = new Vector3(0, 22 * UNIT, 0);
            var ps = emb.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.startLifetime = new ParticleSystem.MinMaxCurve(1.0f, 1.6f);
            main.startSpeed = 0; main.startSize = new ParticleSystem.MinMaxCurve(0.045f, 0.085f);
            main.simulationSpace = ParticleSystemSimulationSpace.World; main.maxParticles = 120;
            main.startColor = new ParticleSystem.MinMaxGradient(PaletteMath.Hex("#FFD166"), PaletteMath.Hex("#FF7A24"));
            var em = ps.emission; em.rateOverTime = 2.4f;
            var shape = ps.shape; shape.shapeType = ParticleSystemShapeType.Circle; shape.radius = 0.12f;
            var vel = ps.velocityOverLifetime; vel.enabled = true; vel.space = ParticleSystemSimulationSpace.World;
            vel.x = new ParticleSystem.MinMaxCurve(-0.25f, 0.1f); vel.y = new ParticleSystem.MinMaxCurve(0.5f, 0.9f); vel.z = new ParticleSystem.MinMaxCurve(0f, 0f);
            var noise = ps.noise; noise.enabled = true; noise.strength = 0.25f; noise.frequency = 1.2f;
            var col = ps.colorOverLifetime; col.enabled = true;
            var grad = new Gradient();
            grad.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(new Color(1, 0.55f, 0.3f), 1) },
                new[] { new GradientAlphaKey(0, 0), new GradientAlphaKey(1, 0.12f), new GradientAlphaKey(0.8f, 0.6f), new GradientAlphaKey(0, 1) });
            col.color = grad;
            var size = ps.sizeOverLifetime; size.enabled = true; size.size = new ParticleSystem.MinMaxCurve(1, AnimationCurve.Linear(0, 1, 1, 0.3f));
            var pr = emb.GetComponent<ParticleSystemRenderer>();
            pr.sharedMaterial = emberMat; pr.sortingOrder = groups.Count + 5;

            // Crest light: the flame lights the head and the room around it.
            var lightGo = new GameObject("CrestLight");
            lightGo.transform.SetParent(bones["crest1"], false);
            lightGo.transform.localPosition = new Vector3(0, 14 * UNIT, 0);
            var l = lightGo.AddComponent<Light2D>();
            l.lightType = Light2D.LightType.Point; l.color = PaletteMath.Hex("#FF8A3D"); l.intensity = 1.3f;
            l.pointLightOuterRadius = 1.7f; l.pointLightInnerRadius = 0.05f; l.falloffIntensity = 0.65f;
            lightGo.AddComponent<FlickerLight2D>();
            return go;
        }

        // ── Animation ───────────────────────────────────────────────────────
        static float EaseFn(Ease e, float u) => e switch
        {
            Chispin.Ease.Linear => u,
            Chispin.Ease.In => u * u * u,
            Chispin.Ease.Out => 1 - Mathf.Pow(1 - u, 3),
            Chispin.Ease.Step => 0,
            _ => u < 0.5f ? 4 * u * u * u : 1 - Mathf.Pow(-2 * u + 2, 3) / 2,
        };

        static float Sample(Key[] k, float t)
        {
            if (t <= k[0].t) return k[0].v;
            if (t >= k[k.Length - 1].t) return k[k.Length - 1].v;
            int i = 0; while (i < k.Length - 2 && t >= k[i + 1].t) i++;
            float u = k[i + 1].t > k[i].t ? (t - k[i].t) / (k[i + 1].t - k[i].t) : 1;
            return k[i].v + (k[i + 1].v - k[i].v) * EaseFn(k[i].e, u);
        }

        static AnimationCurve Bake(Key[] keys, float dur, Func<float, float> map)
        {
            var curve = new AnimationCurve();
            if (keys == null || keys.Length == 1)
            {
                float v = map(keys == null ? float.NaN : keys[0].v);
                curve.AddKey(0, v); curve.AddKey(dur, v);
            }
            else
            {
                var times = new SortedSet<float>(keys.Select(k => Mathf.Clamp(k.t, 0, dur)));
                for (float t = 0; t <= dur + 1e-4f; t += 1f / 60f) times.Add(Mathf.Min(t, dur));
                times.Add(dur);
                foreach (var t in times) curve.AddKey(new Keyframe(t, map(Sample(keys, t))));
            }
            for (int i = 0; i < curve.length; i++)
            {
                AnimationUtility.SetKeyLeftTangentMode(curve, i, AnimationUtility.TangentMode.Linear);
                AnimationUtility.SetKeyRightTangentMode(curve, i, AnimationUtility.TangentMode.Linear);
            }
            return curve;
        }

        static List<AnimationClip> BuildClips(RigDef rig, List<ClipDef> clips, GameObject go, Dictionary<string, Transform> bones, List<(GameObject go, Group g)> faceObjects)
        {
            var result = new List<AnimationClip>();
            foreach (var c in clips)
            {
                string path = $"{AnimDir}/{c.id}.anim";
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                if (!clip) { clip = new AnimationClip(); AssetDatabase.CreateAsset(clip, path); }
                clip.ClearCurves();
                clip.frameRate = 60;
                foreach (var b in rig.bones)
                {
                    string bp = AnimationUtility.CalculateTransformPath(bones[b.id], go.transform);
                    c.tracks.TryGetValue(b.id, out var ch);
                    Key[] Get(string n) => ch != null && ch.TryGetValue(n, out var k) ? k : null;
                    void Set(string prop, AnimationCurve curve) => AnimationUtility.SetEditorCurve(clip, EditorCurveBinding.FloatCurve(bp, typeof(Transform), prop), curve);
                    Set("m_LocalPosition.x", Bake(Get("x"), c.duration, v => (b.x + (float.IsNaN(v) ? 0 : v)) * UNIT));
                    Set("m_LocalPosition.y", Bake(Get("y"), c.duration, v => -(b.y + (float.IsNaN(v) ? 0 : v)) * UNIT));
                    Set("m_LocalPosition.z", Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.x", Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.y", Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.z", Bake(Get("rot"), c.duration, v => -(b.rot + (float.IsNaN(v) ? 0 : v))));
                    Set("m_LocalScale.x", Bake(Get("sx"), c.duration, v => float.IsNaN(v) ? 1 : v));
                    Set("m_LocalScale.y", Bake(Get("sy"), c.duration, v => float.IsNaN(v) ? 1 : v));
                    Set("m_LocalScale.z", Bake(null, c.duration, v => 1));
                }
                foreach (var (fgo, g) in faceObjects)
                {
                    var keys = c.face.TryGetValue(g.faceSlot, out var fk) && fk.Length > 0 ? fk : new[] { new FaceKey(0, FaceDefaults.Fallback[g.faceSlot]) };
                    var curve = new AnimationCurve();
                    float On(string s) => g.faceStates.Contains(s) ? 1 : 0;
                    if (keys[0].t > 0) curve.AddKey(0, On(FaceDefaults.Fallback[g.faceSlot]));
                    foreach (var k in keys) curve.AddKey(k.t, On(k.v));
                    curve.AddKey(c.duration, On(keys[keys.Length - 1].v));
                    for (int i = 0; i < curve.length; i++)
                    {
                        AnimationUtility.SetKeyLeftTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
                        AnimationUtility.SetKeyRightTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
                    }
                    string fp = AnimationUtility.CalculateTransformPath(fgo.transform, go.transform);
                    AnimationUtility.SetEditorCurve(clip, EditorCurveBinding.FloatCurve(fp, typeof(GameObject), "m_IsActive"), curve);
                }
                var settings = AnimationUtility.GetAnimationClipSettings(clip);
                settings.loopTime = c.loop;
                AnimationUtility.SetAnimationClipSettings(clip, settings);
                EditorUtility.SetDirty(clip);
                result.Add(clip);
            }
            return result;
        }

        static AnimatorController BuildController(List<ClipDef> defs, List<AnimationClip> clips)
        {
            string path = $"{AnimDir}/Chispin.controller";
            AssetDatabase.DeleteAsset(path);
            var ctrl = AnimatorController.CreateAnimatorControllerAtPath(path);
            var sm = ctrl.layers[0].stateMachine;
            var states = new Dictionary<string, AnimatorState>();
            for (int i = 0; i < defs.Count; i++)
            {
                var s = sm.AddState(defs[i].id, new Vector3(260 + (i % 4) * 220, 60 + (i / 4) * 80));
                s.motion = clips[i]; s.writeDefaultValues = true;
                states[defs[i].id] = s;
            }
            sm.defaultState = states["idle"];
            foreach (var d in defs.Where(d => !d.loop))
            {
                var t = states[d.id].AddTransition(states["idle"]);
                t.hasExitTime = true; t.exitTime = 1; t.hasFixedDuration = true; t.duration = 0.12f;
            }
            return ctrl;
        }

        static void SetupRig(GameObject go, RigDef rig, List<ClipDef> clips, Dictionary<string, Transform> bones, List<(GameObject go, Group g)> faceObjects)
        {
            var cr = go.AddComponent<CreatureRig>();
            cr.animator = go.GetComponent<Animator>();
            cr.clips = clips.Select(c => new CreatureRig.ClipInfo
            {
                id = c.id, loop = c.loop, breath = c.breath, breathRate = c.breathRate, blink = c.blink, flicker = c.flicker,
                embers = ChispinData.EmberRate[c.id],
            }).ToArray();
            cr.secondary = rig.secondary.Select(s => new CreatureRig.Secondary
            {
                bone = bones[s.bone], driver = bones[s.driver], lag = s.lag, gain = s.gain, velocityGain = s.velocityGain,
                swayAmp = s.swayAmp, swayFreq = s.swayFreq, flickerAmp = s.flickerAmp, flickerFreq = s.flickerFreq,
            }).ToArray();
            cr.breathBone = bones[rig.breathBone];
            cr.eyeBones = rig.eyeBones.Select(b => bones[b]).ToArray();
            cr.eyesOpen = faceObjects.First(f => f.g.faceSlot == "eyes" && f.g.faceStates.Contains("open")).go;
            cr.embers = go.GetComponentInChildren<ParticleSystem>(true);
            cr.tinted = go.GetComponentsInChildren<SpriteRenderer>(true).Cast<Renderer>().ToArray();
        }

        // ── Scene ───────────────────────────────────────────────────────────
        static Sprite GeneratedSprite(string name, int w, int h, float ppu, Func<float, float, Color> f)
        {
            var t = new Texture2D(w, h, TextureFormat.RGBA32, false);
            var px = new Color[w * h];
            for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) px[y * w + x] = f((x + 0.5f) / w, (y + 0.5f) / h);
            t.SetPixels(px); t.Apply();
            string path = $"{GenDir}/{name}.png";
            File.WriteAllBytes(path, t.EncodeToPNG());
            AssetDatabase.ImportAsset(path);
            var ti = (TextureImporter)AssetImporter.GetAtPath(path);
            ti.textureType = TextureImporterType.Sprite; ti.spritePixelsPerUnit = ppu; ti.mipmapEnabled = false;
            ti.textureCompression = TextureImporterCompression.Uncompressed; ti.alphaIsTransparency = true; ti.wrapMode = TextureWrapMode.Clamp;
            ti.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }

        static Light2D AddLight(string name, Light2D.LightType type, Vector3 pos, string hex, float intensity, float radius = 0)
        {
            var go = new GameObject(name); go.transform.position = pos;
            var l = go.AddComponent<Light2D>();
            l.lightType = type; l.color = PaletteMath.Hex(hex); l.intensity = intensity;
            if (type == Light2D.LightType.Point) { l.pointLightOuterRadius = radius; l.pointLightInnerRadius = radius * 0.1f; l.falloffIntensity = 0.6f; }
            return l;
        }

        [MenuItem("TamTam/Build Chispín Lab scene")]
        public static void BuildScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            cam.orthographic = true; cam.orthographicSize = 1.75f; cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = PaletteMath.Hex("#120B1C"); cam.transform.position = new Vector3(0, 1.05f, -10);
            cam.allowHDR = true;
            var acd = camGo.AddComponent<UniversalAdditionalCameraData>();
            acd.renderPostProcessing = true;

            var vol = new GameObject("Global Volume").AddComponent<Volume>();
            vol.isGlobal = true; vol.sharedProfile = RenderSetup.EnsurePostProfile();

            // Habitat backdrop: dusky volcanic den, warm floor glow (lit by the 2D lights).
            var bg = GeneratedSprite("habitat_bg", 1280, 720, 720 / 4.2f, (u, v) =>
            {
                var top = PaletteMath.Hex("#2A1A3E"); var mid = PaletteMath.Hex("#3A1F33"); var floor = PaletteMath.Hex("#4A2626");
                Color c = v > 0.3f ? Color.Lerp(mid, top, (v - 0.3f) / 0.7f) : Color.Lerp(floor, mid, v / 0.3f);
                float glow = Mathf.Exp(-Mathf.Pow((u - 0.5f) / 0.32f, 2) - Mathf.Pow((v - 0.22f) / 0.2f, 2));
                c += PaletteMath.Hex("#FF6A2A") * glow * 0.22f;
                float n = Mathf.PerlinNoise(u * 18, v * 10) * 0.06f - 0.03f;
                return new Color(c.r + n, c.g + n, c.b + n, 1);
            });
            var bgGo = new GameObject("Backdrop"); bgGo.transform.position = new Vector3(0, 1.05f, 5);
            var bgsr = bgGo.AddComponent<SpriteRenderer>(); bgsr.sprite = bg; bgsr.sortingOrder = -100;

            var shadow = GeneratedSprite("ground_shadow", 256, 64, 256 / 3.6f, (u, v) =>
            {
                float d = Mathf.Pow((u - 0.5f) / 0.5f, 2) + Mathf.Pow((v - 0.5f) / 0.5f, 2);
                return new Color(0.04f, 0.02f, 0.06f, Mathf.Clamp01(1 - d) * 0.75f);
            });
            var shGo = new GameObject("GroundShadow"); shGo.transform.position = new Vector3(-0.1f, 0.02f, 0);
            var shsr = shGo.AddComponent<SpriteRenderer>(); shsr.sprite = shadow; shsr.sortingOrder = -10;

            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath);
            var chispin = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            chispin.transform.position = new Vector3(0.3f, 0, 0);

            AddLight("Ambient (Global)", Light2D.LightType.Global, Vector3.zero, "#8C7BC0", 0.5f);
            AddLight("Key", Light2D.LightType.Point, new Vector3(-1.8f, 2.9f, 0), "#FFE6C8", 0.95f, 6f);
            AddLight("Rim", Light2D.LightType.Point, new Vector3(2.4f, 2.3f, 0), "#86A8FF", 0.55f, 3.2f);
            var hearth = AddLight("Hearth", Light2D.LightType.Point, new Vector3(0.2f, -0.4f, 0), "#FF6A2A", 0.55f, 2.6f);
            hearth.gameObject.AddComponent<FlickerLight2D>().amount = 0.1f;

            var lab = new GameObject("Chispín Lab").AddComponent<CreatureDemo>();
            lab.rig = chispin.GetComponent<CreatureRig>();
            lab.alleles = ChispinData.Alleles.Select(a => new CreatureDemo.Allele
            {
                name = a.name, baseC = PaletteMath.Hex(a.bas), accent = PaletteMath.Hex(a.accent), eye = PaletteMath.Hex(a.eye), glow = PaletteMath.Hex(a.glow),
            }).ToArray();

            EditorSceneManager.SaveScene(scene, ScenePath);
            var list = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).ToList();
            list.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = list.ToArray();
        }

        // ── Preview (batch-mode verification) ───────────────────────────────
        [MenuItem("TamTam/Render Chispín preview sheet")]
        public static void RenderPreview()
        {
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            var cam = Camera.main;
            var rig = UnityEngine.Object.FindFirstObjectByType<CreatureRig>();
            const int W = 640, H = 360, COLS = 4;
            var order = ChispinData.ClipOrder;
            var frames = order.Select(id => (id, allele: 0)).Concat(new[] { ("idle", 4), ("celebrate", 2) }).ToArray();
            int rows = Mathf.CeilToInt(frames.Length / (float)COLS);
            var sheet = new Texture2D(W * COLS, H * rows, TextureFormat.RGBA32, false);
            var rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32);
            cam.targetTexture = rt;
            var read = new Texture2D(W, H, TextureFormat.RGBA32, false);
            cam.Render(); // warm-up: light textures and post buffers
            var poseTime = new Dictionary<string, float> { { "eat", 0.3f }, { "celebrate", 0.45f }, { "train", 0.75f }, { "attack", 0.35f }, { "hit", 0.08f }, { "bathe", 0.85f }, { "walk", 0.15f }, { "run", 0.1f } };
            for (int i = 0; i < frames.Length; i++)
            {
                var (id, al) = frames[i];
                var a = ChispinData.Alleles[al];
                rig.SetPalette(PaletteMath.Hex(a.bas), PaletteMath.Hex(a.accent), PaletteMath.Hex(a.eye), PaletteMath.Hex(a.glow));
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>($"{AnimDir}/{id}.anim");
                clip.SampleAnimation(rig.gameObject, poseTime.TryGetValue(id, out var t) ? t : clip.length * 0.4f);
                foreach (var skin in rig.GetComponentsInChildren<SpriteSkin>()) skin.enabled = true;
                cam.Render();
                RenderTexture.active = rt;
                read.ReadPixels(new Rect(0, 0, W, H), 0, 0); read.Apply();
                int cx = i % COLS, cy = rows - 1 - i / COLS;
                sheet.SetPixels(cx * W, cy * H, W, H, read.GetPixels());
            }
            sheet.Apply();
            RenderTexture.active = null; cam.targetTexture = null;
            string outDir = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/media/unity"));
            Directory.CreateDirectory(outDir);
            File.WriteAllBytes(Path.Combine(outDir, "chispin-clips.png"), sheet.EncodeToPNG());
            Debug.Log($"TamTam: preview sheet → {outDir}");
        }

        public static void BuildAllBatch()
        {
            try { BuildAll(); RenderPreview(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
