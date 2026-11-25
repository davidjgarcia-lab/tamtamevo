using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.U2D.Sprites;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.U2D;
using UnityEngine.U2D.Animation;

namespace TamTam.EditorTools.Chispin
{
    /// Chispín from a PAINTED illustration (AI-generated, transparent PNG, side view facing right):
    /// one skinned sprite (2D Animation) with a bone chain placed on the painting, a grid mesh and automatic
    /// weights (flames follow the crest bones, scales follow body/neck/head/tail/legs), the 14 shared clips
    /// re-targeted onto it, a tint mask derived from the painting's colours, and the ChispinLab scene.
    public static class PaintedChispinBuilder
    {
        const string Dir = "Assets/TamTam/Art/Creatures/Chispin/Painted";
        const string Source = Dir + "/chispin_side_raw.png";
        const string MaskPath = Dir + "/chispin_side_mask.png";
        const string AnimDir = "Assets/TamTam/Animation/ChispinPainted";
        const string PrefabPath = "Assets/TamTam/Prefabs/ChispinPainted.prefab";
        const string ScenePath = "Assets/TamTam/Scenes/ChispinLab.unity";
        const string BackdropPath = "Assets/TamTam/Art/Environments/FireDen/fire_den_bg.png";
        const float UNIT = 1f / 40f;

        // Bone layout measured on the painting (pixels of a 2576-wide preview, y down) → scaled to the source.
        struct B { public string id, parent; public Vector2 a, b; public B(string id, string parent, float ax, float ay, float bx, float by) { this.id = id; this.parent = parent; a = new Vector2(ax, ay); b = new Vector2(bx, by); } }
        static readonly B[] Layout =
        {
            new B("root", null, 1300, 1255, 1340, 1255),
            new B("body", "root", 1060, 900, 1500, 860),
            new B("tail1", "body", 900, 905, 700, 905),
            new B("tail2", "tail1", 700, 905, 530, 830),
            new B("tail3", "tail2", 530, 830, 445, 690),
            new B("tail4", "tail3", 445, 690, 470, 560),
            new B("neck", "body", 1540, 830, 1640, 560),
            new B("head", "neck", 1640, 540, 2070, 525),
            new B("jaw", "head", 1700, 610, 2020, 610),
            new B("crest1", "head", 1700, 430, 1660, 230),
            new B("crest2", "neck", 1480, 640, 1400, 450),
            new B("crest3", "body", 1150, 760, 1100, 650),
            new B("legFN", "body", 1430, 980, 1480, 1240),
            new B("legFF", "body", 1660, 980, 1800, 1220),
            new B("legBN", "body", 990, 1000, 930, 1250),
            new B("legBF", "body", 1160, 1060, 1250, 1220),
        };
        static readonly HashSet<string> Flames = new HashSet<string> { "crest1", "crest2", "crest3" };
        static readonly HashSet<string> NoSkin = new HashSet<string> { "root", "jaw" }; // jaw: mouth stays painted shut until mouth overlays exist

        [MenuItem("TamTam/Build Chispín PAINTED (rig, clips, scene)")]
        public static void Build()
        {
            RenderSetup.Setup();
            Directory.CreateDirectory(AnimDir);
            var srcTex = new Texture2D(2, 2); srcTex.LoadImage(File.ReadAllBytes(Source));
            int W = srcTex.width, H = srcTex.height; float k = W / 2576f;
            var px = srcTex.GetPixels32();

            // Creature height ≈ the rig's 95 units → pixels per unit for the sprite.
            int top = H, bottom = 0;
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x += 4) if (px[y * W + x].a > 40) { top = Mathf.Min(top, H - 1 - y); bottom = Mathf.Max(bottom, H - 1 - y); }
            float ppu = (bottom - top) / (100 * UNIT);

            var (refBase, refAccent) = WriteMask(px, W, H);
            AssetDatabase.ImportAsset(MaskPath);
            var mi = (TextureImporter)AssetImporter.GetAtPath(MaskPath);
            mi.sRGBTexture = false; mi.alphaSource = TextureImporterAlphaSource.FromInput; mi.mipmapEnabled = false;
            mi.textureCompression = TextureImporterCompression.Uncompressed; mi.npotScale = TextureImporterNPOTScale.None; mi.maxTextureSize = 4096;
            mi.SaveAndReimport();

            // Bones in source pixels, y up (texture space).
            Vector2 P(Vector2 v) => new Vector2(v.x * k, H - v.y * k);
            var pos = Layout.ToDictionary(b => b.id, b => P(b.a));
            var end = Layout.ToDictionary(b => b.id, b => P(b.b));
            var ang = Layout.ToDictionary(b => b.id, b => { var d = end[b.id] - pos[b.id]; return Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg; });
            Vector2 pivotPx = pos["root"];

            var ti = (TextureImporter)AssetImporter.GetAtPath(Source);
            ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single;
            ti.mipmapEnabled = false; ti.alphaIsTransparency = true; ti.maxTextureSize = 4096;
            ti.textureCompression = TextureImporterCompression.CompressedHQ;
            var st = new TextureImporterSettings(); ti.ReadTextureSettings(st);
            st.spritePixelsPerUnit = ppu; st.spriteAlignment = (int)SpriteAlignment.Custom; st.spritePivot = new Vector2(pivotPx.x / W, pivotPx.y / H);
            st.spriteMeshType = SpriteMeshType.FullRect; st.spriteGenerateFallbackPhysicsShape = false;
            ti.SetTextureSettings(st);
            ti.SaveAndReimport();

            var factory = new SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti);
            dp.InitSpriteEditorDataProvider();
            var guid = dp.GetSpriteRects()[0].spriteID;
            dp.GetDataProvider<ISecondaryTextureDataProvider>().textures = new[] { new SecondarySpriteTexture { name = "_TintMask", texture = AssetDatabase.LoadAssetAtPath<Texture2D>(MaskPath) } };

            var index = Layout.Select((b, i) => (b.id, i)).ToDictionary(t => t.id, t => t.i);
            var spriteBones = Layout.Select(b =>
            {
                int parent = b.parent == null ? -1 : index[b.parent];
                Vector3 p; Quaternion r;
                if (parent < 0) { p = pos[b.id]; r = Quaternion.Euler(0, 0, ang[b.id]); }
                else
                {
                    var d = pos[b.id] - pos[b.parent];
                    p = Quaternion.Euler(0, 0, -ang[b.parent]) * d;
                    r = Quaternion.Euler(0, 0, ang[b.id] - ang[b.parent]);
                }
                return new SpriteBone { name = b.id, guid = GUID.Generate().ToString(), parentId = parent, position = p, rotation = r, length = Mathf.Max(1, (end[b.id] - pos[b.id]).magnitude) };
            }).ToList();
            dp.GetDataProvider<ISpriteBoneDataProvider>().SetBones(guid, spriteBones);
            BuildMesh(dp.GetDataProvider<ISpriteMeshDataProvider>(), guid, px, W, H, pos, end, index);
            dp.Apply();
            ti.SaveAndReimport();
            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(Source);

            // Hierarchy: bones as transforms in sprite-renderer space (world units, origin = pivot).
            var go = new GameObject("ChispinPainted");
            go.AddComponent<Animator>();
            var bones = new Dictionary<string, Transform>();
            var restPos = new Dictionary<string, Vector3>(); var restRot = new Dictionary<string, float>();
            foreach (var b in Layout)
            {
                var t = new GameObject(b.id).transform;
                t.SetParent(b.parent == null ? go.transform : bones[b.parent], false);
                Vector2 worldPx = pos[b.id] - pivotPx;
                if (b.parent == null) { t.localPosition = worldPx / ppu; t.localRotation = Quaternion.Euler(0, 0, ang[b.id]); }
                else
                {
                    t.position = go.transform.TransformPoint(worldPx / ppu);
                    t.rotation = Quaternion.Euler(0, 0, ang[b.id]);
                }
                bones[b.id] = t; restPos[b.id] = t.localPosition; restRot[b.id] = t.localEulerAngles.z;
            }
            var mat = ChispinBuilder.CreatureMaterial(PaletteMath.Derive("#7D2430", "#FF7A24", "#FFC247", "#FFB347"));
            var pmat = new Material(mat) { name = "CreatureLitPainted" };
            pmat.SetColor("_RefBase", refBase); pmat.SetColor("_BaseColor", refBase);
            pmat.SetColor("_RefAccent", refAccent); pmat.SetColor("_AccentColor", refAccent);
            pmat.SetColor("_RefGlow", refAccent); pmat.SetColor("_GlowColor", refAccent);
            pmat.SetFloat("_EmissionStrength", 1.1f);
            pmat.SetFloat("_GroundAO", 0.35f); pmat.SetFloat("_GroundAOHeight", 0.5f);
            AssetDatabase.DeleteAsset("Assets/TamTam/Materials/CreatureLitPainted.mat");
            AssetDatabase.CreateAsset(pmat, "Assets/TamTam/Materials/CreatureLitPainted.mat");

            var gfx = new GameObject("gfx_painted");
            gfx.transform.SetParent(go.transform, false);
            var sr = gfx.AddComponent<SpriteRenderer>(); sr.sprite = sprite; sr.sharedMaterial = pmat;
            var skin = gfx.AddComponent<SpriteSkin>();
            skin.SetRootBone(bones["root"]);
            var state = skin.SetBoneTransforms(Layout.Select(b => bones[b.id]).ToArray());
            skin.alwaysUpdate = true;
            if (state != SpriteSkinState.Ready) Debug.LogWarning($"TamTam: painted SpriteSkin state {state}");
            // Face overlay: closed eyes cut from an edited variant of the painting, riding the head bone.
            GameObject eyesClosed = null;
            if (MakeEyePatch(px, W, H, k, out var eyeC))
            {
                var spr = ImportOverlay(EyesClosedPath, EyesClosedMask, ppu);
                eyesClosed = new GameObject("face_eyesClosed");
                eyesClosed.transform.SetParent(go.transform, false);
                eyesClosed.transform.localPosition = (eyeC - pivotPx) / ppu;
                eyesClosed.transform.SetParent(bones["head"], true);
                var esr = eyesClosed.AddComponent<SpriteRenderer>(); esr.sprite = spr; esr.sharedMaterial = pmat; esr.sortingOrder = 1;
                eyesClosed.SetActive(false);
            }

            // Embers + crest light at the flame crest.
            var emberMat = ChispinBuilder.EmberMaterial();
            var emb = new GameObject("Embers"); emb.transform.SetParent(bones["crest1"], false);
            emb.transform.position = go.transform.TransformPoint((end["crest1"] - pivotPx) / ppu);
            var ps = emb.AddComponent<ParticleSystem>(); ConfigureEmbers(ps, emberMat);
            var lightGo = new GameObject("CrestLight"); lightGo.transform.SetParent(bones["crest1"], false);
            lightGo.transform.position = emb.transform.position;
            var l = lightGo.AddComponent<Light2D>();
            l.lightType = Light2D.LightType.Point; l.color = PaletteMath.Hex("#FF9A4A"); l.intensity = 1.1f;
            l.pointLightOuterRadius = 2.2f; l.pointLightInnerRadius = 0.1f; l.falloffIntensity = 0.7f;
            lightGo.AddComponent<FlickerLight2D>();

            // Clips: the shared 14 (ChispinData) re-targeted on this rig — rotations/scales relative to the painted rest pose.
            var defs = ChispinData.Clips();
            var clips = new List<AnimationClip>();
            foreach (var c in defs)
            {
                string path = $"{AnimDir}/{c.id}.anim";
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                if (!clip) { clip = new AnimationClip(); AssetDatabase.CreateAsset(clip, path); }
                clip.ClearCurves(); clip.frameRate = 60;
                foreach (var b in Layout)
                {
                    string bp = AnimationUtility.CalculateTransformPath(bones[b.id], go.transform);
                    c.tracks.TryGetValue(b.id, out var ch);
                    Key[] Get(string n) => ch != null && ch.TryGetValue(n, out var kk) ? kk : null;
                    var rp = restPos[b.id]; float rr = restRot[b.id];
                    // Rig offsets are in the parent's frame with y down; the painted bones have rotated frames,
                    // so express the offset in world axes and bring it into the parent's local frame.
                    var parentRot = b.parent == null ? 0 : bones[b.parent].eulerAngles.z;
                    Vector3 Off(float x, float y) => Quaternion.Euler(0, 0, -parentRot) * new Vector3(x * UNIT, -y * UNIT, 0);
                    void Set(string prop, AnimationCurve curve) => AnimationUtility.SetEditorCurve(clip, EditorCurveBinding.FloatCurve(bp, typeof(Transform), prop), curve);
                    float N(float v) => float.IsNaN(v) ? 0 : v;
                    // x/y tracks rarely share key times; bake each axis from both tracks sampled together.
                    var kx = Get("x"); var ky = Get("y");
                    Set("m_LocalPosition.x", ChispinBuilder.Bake(Merge(kx, ky), c.duration, t => rp.x + Off(Sample(kx, t), Sample(ky, t)).x));
                    Set("m_LocalPosition.y", ChispinBuilder.Bake(Merge(kx, ky), c.duration, t => rp.y + Off(Sample(kx, t), Sample(ky, t)).y));
                    Set("m_LocalPosition.z", ChispinBuilder.Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.x", ChispinBuilder.Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.y", ChispinBuilder.Bake(null, c.duration, v => 0));
                    Set("localEulerAnglesRaw.z", ChispinBuilder.Bake(Get("rot"), c.duration, v => rr - N(v)));
                    Set("m_LocalScale.x", ChispinBuilder.Bake(Get("sx"), c.duration, v => float.IsNaN(v) ? 1 : v));
                    Set("m_LocalScale.y", ChispinBuilder.Bake(Get("sy"), c.duration, v => float.IsNaN(v) ? 1 : v));
                    Set("m_LocalScale.z", ChispinBuilder.Bake(null, c.duration, v => 1));
                }
                if (eyesClosed)
                {
                    var keys = c.face.TryGetValue("eyes", out var fk) && fk.Length > 0 ? fk : new[] { new FaceKey(0, "open") };
                    float On(string v) => v == "closed" || v == "happy" ? 1 : 0;
                    var curve = new AnimationCurve();
                    if (keys[0].t > 0) curve.AddKey(0, 0);
                    foreach (var fkey in keys) curve.AddKey(fkey.t, On(fkey.v));
                    curve.AddKey(c.duration, On(keys[keys.Length - 1].v));
                    for (int i = 0; i < curve.length; i++)
                    {
                        AnimationUtility.SetKeyLeftTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
                        AnimationUtility.SetKeyRightTangentMode(curve, i, AnimationUtility.TangentMode.Constant);
                    }
                    AnimationUtility.SetEditorCurve(clip, EditorCurveBinding.FloatCurve(AnimationUtility.CalculateTransformPath(eyesClosed.transform, go.transform), typeof(GameObject), "m_IsActive"), curve);
                }                var settings = AnimationUtility.GetAnimationClipSettings(clip); settings.loopTime = c.loop; AnimationUtility.SetAnimationClipSettings(clip, settings);
                EditorUtility.SetDirty(clip); clips.Add(clip);
            }
            var ctrl = ChispinBuilder.BuildController(defs, clips, $"{AnimDir}/ChispinPainted.controller");
            go.GetComponent<Animator>().runtimeAnimatorController = ctrl;

            var rigDef = ChispinData.Rig();
            var cr = go.AddComponent<CreatureRig>();
            cr.animator = go.GetComponent<Animator>();
            cr.clips = defs.Select(c => new CreatureRig.ClipInfo { id = c.id, loop = c.loop, breath = c.breath, breathRate = c.breathRate, blink = c.blink, flicker = c.flicker, embers = ChispinData.EmberRate[c.id] }).ToArray();
            cr.secondary = rigDef.secondary.Where(s => bones.ContainsKey(s.bone) && bones.ContainsKey(s.driver)).Select(s => new CreatureRig.Secondary
            {
                bone = bones[s.bone], driver = bones[s.driver], lag = s.lag, gain = s.gain, velocityGain = s.velocityGain,
                swayAmp = s.swayAmp, swayFreq = s.swayFreq, flickerAmp = s.flickerAmp, flickerFreq = s.flickerFreq,
            }).ToArray();
            cr.breathBone = bones["body"]; cr.eyeBones = new Transform[0];
            cr.embers = ps; cr.blinkOverlay = eyesClosed;
            cr.tinted = eyesClosed ? new Renderer[] { sr, eyesClosed.GetComponent<SpriteRenderer>() } : new Renderer[] { sr };
            var gshadow = go.AddComponent<GroundShadow>(); gshadow.target = sr; gshadow.widthFactor = 0.55f;

            Directory.CreateDirectory(Path.GetDirectoryName(PrefabPath));
            PrefabUtility.SaveAsPrefabAsset(go, PrefabPath);
            UnityEngine.Object.DestroyImmediate(go);
            BuildScene();
            AssetDatabase.SaveAssets();
            Debug.Log($"TamTam: painted Chispín built — {W}x{H}, ppu {ppu:0}, {Layout.Length} bones, {clips.Count} clips.");
        }

        const string EyesClosedSource = Dir + "/Source~/chispin_eyes_closed_full.png";
        const string EyesClosedPath = Dir + "/chispin_eyes_closed.png";
        const string EyesClosedMask = Dir + "/chispin_eyes_closed_mask.png";

        static float Gray(Color32 c) => (c.r * 0.3f + c.g * 0.59f + c.b * 0.11f) / 255f;

        /// Aligns an edited variant (same character, slightly shifted/scaled by the generator) onto the base painting
        /// around a region, by brute-force search of offset + scale minimising the grey-level difference.
        static (Vector2 d, float s) Register(Color32[] a, Color32[] b, int W, int H, RectInt region, Vector2 c)
        {
            float Cost(Vector2 d, float s, int step)
            {
                double sum = 0; int n = 0;
                for (int y = region.yMin; y < region.yMax; y += step)
                    for (int x = region.xMin; x < region.xMax; x += step)
                    {
                        var pa = a[y * W + x]; if (pa.a < 200) continue;
                        var q = c + s * (new Vector2(x, y) - c) + d;
                        int bx = Mathf.RoundToInt(q.x), by = Mathf.RoundToInt(q.y);
                        if (bx < 0 || by < 0 || bx >= W || by >= H) { sum += 1; n++; continue; }
                        float e = Gray(pa) - Gray(b[by * W + bx]); sum += e * e; n++;
                    }
                return n == 0 ? float.MaxValue : (float)(sum / n);
            }
            Vector2 best = Vector2.zero; float bs = 1, bc = float.MaxValue;
            for (float s = 0.95f; s <= 1.051f; s += 0.01f)
                for (int dy = -120; dy <= 120; dy += 8)
                    for (int dx = -120; dx <= 120; dx += 8)
                    { float cst = Cost(new Vector2(dx, dy), s, 8); if (cst < bc) { bc = cst; best = new Vector2(dx, dy); bs = s; } }
            var coarse = best; float cs = bs;
            for (float s = cs - 0.01f; s <= cs + 0.0101f; s += 0.0025f)
                for (int dy = -8; dy <= 8; dy++)
                    for (int dx = -8; dx <= 8; dx++)
                    { var d = coarse + new Vector2(dx, dy); float cst = Cost(d, s, 3); if (cst < bc) { bc = cst; best = d; bs = s; } }
            Debug.Log($"TamTam: eye variant registered d={best} s={bs:0.000} err={bc:0.0000}");
            return (best, bs);
        }

        /// Cuts the closed eye out of the edited variant as a feathered patch in base-painting space.
        static bool MakeEyePatch(Color32[] basePx, int W, int H, float k, out Vector2 centerPx)
        {
            centerPx = new Vector2(1800 * k, H - 470 * k);
            if (!File.Exists(EyesClosedSource)) return false;
            var vt = new Texture2D(2, 2); vt.LoadImage(File.ReadAllBytes(EyesClosedSource));
            if (vt.width != W || vt.height != H) { Debug.LogWarning("TamTam: eye variant size differs"); return false; }
            var vpx = vt.GetPixels32();
            var head = new RectInt(Mathf.RoundToInt(1640 * k), Mathf.RoundToInt(H - 690 * k), Mathf.RoundToInt(460 * k), Mathf.RoundToInt(340 * k));
            var (d, s) = Register(basePx, vpx, W, H, head, head.center);
            int rx = Mathf.RoundToInt(150 * k), ry = Mathf.RoundToInt(105 * k);
            int pw = rx * 2, ph = ry * 2;
            var patch = new Color[pw * ph];
            for (int y = 0; y < ph; y++)
                for (int x = 0; x < pw; x++)
                {
                    var p = centerPx + new Vector2(x - rx + 0.5f, y - ry + 0.5f);
                    var q = (Vector2)head.center + s * (p - (Vector2)head.center) + d;
                    var c = vt.GetPixelBilinear(q.x / W, q.y / H);
                    float r = Mathf.Sqrt(Mathf.Pow((x - rx + 0.5f) / rx, 2) + Mathf.Pow((y - ry + 0.5f) / ry, 2));
                    float tt = Mathf.Clamp01((r - 0.62f) / 0.38f); float a = 1 - tt * tt * (3 - 2 * tt);
                    var bp = basePx[Mathf.Clamp((int)p.y, 0, H - 1) * W + Mathf.Clamp((int)p.x, 0, W - 1)];
                    patch[y * pw + x] = new Color(c.r, c.g, c.b, a * bp.a / 255f); // never paint outside the silhouette
                }
            var t = new Texture2D(pw, ph, TextureFormat.RGBA32, false); t.SetPixels(patch); t.Apply();
            File.WriteAllBytes(EyesClosedPath, t.EncodeToPNG());
            var mask = new Color[patch.Length];
            for (int i = 0; i < patch.Length; i++) mask[i] = MaskOf(patch[i]);
            var mt = new Texture2D(pw, ph, TextureFormat.RGBA32, false, true); mt.SetPixels(mask); mt.Apply();
            File.WriteAllBytes(EyesClosedMask, mt.EncodeToPNG());
            return true;
        }

        static Color MaskOf(Color c)
        {
            if (c.a < 0.02f) return Color.clear;
            Color.RGBToHSV(c, out float h, out float s, out float v);
            float hd = h * 360;
            float fire = (hd >= 8 && hd <= 55 && s > 0.45f && v > 0.55f) ? Mathf.Clamp01((v - 0.55f) / 0.25f) * Mathf.Clamp01((s - 0.45f) / 0.2f) : 0;
            float scale = ((hd >= 320 || hd <= 12) && s > 0.3f && v < 0.75f && fire < 0.5f) ? Mathf.Clamp01((s - 0.3f) / 0.2f) : 0;
            return new Color(scale, fire, fire * Mathf.Clamp01((v - 0.6f) / 0.3f), 0);
        }

        static Sprite ImportOverlay(string path, string maskPath, float ppu)
        {
            AssetDatabase.ImportAsset(maskPath);
            var mi = (TextureImporter)AssetImporter.GetAtPath(maskPath);
            mi.sRGBTexture = false; mi.alphaSource = TextureImporterAlphaSource.FromInput; mi.mipmapEnabled = false;
            mi.textureCompression = TextureImporterCompression.Uncompressed; mi.npotScale = TextureImporterNPOTScale.None; mi.SaveAndReimport();
            AssetDatabase.ImportAsset(path);
            var ti = (TextureImporter)AssetImporter.GetAtPath(path);
            ti.textureType = TextureImporterType.Sprite; ti.spriteImportMode = SpriteImportMode.Single; ti.spritePixelsPerUnit = ppu;
            ti.mipmapEnabled = false; ti.alphaIsTransparency = true; ti.textureCompression = TextureImporterCompression.Uncompressed;
            ti.SaveAndReimport();
            var factory = new SpriteDataProviderFactories(); factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti); dp.InitSpriteEditorDataProvider();
            dp.GetDataProvider<ISecondaryTextureDataProvider>().textures = new[] { new SecondarySpriteTexture { name = "_TintMask", texture = AssetDatabase.LoadAssetAtPath<Texture2D>(maskPath) } };
            dp.Apply(); ti.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }

        static Key[] Merge(Key[] a, Key[] b)
        {
            if (a == null && b == null) return null;
            var all = (a ?? new Key[0]).Concat(b ?? new Key[0]).Select(x => x.t).Distinct().OrderBy(t => t).ToArray();
            if (all.Length <= 1) return new[] { new Key(0, 0) };
            return all.Select(t => new Key(t, t, Ease.Linear)).ToArray(); // value = time: Bake's map receives t
        }

        static float Sample(Key[] k, float t)
        {
            if (k == null) return 0;
            if (t <= k[0].t) return k[0].v;
            if (t >= k[k.Length - 1].t) return k[k.Length - 1].v;
            int i = 0; while (i < k.Length - 2 && t >= k[i + 1].t) i++;
            float u = k[i + 1].t > k[i].t ? (t - k[i].t) / (k[i + 1].t - k[i].t) : 1;
            float e = k[i].e switch
            {
                Ease.Linear => u, Ease.In => u * u * u, Ease.Out => 1 - Mathf.Pow(1 - u, 3), Ease.Step => 0,
                _ => u < 0.5f ? 4 * u * u * u : 1 - Mathf.Pow(-2 * u + 2, 3) / 2,
            };
            return k[i].v + (k[i + 1].v - k[i].v) * e;
        }

        // ── Tint mask from the painting: burgundy scales → R (base), fire → G (accent) + B (emissive) ──
        static (Color refBase, Color refAccent) WriteMask(Color32[] px, int W, int H)
        {
            var mask = new Color[px.Length];
            Vector3 sumB = Vector3.zero, sumA = Vector3.zero; float nB = 0, nA = 0;
            for (int i = 0; i < px.Length; i++)
            {
                var c = (Color)px[i];
                if (c.a < 0.02f) continue;
                Color.RGBToHSV(c, out float h, out float s, out float v);
                float hd = h * 360;
                float fire = (hd >= 8 && hd <= 55 && s > 0.45f && v > 0.55f) ? Mathf.Clamp01((v - 0.55f) / 0.25f) * Mathf.Clamp01((s - 0.45f) / 0.2f) : 0;
                float scale = ((hd >= 320 || hd <= 12) && s > 0.3f && v < 0.75f && fire < 0.5f) ? Mathf.Clamp01((s - 0.3f) / 0.2f) : 0;
                float emissive = fire * Mathf.Clamp01((v - 0.6f) / 0.3f);
                mask[i] = new Color(scale, fire, emissive, 0);
                if (scale > 0.9f) { sumB += new Vector3(c.r, c.g, c.b); nB++; }
                if (fire > 0.9f) { sumA += new Vector3(c.r, c.g, c.b); nA++; }
            }
            var t = new Texture2D(W, H, TextureFormat.RGBA32, false, true); t.SetPixels(mask); t.Apply();
            File.WriteAllBytes(MaskPath, t.EncodeToPNG());
            var rb = nB > 0 ? sumB / nB : new Vector3(0.49f, 0.14f, 0.19f); var ra = nA > 0 ? sumA / nA : new Vector3(1, 0.48f, 0.14f);
            return (new Color(rb.x, rb.y, rb.z), new Color(ra.x, ra.y, ra.z));
        }

        static bool IsFlame(Color32 c)
        {
            Color.RGBToHSV(c, out float h, out float s, out float v);
            float hd = h * 360;
            return hd >= 8 && hd <= 60 && s > 0.45f && v > 0.6f;
        }

        static void BuildMesh(ISpriteMeshDataProvider mp, GUID guid, Color32[] px, int W, int H,
            Dictionary<string, Vector2> pos, Dictionary<string, Vector2> end, Dictionary<string, int> index)
        {
            const int cell = 24;
            int cw = Mathf.CeilToInt(W / (float)cell), ch = Mathf.CeilToInt(H / (float)cell);
            var used = new bool[cw, ch];
            for (int cy = 0; cy < ch; cy++)
                for (int cx = 0; cx < cw; cx++)
                {
                    bool any = false;
                    for (int y = cy * cell; y < Mathf.Min(H, (cy + 1) * cell) && !any; y += 2)
                        for (int x = cx * cell; x < Mathf.Min(W, (cx + 1) * cell); x += 2) if (px[y * W + x].a > 8) { any = true; break; }
                    used[cx, cy] = any;
                }
            var segs = Layout.Where(b => !NoSkin.Contains(b.id)).Select(b => (b.id, a: pos[b.id], e: end[b.id])).ToList();
            var verts = new List<Vertex2DMetaData>(); var vi = new Dictionary<Vector2Int, int>();
            int V(int gx, int gy)
            {
                var key = new Vector2Int(gx, gy);
                if (vi.TryGetValue(key, out int id)) return id;
                var p = new Vector2(Mathf.Min(gx * cell, W), Mathf.Min(gy * cell, H));
                int sx = Mathf.Clamp((int)p.x, 0, W - 1), sy = Mathf.Clamp((int)p.y, 0, H - 1);
                // Sample a small neighbourhood to decide whether this vertex sits on flame.
                int flame = 0, solid = 0;
                for (int dy = -6; dy <= 6; dy += 3) for (int dx = -6; dx <= 6; dx += 3)
                {
                    int xx = Mathf.Clamp(sx + dx, 0, W - 1), yy = Mathf.Clamp(sy + dy, 0, H - 1);
                    var c = px[yy * W + xx]; if (c.a < 30) continue; solid++; if (IsFlame(c)) flame++;
                }
                bool onFlame = solid > 0 && flame * 2 > solid;
                verts.Add(new Vertex2DMetaData { position = p, boneWeight = Weights(p, segs, onFlame, index) });
                vi[key] = verts.Count - 1; return verts.Count - 1;
            }
            var tris = new List<int>(); var edges = new Dictionary<(int, int), int>();
            void E(int a, int b) { var kk = a < b ? (a, b) : (b, a); edges[kk] = edges.TryGetValue(kk, out int n) ? n + 1 : 1; }
            for (int cy = 0; cy < ch; cy++)
                for (int cx = 0; cx < cw; cx++)
                {
                    if (!used[cx, cy]) continue;
                    int a = V(cx, cy), b = V(cx + 1, cy), c = V(cx + 1, cy + 1), d = V(cx, cy + 1);
                    tris.AddRange(new[] { a, c, b, a, d, c }); E(a, b); E(b, c); E(c, d); E(d, a);
                }
            mp.SetVertices(guid, verts.ToArray());
            mp.SetIndices(guid, tris.ToArray());
            mp.SetEdges(guid, edges.Where(e => e.Value == 1).Select(e => new Vector2Int(e.Key.Item1, e.Key.Item2)).ToArray());
        }

        static BoneWeight Weights(Vector2 p, List<(string id, Vector2 a, Vector2 e)> segs, bool onFlame, Dictionary<string, int> index)
        {
            // Flames ride the crest bones (and the tail tip flame rides tail4); everything else ignores crest bones.
            var cand = segs.Where(s => onFlame ? (Flames.Contains(s.id) || s.id == "tail4" || s.id == "tail3") : !Flames.Contains(s.id)).ToList();
            var w = cand.Select(s =>
            {
                var ab = s.e - s.a; float t = Mathf.Clamp01(Vector2.Dot(p - s.a, ab) / ab.sqrMagnitude);
                float d = (s.a + ab * t - p).magnitude;
                return (s.id, w: 1f / Mathf.Pow(d * d + 40f * 40f, 2));
            }).OrderByDescending(x => x.w).Take(3).ToArray();
            float sum = w.Sum(x => x.w);
            var bw = new BoneWeight { boneIndex0 = index[w[0].id], weight0 = w[0].w / sum };
            if (w.Length > 1) { bw.boneIndex1 = index[w[1].id]; bw.weight1 = w[1].w / sum; }
            if (w.Length > 2) { bw.boneIndex2 = index[w[2].id]; bw.weight2 = w[2].w / sum; }
            return bw;
        }

        static void ConfigureEmbers(ParticleSystem ps, Material mat)
        {
            var main = ps.main;
            main.startLifetime = new ParticleSystem.MinMaxCurve(1.0f, 1.8f); main.startSpeed = 0;
            main.startSize = new ParticleSystem.MinMaxCurve(0.04f, 0.08f); main.simulationSpace = ParticleSystemSimulationSpace.World; main.maxParticles = 120;
            main.startColor = new ParticleSystem.MinMaxGradient(PaletteMath.Hex("#FFD166"), PaletteMath.Hex("#FF7A24"));
            var em = ps.emission; em.rateOverTime = 2.4f;
            var shape = ps.shape; shape.shapeType = ParticleSystemShapeType.Circle; shape.radius = 0.25f;
            var vel = ps.velocityOverLifetime; vel.enabled = true; vel.space = ParticleSystemSimulationSpace.World;
            vel.x = new ParticleSystem.MinMaxCurve(-0.25f, 0.1f); vel.y = new ParticleSystem.MinMaxCurve(0.4f, 0.8f); vel.z = new ParticleSystem.MinMaxCurve(0f, 0f);
            var noise = ps.noise; noise.enabled = true; noise.strength = 0.25f; noise.frequency = 1.2f;
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(new Color(1, 0.55f, 0.3f), 1) },
                new[] { new GradientAlphaKey(0, 0), new GradientAlphaKey(1, 0.12f), new GradientAlphaKey(0.8f, 0.6f), new GradientAlphaKey(0, 1) });
            col.color = g;
            var size = ps.sizeOverLifetime; size.enabled = true; size.size = new ParticleSystem.MinMaxCurve(1, AnimationCurve.Linear(0, 1, 1, 0.3f));
            var pr = ps.GetComponent<ParticleSystemRenderer>(); pr.sharedMaterial = mat; pr.sortingOrder = 50;
        }

        // ── Scene: painted den backdrop (if generated) + lights tuned for painted art ──
        public static void BuildScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            cam.orthographic = true; cam.orthographicSize = 1.55f; cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = PaletteMath.Hex("#120B1C"); cam.transform.position = new Vector3(0, 1.15f, -10); cam.allowHDR = true;
            camGo.AddComponent<UniversalAdditionalCameraData>().renderPostProcessing = true;
            var vol = new GameObject("Global Volume").AddComponent<Volume>();
            vol.isGlobal = true; vol.sharedProfile = RenderSetup.EnsurePostProfile();

            Sprite bg = null;
            if (File.Exists(BackdropPath))
            {
                var bi = (TextureImporter)AssetImporter.GetAtPath(BackdropPath);
                bi.textureType = TextureImporterType.Sprite; bi.mipmapEnabled = false; bi.maxTextureSize = 4096;
                var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(BackdropPath);
                bi.spritePixelsPerUnit = tex.height / (2 * 1.55f * 1.06f); bi.SaveAndReimport();
                bg = AssetDatabase.LoadAssetAtPath<Sprite>(BackdropPath);
            }
            else
                bg = ChispinBuilder.GeneratedSprite("habitat_bg", 1280, 720, 720 / 4.2f, (u, v) =>
                {
                    var top = PaletteMath.Hex("#2A1A3E"); var mid = PaletteMath.Hex("#3A1F33"); var floor = PaletteMath.Hex("#4A2626");
                    Color c = v > 0.3f ? Color.Lerp(mid, top, (v - 0.3f) / 0.7f) : Color.Lerp(floor, mid, v / 0.3f);
                    c += PaletteMath.Hex("#FF6A2A") * Mathf.Exp(-Mathf.Pow((u - 0.5f) / 0.32f, 2) - Mathf.Pow((v - 0.22f) / 0.2f, 2)) * 0.22f;
                    return c;
                });
            var bgGo = new GameObject("Backdrop"); bgGo.transform.position = new Vector3(0, 1.15f, 5);
            var bgsr = bgGo.AddComponent<SpriteRenderer>(); bgsr.sprite = bg; bgsr.sortingOrder = -100;


            var chispin = (GameObject)PrefabUtility.InstantiatePrefab(AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath));
            chispin.transform.position = new Vector3(-0.45f, 0.0f, 0); chispin.transform.localScale = Vector3.one * 0.85f;

            // Painted art carries its own shading: brighter, gentler lights that tint rather than sculpt.
            ChispinBuilder.AddLight("Ambient (Global)", Light2D.LightType.Global, Vector3.zero, "#C9BFE6", 0.85f);
            ChispinBuilder.AddLight("Key", Light2D.LightType.Point, new Vector3(-2.2f, 3.2f, 0), "#FFE6C8", 0.45f, 6f);
            ChispinBuilder.AddLight("Rim", Light2D.LightType.Point, new Vector3(2.6f, 2.6f, 0), "#86A8FF", 0.35f, 3.5f);
            var hearth = ChispinBuilder.AddLight("Hearth", Light2D.LightType.Point, new Vector3(0.2f, -0.3f, 0), "#FF6A2A", 0.4f, 3f);
            hearth.gameObject.AddComponent<FlickerLight2D>().amount = 0.1f;

            var lab = new GameObject("Chispín Lab").AddComponent<CreatureDemo>();
            lab.rig = chispin.GetComponent<CreatureRig>();
            lab.alleles = ChispinData.Alleles.Select(a => new CreatureDemo.Allele
            { name = a.name, baseC = PaletteMath.Hex(a.bas), accent = PaletteMath.Hex(a.accent), eye = PaletteMath.Hex(a.eye), glow = PaletteMath.Hex(a.glow) }).ToArray();
            // Brasa = the painting itself: keep the painted colours for the default allele.
            var mat = AssetDatabase.LoadAssetAtPath<Material>("Assets/TamTam/Materials/CreatureLitPainted.mat");
            lab.alleles[0].baseC = mat.GetColor("_RefBase"); lab.alleles[0].accent = mat.GetColor("_RefAccent"); lab.alleles[0].glow = mat.GetColor("_RefGlow");

            EditorSceneManager.SaveScene(scene, ScenePath);
            var list = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).ToList();
            list.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = list.ToArray();
        }

        // ── Preview sheet with real SpriteSkin deformation (batch mode has no player loop) ──
        public static void RenderPreview()
        {
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            var cam = Camera.main;
            var rig = UnityEngine.Object.FindFirstObjectByType<CreatureRig>();
            var dmType = Type.GetType("UnityEngine.U2D.Animation.DeformationManager, Unity.2D.Animation.Runtime");
            var dm = dmType?.GetProperty("instance", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)?.GetValue(null);
            var dmUpdate = dmType?.GetMethod("Update", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            const int W = 640, H = 360, COLS = 4;
            var lab = UnityEngine.Object.FindFirstObjectByType<CreatureDemo>();
            var frames = ChispinData.ClipOrder.Select(id => (id, allele: 0)).Concat(new[] { ("idle", 4), ("celebrate", 2) }).ToArray();
            int rows = Mathf.CeilToInt(frames.Length / (float)COLS);
            var sheet = new Texture2D(W * COLS, H * rows, TextureFormat.RGBA32, false);
            var rt = new RenderTexture(W, H, 24, RenderTextureFormat.ARGB32);
            cam.targetTexture = rt;
            var read = new Texture2D(W, H, TextureFormat.RGBA32, false);
            var poseTime = new Dictionary<string, float> { { "eat", 0.3f }, { "celebrate", 0.45f }, { "train", 0.75f }, { "attack", 0.35f }, { "hit", 0.08f }, { "bathe", 0.85f }, { "walk", 0.15f }, { "run", 0.1f }, { "pet", 0.4f } };
            cam.Render();
            for (int i = 0; i < frames.Length; i++)
            {
                var (id, al) = frames[i];
                var a = lab.alleles[al];
                rig.SetPalette(a.baseC, a.accent, a.eye, a.glow);
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>($"{AnimDir}/{id}.anim");
                clip.SampleAnimation(rig.gameObject, poseTime.TryGetValue(id, out var t) ? t : clip.length * 0.4f);
                if (dm != null && dmUpdate != null) dmUpdate.Invoke(dm, null);
                foreach (var gs in UnityEngine.Object.FindObjectsByType<GroundShadow>(FindObjectsSortMode.None)) gs.Refresh();
                cam.Render();
                RenderTexture.active = rt; read.ReadPixels(new Rect(0, 0, W, H), 0, 0); read.Apply();
                sheet.SetPixels((i % COLS) * W, (rows - 1 - i / COLS) * H, W, H, read.GetPixels());
            }
            sheet.Apply(); RenderTexture.active = null; cam.targetTexture = null;
            string outDir = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/media/unity"));
            Directory.CreateDirectory(outDir);
            File.WriteAllBytes(Path.Combine(outDir, "chispin-painted-clips.png"), sheet.EncodeToPNG());
            Debug.Log($"TamTam: painted preview → {outDir} (deformation {(dm != null && dmUpdate != null ? "forced" : "unavailable")})");
        }

        public static void BuildBatch()
        {
            try { Build(); RenderPreview(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
