using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using NUnit.Framework;
using TamTam.Core;
using TamTam.Evolution;
using TamTam.World;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.U2D.Animation;

namespace TamTam.Tests
{
    /// Studio QA in Play mode: every starter is rigged and plays its clips, evolution lines and hybrids, room day/night,
    /// Arena biomes — and the screenshot sheets, GIF frames and performance numbers for docs/media/unity/.
    public class StudioPlayTests
    {
        static string Media => Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/media/unity"));
        static string Frames => Path.GetFullPath(Path.Combine(Application.dataPath, "../Recordings"));

        static IEnumerator Load(string path)
        {
#if UNITY_EDITOR
            yield return UnityEditor.SceneManagement.EditorSceneManager.LoadSceneAsyncInPlayMode(path, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync(Path.GetFileNameWithoutExtension(path));
#endif
            for (int i = 0; i < 5; i++) yield return null;
        }

        static Texture2D Grab(Camera cam, int w, int h)
        {
            var rt = RenderTexture.GetTemporary(w, h, 24, RenderTextureFormat.ARGB32);
            var old = cam.targetTexture; cam.targetTexture = rt; cam.Render(); cam.targetTexture = old;
            RenderTexture.active = rt;
            var t = new Texture2D(w, h, TextureFormat.RGBA32, false); t.ReadPixels(new Rect(0, 0, w, h), 0, 0); t.Apply();
            RenderTexture.active = null; RenderTexture.ReleaseTemporary(rt);
            return t;
        }

        class Sheet
        {
            readonly Texture2D tex; readonly int w, h, cols, rows;
            public Sheet(int cols, int rows, int w, int h) { this.cols = cols; this.rows = rows; this.w = w; this.h = h; tex = new Texture2D(cols * w, rows * h, TextureFormat.RGBA32, false); }
            public void Put(int c, int r, Texture2D t) { tex.SetPixels(c * w, (rows - 1 - r) * h, w, h, t.GetPixels()); Object.Destroy(t); }
            public void Save(string name) { tex.Apply(); Directory.CreateDirectory(Media); File.WriteAllBytes(Path.Combine(Media, name), tex.EncodeToPNG()); }
        }

        static CatalogJson Catalog(TamtamPresenter p) => JsonUtility.FromJson<CatalogJson>(p.catalogJson.text);

        static IEnumerator Wait(float s) { float end = Time.realtimeSinceStartup + s; while (Time.realtimeSinceStartup < end) yield return null; }

        [UnityTest]
        public IEnumerator Starters_AreRiggedAndPlayTheirClips()
        {
            yield return Load("Assets/TamTam/Scenes/EvolutionLab.unity");
            var presenter = Object.FindFirstObjectByType<TamtamPresenter>();
            var cam = Camera.main; var cat = Catalog(presenter);
            string[] shots = { "idle", "eat", "celebrate", "sleep" };
            string[] all = { "idle", "walk", "eat", "sleep", "celebrate", "sad", "angry", "hit", "attack", "pet" };
            var sheet = new Sheet(shots.Length, cat.starters.Length, 400, 225);
            var log = new StringBuilder();
            for (int r = 0; r < cat.starters.Length; r++)
            {
                var st = cat.starters[r];
                presenter.Show(st.genome.ToGenome(), "baby");
                yield return null;
                var pc = presenter.Current.GetComponent<PaintedCreature>();
                Assert.NotNull(pc, $"{st.id}: painted creature");
                Assert.IsTrue(pc.HasRig, $"{st.id}: 2D Animation rig");
                Assert.IsTrue(pc.Bones.ContainsKey("body") && pc.Bones.ContainsKey("head"), $"{st.id}: body + head bones");
                Assert.NotNull(pc.body.GetComponent<SpriteSkin>(), $"{st.id}: SpriteSkin");
                Assert.NotNull(presenter.Current.GetComponent<GroundShadow>(), $"{st.id}: contact shadow");
                Assert.NotNull(presenter.Current.transform.Find($"VFX_{st.family}"), $"{st.id}: family VFX");
                foreach (var clip in all) { presenter.Play(clip); for (int f = 0; f < 6; f++) yield return null; }
                for (int c = 0; c < shots.Length; c++)
                {
                    presenter.Play(shots[c]);
                    yield return Wait(shots[c] == "celebrate" ? 0.32f : 0.45f);
                    sheet.Put(c, r, Grab(cam, 400, 225));
                }
                log.AppendLine($"{st.species} ({st.id}): gait {st.motion.gait}, bones {string.Join(",", pc.Bones.Keys)}");
            }
            sheet.Save("starters-clips.png");
            File.WriteAllText(Path.Combine(Media, "starters-clips.txt"), "Rows: starters; columns: idle, eat, celebrate, sleep\n" + log);
        }

        static readonly (string name, CareProfile p)[] Styles =
        {
            ("Guerrero", new CareProfile { care = .7, affection = .4, hygiene = .5, training = .9, fighting = .9, study = .1, play = .2, neglect = .3 }),
            ("Mimado", new CareProfile { care = .9, affection = .95, hygiene = .7, training = .1, fighting = .1, study = .2, play = .4, neglect = .1 }),
            ("Descuidado", new CareProfile { care = .3, affection = .2, hygiene = .25, training = 0, fighting = 0, study = 0, play = 0, neglect = .7 }),
        };

        [UnityTest]
        public IEnumerator EvolutionLines_AndHybridAura()
        {
            yield return Load("Assets/TamTam/Scenes/EvolutionLab.unity");
            var presenter = Object.FindFirstObjectByType<TamtamPresenter>();
            var cam = Camera.main; var cat = Catalog(presenter);
            string[] stages = { "baby", "child", "juvenile", "adult" };
            string[] starters = { "brasildo", "aqualin", "umbrin" };
            var sheet = new Sheet(4, 3, 400, 225); var log = new StringBuilder();
            for (int r = 0; r < 3; r++)
            {
                var st = cat.starters.First(s => s.id == starters[r]);
                var g = st.genome.ToGenome(); Family line = g[PartSlot.body]; uint seed = (uint)(11 + r);
                presenter.Show(g, "baby"); yield return Wait(0.3f); sheet.Put(0, r, Grab(cam, 400, 225));
                var names = new List<string> { st.species };
                for (int s = 1; s < 4; s++)
                {
                    var roll = Genetics.Roll(g, Styles[r].p, seed++ * 7919u);
                    var prev = line; g = roll.genome; line = FamilyArt.NextLine(prev, g);
                    presenter.Show(g, stages[s], line);
                    yield return Wait(0.35f);
                    sheet.Put(s, r, Grab(cam, 400, 225));
                    names.Add($"{presenter.CurrentName} [{line}]");
                }
                log.AppendLine($"{st.species} · {Styles[r].name}: {string.Join(" → ", names)}");
            }
            sheet.Save("evolution-lines.png");

            // Hybrid: search seeds until the dominant line has a second family with ≥ its share (aura appears).
            bool found = false;
            for (uint seed = 1; seed < 400 && !found; seed++)
            {
                var g = Genetics.Chispin; Family line = Family.fire;
                for (int s = 1; s < 4; s++) { var prev = line; g = Genetics.Roll(g, Styles[(int)(seed % 3)].p, seed * 31u + (uint)s).genome; line = FamilyArt.NextLine(prev, g); }
                if (FamilyArt.Secondary(g, line).HasValue)
                {
                    presenter.Show(g, "adult", line);
                    yield return Wait(0.8f);
                    Assert.NotNull(presenter.Current.transform.Find("HybridAura"), "hybrid aura VFX");
                    var shot = Grab(cam, 960, 540);
                    File.WriteAllBytes(Path.Combine(Media, "hybrid-aura.png"), shot.EncodeToPNG()); Object.Destroy(shot);
                    log.AppendLine($"Hybrid: {presenter.CurrentName} line {line} + aura {FamilyArt.Secondary(g, line)} (seed {seed})");
                    found = true;
                }
            }
            Assert.IsTrue(found, "a hybrid within 400 seeds");
            File.WriteAllText(Path.Combine(Media, "evolution-lines.txt"), log.ToString());
        }

        [UnityTest]
        public IEnumerator NestHouse_DayAndNight()
        {
            yield return Load("Assets/TamTam/Scenes/NestHouse.unity");
            var dn = Object.FindFirstObjectByType<DayNight>();
            Assert.NotNull(dn, "DayNight");
            var cam = Camera.main;
            foreach (var prop in new[] { "prop_mushroom_cyan", "prop_crystal_blue", "prop_rock_moss" })
                Assert.NotNull(GameObject.Find(prop), $"{prop} placed in the room");
            yield return Wait(1.0f);
            var day = Grab(cam, 1600, 900);
            dn.SetNight(true); yield return Wait(1.6f);
            var night = Grab(cam, 1600, 900);
            Assert.IsTrue(dn.nightLights.All(l => l.intensity > 0.5f), "night lights on");
            var s = new Sheet(2, 1, 1600, 900); s.Put(0, 0, day); s.Put(1, 0, night); s.Save("nest-house-day-night.png");
        }

        [UnityTest]
        public IEnumerator Arena_ThreeBiomesWithHits()
        {
            yield return Load("Assets/TamTam/Scenes/Arena.unity");
            var demo = Object.FindFirstObjectByType<ArenaDemo>();
            var cam = Camera.main;
            var names = new[] { "lava", "crystal_cave", "mushroom_shadow" };
            var sheet = new Sheet(3, 1, 800, 450);
            for (int i = 0; i < 3; i++)
            {
                demo.SetFamilies(i * 3, i * 3 + 5);
                demo.SetBiome(System.Array.FindIndex(demo.biomes, b => b.name == names[i]));
                yield return Wait(0.6f);
                Assert.IsTrue(demo.left.GetComponentInParent<PaintedCreature>().HasRig, "fighter rig");
                typeof(ArenaDemo).GetMethod("Turn", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).Invoke(demo, new object[] { demo.left, demo.right });
                yield return Wait(0.18f);
                sheet.Put(i, 0, Grab(cam, 800, 450));
            }
            sheet.Save("arena-3-biomes.png");
        }

        [UnityTest]
        public IEnumerator Performance_EvolutionLabAndArena()
        {
            var sb = new StringBuilder("Measured in the Unity 6.3 editor, batch mode, Windows desktop (NOT an Android device).\n");
            foreach (var scene in new[] { "EvolutionLab", "Arena" })
            {
                yield return Load($"Assets/TamTam/Scenes/{scene}.unity");
                var presenter = Object.FindFirstObjectByType<TamtamPresenter>();
                if (presenter) { var cat = Catalog(presenter); presenter.Show(cat.starters[0].genome.ToGenome(), "baby"); }
                yield return Wait(0.5f);
                var cam = Camera.main; var rt = RenderTexture.GetTemporary(1920, 1080, 24); cam.targetTexture = rt;
                int frames = 0; float t0 = Time.realtimeSinceStartup; int batches = 0, draws = 0, tris = 0;
                while (frames < 240)
                {
                    cam.Render(); frames++;
                    yield return null;
#if UNITY_EDITOR
                    batches = Mathf.Max(batches, UnityEditor.UnityStats.batches); draws = Mathf.Max(draws, UnityEditor.UnityStats.drawCalls); tris = Mathf.Max(tris, UnityEditor.UnityStats.triangles);
#endif
                }
                float ms = (Time.realtimeSinceStartup - t0) / frames * 1000f;
                cam.targetTexture = null; RenderTexture.ReleaseTemporary(rt);
                int particles = Object.FindObjectsByType<ParticleSystem>(FindObjectsSortMode.None).Sum(p => p.particleCount);
                sb.AppendLine($"{scene}: {ms:0.00} ms/frame ({1000f / ms:0} fps) at 1920x1080 · batches {batches} · draw calls {draws} · triangles {tris} · live particles {particles}");
                Assert.Less(ms, 33f, $"{scene} must stay well under 33 ms on desktop");
            }
            Directory.CreateDirectory(Media);
            File.WriteAllText(Path.Combine(Media, "perf.txt"), sb.ToString());
            Debug.Log(sb);
        }

        /// GIF frames (encoded outside Unity): 16 s of EvolutionLab (egg, evolutions, clips) and 16 s of the room.
        [UnityTest]
        public IEnumerator Record_GifFrames()
        {
            if (Directory.Exists(Frames)) Directory.Delete(Frames, true);
            yield return Load("Assets/TamTam/Scenes/EvolutionLab.unity");
            var demo = Object.FindFirstObjectByType<EvolutionLabDemo>(); var presenter = demo.presenter; var cam = Camera.main;
            var t = typeof(EvolutionLabDemo); var bf = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            var styles = (System.Array)t.GetField("Styles", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static).GetValue(null);
            var evolve = t.GetMethod("Evolve", bf); var newEgg = t.GetMethod("NewEgg", bf);
            object P(int i) { var st = styles.GetValue(i); return st.GetType().GetField("Item2").GetValue(st); }
            var script = new List<(float at, System.Action act)>
            {
                (0.0f, () => newEgg.Invoke(demo, null)), (2.0f, () => presenter.Play("eat")), (4.0f, () => evolve.Invoke(demo, new[] { P(0) })),
                (6.0f, () => presenter.Play("celebrate")), (8.0f, () => evolve.Invoke(demo, new[] { P(2) })),
                (10.5f, () => evolve.Invoke(demo, new[] { P(2) })),
                (12.5f, () => presenter.Play("attack")), (14.0f, () => presenter.Play("sleep")),
            };
            yield return Capture(cam, "lab", 16f, script);
            yield return Load("Assets/TamTam/Scenes/NestHouse.unity");
            var dn = Object.FindFirstObjectByType<DayNight>();
            yield return Capture(Camera.main, "room", 16f, new List<(float, System.Action)> { (7.5f, () => dn.SetNight(true)) });
        }

        static IEnumerator Capture(Camera cam, string name, float seconds, List<(float at, System.Action act)> script)
        {
            var dir = Path.Combine(Frames, name); Directory.CreateDirectory(dir);
            float start = Time.realtimeSinceStartup, next = 0; int i = 0, s = 0;
            while (Time.realtimeSinceStartup - start < seconds)
            {
                float el = Time.realtimeSinceStartup - start;
                while (s < script.Count && el >= script[s].at) script[s++].act();
                if (el >= next)
                {
                    var t = Grab(cam, 480, 270); File.WriteAllBytes(Path.Combine(dir, $"f{i++:000}.png"), t.EncodeToPNG()); Object.Destroy(t);
                    next += 1f / 10f;
                }
                yield return null;
            }
        }
    }
}
