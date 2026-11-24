using System.IO;
using System.Linq;
using NUnit.Framework;
using TamTam.Evolution;
using UnityEngine;

namespace TamTam.Tests
{
    /// The exported data (tools/export-unity.ts) must be complete, and Unity must assemble any genome
    /// exactly like the web prototype does (same parts, same ids, same floating body).
    public class EvolutionDataTests
    {
        const string Dir = "Assets/TamTam/Data/Evolution";

        [Test]
        public void CatalogHasAllFamiliesSlotsAndStyles()
        {
            var cat = JsonUtility.FromJson<CatalogJson>(File.ReadAllText($"{Dir}/catalog.json"));
            Assert.AreEqual(10, cat.families.Length);
            foreach (var slot in new[] { "body", "head", "legs", "tail", "back" })
                Assert.AreEqual(20, cat.library.Count(e => e.slot == slot), slot);
            Assert.AreEqual(cat.eyeStyles.Length, cat.library.Count(e => e.slot == "eyes"));
            Assert.AreEqual(cat.patterns.Length, cat.library.Count(e => e.slot == "pattern"));
            Assert.Greater(cat.combinations, 500);
        }

        [Test]
        public void AssemblyMatchesWebForEveryExportedForm()
        {
            var cat = JsonUtility.FromJson<CatalogJson>(File.ReadAllText($"{Dir}/catalog.json"));
            var index = JsonUtility.FromJson<FormsIndexJson>(File.ReadAllText($"{Dir}/forms_index.json"));
            Assert.Greater(index.forms.Length, 20);
            foreach (var item in index.forms)
            {
                var form = JsonUtility.FromJson<FormJson>(File.ReadAllText($"{Dir}/Forms/{item.file}"));
                var rig = GenomeKeys.Assemble(cat, form.genome.ToGenome());
                // Part ids come from a counter in the web build; compare the drawing itself (bone, path, order, paint).
                CollectionAssert.AreEqual(form.rig.parts.Select(p => p.bone + "|" + p.d + "|" + p.z + "|" + JsonUtility.ToJson(p.fill)).ToArray(), rig.parts.Select(p => p.bone + "|" + p.d + "|" + p.z + "|" + JsonUtility.ToJson(p.fill)).ToArray(), item.key);
                Assert.AreEqual(rig.parts.Length, rig.parts.Select(p => p.id).Distinct().Count(), "unique ids");
                CollectionAssert.AreEqual(form.rig.bones.Select(b => b.y).ToArray(), rig.bones.Select(b => b.y).ToArray(), item.key);
                Assert.AreEqual(item.key, GenomeKeys.Key(form.genome.ToGenome()));
            }
        }
    }
}
