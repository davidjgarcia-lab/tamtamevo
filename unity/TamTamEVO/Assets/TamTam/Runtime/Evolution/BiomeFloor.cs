using System.Collections.Generic;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Where the walkable floor is in each painted backdrop (fraction of the image height from the bottom) and how to
    /// fit a backdrop so that floor lands under the creatures' feet while still covering the whole screen.
    /// Values measured by eye on the user's art (QA pass 2026-11-25); adjust here if a backdrop changes.
    public static class BiomeFloor
    {
        static readonly Dictionary<string, float> Floor = new Dictionary<string, float>
        {
            { "colosseum", 0.10f }, { "crystal_cave", 0.16f }, { "forest", 0.12f }, { "lava", 0.14f },
            { "mushroom_shadow", 0.10f }, { "ruins_sunset", 0.12f }, { "sky_islands", 0.16f }, { "waterfall", 0.13f },
            { "fire_den_bg", 0.17f },
        };

        public static float Of(Sprite s) => s && Floor.TryGetValue(s.name, out var f) ? f : 0.15f;

        /// Scales/moves the backdrop so its floor line sits at world y = feetY and it still covers the camera.
        public static void Fit(SpriteRenderer sr, Camera cam, float feetY)
        {
            if (!sr || !sr.sprite || !cam) return;
            float f = Of(sr.sprite);
            float camH = cam.orthographicSize * 2, camW = camH * cam.aspect;
            float camBottom = cam.transform.position.y - cam.orthographicSize, camTop = camBottom + camH;
            var size = sr.sprite.bounds.size;
            float H = Mathf.Max(size.y * (camW / size.x), camH);                 // cover
            H = Mathf.Max(H, (feetY - camBottom) / Mathf.Max(0.02f, f));            // floor reaches the feet from below
            H = Mathf.Max(H, (camTop - feetY) / Mathf.Max(0.02f, 1 - f));           // and the top still covers
            H *= 1.01f;
            float s = H / size.y;
            sr.transform.localScale = new Vector3(s, s, 1);
            // Sprite pivot is the centre: centre = floor + (0.5 - f) * H.
            var p = sr.transform.position;
            sr.transform.position = new Vector3(cam.transform.position.x, feetY + (0.5f - f) * H, p.z);
        }
    }
}
