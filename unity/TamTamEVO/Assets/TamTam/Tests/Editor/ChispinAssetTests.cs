using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
using UnityEngine.U2D;
using UnityEngine.U2D.Animation;

namespace TamTam.Tests
{
    /// Checks the Chispín built by TamTam ▸ Build Chispín: 14 clips wired, skinned tail, tinted layers.
    public class ChispinAssetTests
    {
        static readonly string[] Clips = { "idle", "walk", "run", "eat", "pet", "sleep", "celebrate", "train", "bathe", "sad", "hungry", "angry", "attack", "hit" };
        const string Prefab = "Assets/TamTam/Prefabs/Chispin.prefab";

        [Test]
        public void ControllerHasAllFourteenClips()
        {
            var ctrl = AssetDatabase.LoadAssetAtPath<AnimatorController>("Assets/TamTam/Animation/Chispin/Chispin.controller");
            Assert.NotNull(ctrl, "Run TamTam ▸ Build Chispín first");
            var states = ctrl.layers[0].stateMachine.states.Select(s => s.state).ToArray();
            CollectionAssert.AreEquivalent(Clips, states.Select(s => s.name));
            Assert.AreEqual("idle", ctrl.layers[0].stateMachine.defaultState.name);
            foreach (var s in states) Assert.NotNull(s.motion, s.name);
            foreach (var id in new[] { "attack", "hit" })
                Assert.IsTrue(states.First(s => s.name == id).transitions.Any(t => t.destinationState.name == "idle"), $"{id} returns to idle");
        }

        [Test]
        public void PrefabIsRiggedSkinnedAndTinted()
        {
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(Prefab);
            Assert.NotNull(go, "Run TamTam ▸ Build Chispín first");
            var rig = go.GetComponent<CreatureRig>();
            CollectionAssert.AreEqual(Clips, rig.clips.Select(c => c.id));
            Assert.AreEqual(7, rig.secondary.Length);
            Assert.IsTrue(rig.secondary.All(s => s.bone && s.driver));

            var skin = go.GetComponentInChildren<SpriteSkin>(true);
            Assert.NotNull(skin, "tail SpriteSkin");
            Assert.AreEqual(4, skin.boneTransforms.Length);
            Assert.AreEqual(4, skin.GetComponent<SpriteRenderer>().sprite.GetBones().Length);

            var renderers = go.GetComponentsInChildren<SpriteRenderer>(true);
            Assert.IsTrue(renderers.All(r => r.sharedMaterial && r.sharedMaterial.shader.name == "TamTam/CreatureLit"));
            Assert.IsTrue(renderers.All(r => r.sprite != null));
        }

        [Test]
        public void BlinkIsBriefAndDeterministic()
        {
            int closed = 0;
            for (int i = 0; i < 4000; i++) if (CreatureRig.BlinkOpenness(i / 100f, 1) < 0.5f) closed++;
            float frac = closed / 4000f;
            Assert.That(frac, Is.InRange(0.005f, 0.1f));
            Assert.AreEqual(CreatureRig.BlinkOpenness(12.34f, 7), CreatureRig.BlinkOpenness(12.34f, 7));
        }
    }
}
