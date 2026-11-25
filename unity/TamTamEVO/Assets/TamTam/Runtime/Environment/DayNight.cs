using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace TamTam.World
{
    /// Nest-house day/night (docs/STYLE_GUIDE_UNITY.md §6): swaps the painted room, blends the scene grading volumes and
    /// switches from window light (day) to lamp, lantern and glowing-mushroom lights (night).
    public class DayNight : MonoBehaviour
    {
        public SpriteRenderer dayBackdrop, nightBackdrop;
        public Volume dayVolume, nightVolume;
        public Light2D globalLight;
        public Light2D[] dayLights, nightLights;
        public bool night;
        [Range(0.2f, 3f)] public float fadeSeconds = 1.2f;
        float k; // 0 = day, 1 = night

        void Start() { k = night ? 1 : 0; Apply(); }

        public void SetNight(bool value) => night = value;

        void Update()
        {
            float target = night ? 1 : 0;
            if (Mathf.Approximately(k, target)) return;
            k = Mathf.MoveTowards(k, target, Time.deltaTime / fadeSeconds);
            Apply();
        }

        public void Apply()
        {
            if (dayBackdrop) dayBackdrop.gameObject.SetActive(k < 0.5f);
            if (nightBackdrop) nightBackdrop.gameObject.SetActive(k >= 0.5f);
            if (dayVolume) dayVolume.weight = 1 - k;
            if (nightVolume) nightVolume.weight = k;
            if (globalLight) { globalLight.intensity = Mathf.Lerp(0.9f, 0.45f, k); globalLight.color = Color.Lerp(new Color(1f, 0.97f, 0.92f), new Color(0.62f, 0.66f, 1f), k); }
            foreach (var l in dayLights) if (l) l.intensity = (1 - k) * 0.85f;
            foreach (var l in nightLights)
            {
                if (!l) continue;
                var f = l.GetComponent<FlickerLight2D>();
                if (f) f.baseIntensity = k * 1.1f;   // flicker modulates around the day/night level
                l.intensity = k * 1.1f;
            }
        }

        void OnGUI()
        {
            float s = Mathf.Max(1, Screen.height / 720f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1));
            if (GUI.Button(new Rect(12, 12, 150, 30), night ? "☀ Día" : "☾ Noche")) night = !night;
        }
    }
}
