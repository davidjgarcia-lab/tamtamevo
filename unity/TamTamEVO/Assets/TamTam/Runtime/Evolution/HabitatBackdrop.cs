using System;
using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Paints the habitat behind the Tamtam: the fire den for the baby, then the painted biome of the dominant
    /// family of the evolved form, scaled to cover the camera with the creature's feet on the biome's floor.
    public class HabitatBackdrop : MonoBehaviour
    {
        [Serializable] public class Entry { public Family family; public Sprite sprite; }
        public TamtamPresenter presenter;
        public SpriteRenderer backdrop;
        public Camera cam;
        public Sprite babyHabitat;
        public Entry[] byFamily;

        void OnEnable() { if (presenter) presenter.Shown += Refresh; Refresh(); }
        void OnDisable() { if (presenter) presenter.Shown -= Refresh; }

        public Sprite SpriteFor(Genome g)
        {
            if (g == null) return babyHabitat;
            var f = FamilyArt.Dominant(g);
            foreach (var e in byFamily) if (e.family == f && e.sprite) return e.sprite;
            return babyHabitat;
        }

        public void Refresh()
        {
            if (!backdrop || !cam) return;
            backdrop.sprite = SpriteFor(presenter ? presenter.CurrentGenome : null);
            Fit(backdrop, cam);
        }

        public static void Fit(SpriteRenderer sr, Camera cam)
        {
            if (!sr.sprite) return;
            float h = cam.orthographicSize * 2, w = h * cam.aspect;
            var size = sr.sprite.bounds.size;
            float s = Mathf.Max(w / size.x, h / size.y) * 1.02f;
            sr.transform.localScale = new Vector3(s, s, 1);
            var c = cam.transform.position;
            sr.transform.position = new Vector3(c.x, c.y, sr.transform.position.z);
        }

        void LateUpdate() { if (backdrop && cam) Fit(backdrop, cam); } // keeps covering when the window aspect changes
    }
}
