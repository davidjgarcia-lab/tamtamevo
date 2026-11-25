using System.Collections.Generic;
using UnityEngine;
using UnityEngine.U2D;
using UnityEngine.U2D.Animation;

namespace TamTam.Evolution
{
    /// Builds the bone transforms of an auto-rigged painted sprite (Editor/Animation/PuppetRigBuilder) at runtime and
    /// binds a SpriteSkin, so the single-piece painting deforms with the bones (2D Animation).
    public static class PuppetSkin
    {
        public static Dictionary<string, Transform> Bind(SpriteRenderer sr)
        {
            var result = new Dictionary<string, Transform>();
            if (!sr || !sr.sprite) return result;
            var bones = sr.sprite.GetBones();
            if (bones == null || bones.Length == 0) return result;
            var t = new Transform[bones.Length];
            for (int i = 0; i < bones.Length; i++)
            {
                var b = bones[i];
                var go = new GameObject(b.name).transform;
                go.SetParent(b.parentId < 0 ? sr.transform : t[b.parentId], false);
                go.localPosition = b.position; go.localRotation = b.rotation;
                t[i] = go; result[b.name] = go;
            }
            var skin = sr.GetComponent<SpriteSkin>();
            if (!skin) skin = sr.gameObject.AddComponent<SpriteSkin>();
            skin.SetRootBone(t[0]);
            skin.SetBoneTransforms(t);
            skin.alwaysUpdate = true;
            return result;
        }
    }
}
