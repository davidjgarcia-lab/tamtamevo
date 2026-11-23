using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace TamTam
{
    /// Fire-like intensity flicker for a 2D light (crest glow, hearth).
    [RequireComponent(typeof(Light2D))]
    public class FlickerLight2D : MonoBehaviour
    {
        public float amount = 0.18f, speed = 2.6f;
        Light2D light2D; float baseIntensity;

        void Awake() { light2D = GetComponent<Light2D>(); baseIntensity = light2D.intensity; }

        void Update()
        {
            float f = Time.time * Mathf.PI * 2 * speed;
            float n = Mathf.Sin(f) * 0.6f + Mathf.Sin(f * 2.37f + 1.3f) * 0.3f + Mathf.Sin(f * 5.1f + 0.7f) * 0.1f;
            light2D.intensity = baseIntensity * (1 + amount * n);
        }
    }
}
