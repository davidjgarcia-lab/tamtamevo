using UnityEngine;

namespace TamTam.Vfx
{
    /// Tiny camera shake (heavy steps, hits, flashes). Attach to the main camera; anyone can call CameraShake.Add.
    public class CameraShake : MonoBehaviour
    {
        static float trauma;
        Vector3 rest; bool hasRest;
        public static void Add(float amount) => trauma = Mathf.Min(0.25f, trauma + amount);

        void LateUpdate()
        {
            if (!hasRest) { rest = transform.localPosition; hasRest = true; }
            trauma = Mathf.Max(0, trauma - Time.deltaTime * 0.6f);
            float t = Time.time * 40f, s = trauma * trauma;
            transform.localPosition = rest + new Vector3(Mathf.PerlinNoise(t, 0) - 0.5f, Mathf.PerlinNoise(0, t) - 0.5f, 0) * s * 2f;
        }
    }
}
