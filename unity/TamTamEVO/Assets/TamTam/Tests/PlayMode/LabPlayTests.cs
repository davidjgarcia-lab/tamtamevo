using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using NUnit.Framework;
using TamTam.Core;
using TamTam.Evolution;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace TamTam.Tests
{
    /// Plays EvolutionLab and NestHouse like a person would: presses the care-style buttons (same code path as the
    /// OnGUI buttons) up to Adult and saves screenshots to docs/media/unity/ for review.
    public class LabPlayTests
    {
        static string OutDir => Path.GetFullPath(Path.Combine(Application.dataPath, "../../../docs/media/unity"));

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
            var rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
            var old = cam.targetTexture; cam.targetTexture = rt; cam.Render(); cam.targetTexture = old;
            RenderTexture.active = rt;
            var t = new Texture2D(w, h, TextureFormat.RGBA32, false); t.ReadPixels(new Rect(0, 0, w, h), 0, 0); t.Apply();
            RenderTexture.active = null; rt.Release();
            return t;
        }

        /// Distance between the feet and the floor with the body in its neutral pose (idle hops are intended).
        static float RestFeetGap(PaintedCreature pc)
        {
            var t = pc.body.transform; var (p, r, s) = (t.localPosition, t.localRotation, t.localScale);
            t.localPosition = Vector3.zero; t.localRotation = Quaternion.identity; t.localScale = Vector3.one;
            // The sprite pivot is the lowest opaque row (EditMode QaTests.Art_FeetSitOnThePivot); here we check that the
            // pivot and the contact shadow land on the floor (bounds.min would include faint painted haze under the feet).
            var gs = pc.GetComponent<GroundShadow>(); gs.Refresh();
            var contact = pc.transform.Find("ContactShadow");
            float gap = Mathf.Max(Mathf.Abs(t.position.y - pc.transform.position.y), Mathf.Abs(contact.position.y - pc.transform.position.y));
            t.localPosition = p; t.localRotation = r; t.localScale = s;
            return gap;
        }

        [UnityTest]
        public IEnumerator EvolutionLab_EvolvesToAdultWithEveryCareStyle()
        {
            yield return Load("Assets/TamTam/Scenes/EvolutionLab.unity");
            var demo = Object.FindFirstObjectByType<EvolutionLabDemo>();
            Assert.NotNull(demo, "EvolutionLabDemo");
            var presenter = demo.presenter;
            Assert.NotNull(presenter.catalog, "Tamtam has no Catalog assigned");
            Assert.NotNull(presenter.familyArt, "Tamtam has no Family Art assigned");
            Assert.AreEqual(41, presenter.familyArt.entries.FindAll(e => e.sprite).Count, "FamilyArt sprites (11 starters + 30 stages)");
            Assert.NotNull(presenter.catalogJson, "Tamtam has no catalog.json assigned");

            var t = typeof(EvolutionLabDemo);
            var styles = (System.Array)t.GetField("Styles", BindingFlags.NonPublic | BindingFlags.Static).GetValue(null);
            var evolve = t.GetMethod("Evolve", BindingFlags.NonPublic | BindingFlags.Instance);
            var fGenome = t.GetField("genome", BindingFlags.NonPublic | BindingFlags.Instance);
            var fStage = t.GetField("stage", BindingFlags.NonPublic | BindingFlags.Instance);
            var fInfo = t.GetField("info", BindingFlags.NonPublic | BindingFlags.Instance);

            const int W = 480, H = 270, COLS = 4;
            int rows = styles.Length;
            var sheet = new Texture2D(W * COLS, H * rows, TextureFormat.RGBA32, false);
            var log = new StringBuilder();
            var cam = Camera.main;
            for (int r = 0; r < rows; r++)
            {
                var style = styles.GetValue(r);
                string name = (string)style.GetType().GetField("Item1").GetValue(style);
                var profile = style.GetType().GetField("Item2").GetValue(style);
                fGenome.SetValue(demo, null); fStage.SetValue(demo, 0); presenter.Show(null);
                var cells = new List<string>();
                for (int c = 0; c < COLS; c++)
                {
                    if (c > 0) evolve.Invoke(demo, new[] { profile });
                    for (int f = 0; f < 20; f++) yield return null;
                    Assert.NotNull(presenter.Current, $"{name}: nothing shown at step {c}");
                    Assert.NotNull(presenter.Current.GetComponent<GroundShadow>(), $"{name} step {c}: no contact shadow");
                    var pc = presenter.Current.GetComponent<PaintedCreature>();
                    if (pc && !pc.floating)
                        Assert.That(RestFeetGap(pc), Is.LessThan(0.05f), $"{name} step {c}: feet not on the floor");
                    var shot = Grab(cam, W, H);
                    sheet.SetPixels(c * W, (rows - 1 - r) * H, W, H, shot.GetPixels());
                    Object.Destroy(shot);
                    cells.Add(c == 0 ? "Chispín · baby" : (string)fInfo.GetValue(demo));
                }
                Assert.AreEqual(3, (int)fStage.GetValue(demo), $"{name} reached Adult");
                log.AppendLine($"{name}: {string.Join("  →  ", cells)}");
            }
            sheet.Apply();
            Directory.CreateDirectory(OutDir);
            File.WriteAllBytes(Path.Combine(OutDir, "evolution-lab.png"), sheet.EncodeToPNG());
            File.WriteAllText(Path.Combine(OutDir, "evolution-lab.txt"), log.ToString());
            Debug.Log("TamTam: EvolutionLab played\n" + log);
        }

        [UnityTest]
        public IEnumerator Arena_FightersStandOnTheFloorInEveryBiome()
        {
            yield return Load("Assets/TamTam/Scenes/Arena.unity");
            var demo = Object.FindFirstObjectByType<ArenaDemo>();
            Assert.NotNull(demo);
            for (int i = 0; i < demo.biomes.Length; i++)
            {
                demo.SetBiome(i);
                for (int f = 0; f < 3; f++) yield return null;
                foreach (var sr in new[] { demo.left, demo.right })
                {
                    var pc = sr.GetComponentInParent<PaintedCreature>();
                    Assert.NotNull(pc.GetComponent<GroundShadow>(), "contact shadow");
                    if (!pc.floating) Assert.That(RestFeetGap(pc), Is.LessThan(0.05f), $"{demo.biomes[i].name}: {sr.sprite.name} floats");
                }
                var cam = demo.cam; var b = demo.backdrop.bounds;
                float h = cam.orthographicSize * 2, w = h * cam.aspect;
                Assert.That(b.size.x >= w - 0.01f && b.size.y >= h - 0.01f, $"{demo.biomes[i].name} does not cover the screen");
            }
        }

        [UnityTest]
        public IEnumerator NestHouse_PlaysAndRenders()
        {
            yield return Load("Assets/TamTam/Scenes/NestHouse.unity");
            for (int f = 0; f < 20; f++) yield return null;
            var cam = Camera.main;
            Assert.NotNull(cam);
            var room = GameObject.Find("NestRoom");
            Assert.NotNull(room, "NestRoom");
            int placed = room.GetComponentsInChildren<SpriteRenderer>(true).Length;
            Assert.Greater(placed, 2, "backdrop + furniture");
            var shot = Grab(cam, 1600, 900);
            Directory.CreateDirectory(OutDir);
            File.WriteAllBytes(Path.Combine(OutDir, "nest-house.png"), shot.EncodeToPNG());
            Debug.Log($"TamTam: NestHouse played, {placed} sprites");
        }
    }
}
