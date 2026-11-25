using UnityEngine;

namespace TamTam
{
    /// Contact shadow + ambient occlusion on the ground under a creature (2D has no SSAO, so it is faked the way
    /// painted 2D games do it): a tight dark core where the feet touch and a wide soft occlusion pool. Both follow the
    /// creature horizontally, stay on the ground, and shrink/fade as the body leaves the floor (jumps, floating).
    [ExecuteAlways]
    [DefaultExecutionOrder(200)]
    public class GroundShadow : MonoBehaviour
    {
        [Tooltip("The renderer whose width and height drive the shadow (defaults to the first SpriteRenderer below).")]
        public Renderer target;
        [Tooltip("Transform that moves up when the creature jumps (its local y is the height above ground).")]
        public Transform lift;
        [Range(0, 1)] public float contactOpacity = 0.55f;
        [Range(0, 1)] public float ambientOpacity = 0.32f;
        [Tooltip("Width of the shadow relative to the creature's visible width.")]
        public float widthFactor = 0.62f;
        public int sortingOrder = -5;

        SpriteRenderer contact, ambient;
        static Sprite blob;

        public static Sprite Blob
        {
            get
            {
                if (blob) return blob;
                const int W = 128, H = 64;
                var t = new Texture2D(W, H, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "GroundShadowBlob" };
                var px = new Color32[W * H];
                for (int y = 0; y < H; y++)
                    for (int x = 0; x < W; x++)
                    {
                        float dx = (x + 0.5f) / W * 2 - 1, dy = (y + 0.5f) / H * 2 - 1;
                        float r = Mathf.Sqrt(dx * dx + dy * dy);
                        float a = Mathf.Clamp01(1 - r); a = a * a * (3 - 2 * a); // smooth falloff, no hard edge
                        px[y * W + x] = new Color32(10, 6, 14, (byte)(a * 255));
                    }
                t.SetPixels32(px); t.Apply(false, true);
                blob = Sprite.Create(t, new Rect(0, 0, W, H), new Vector2(0.5f, 0.5f), W);
                blob.name = "GroundShadowBlob";
                return blob;
            }
        }

        void OnEnable() => Ensure();

        void Ensure()
        {
            if (!target) target = GetComponentInChildren<SpriteRenderer>();
            contact = Child("ContactShadow", contact);
            ambient = Child("AmbientOcclusion", ambient);
        }

        SpriteRenderer Child(string name, SpriteRenderer sr)
        {
            if (sr) return sr;
            var t = transform.Find(name);
            if (!t) { t = new GameObject(name).transform; t.SetParent(transform, false); t.gameObject.hideFlags = HideFlags.DontSave; }
            sr = t.GetComponent<SpriteRenderer>();
            if (!sr) sr = t.gameObject.AddComponent<SpriteRenderer>(); // (Unity fake-null: never use ?? on components)
            sr.sprite = Blob;
            return sr;
        }

        void LateUpdate() => Refresh();

        /// Re-places both shadows (called every frame; call it yourself after posing in edit mode).
        public void Refresh()
        {
            Ensure();
            if (!target || !target.enabled || !target.gameObject.activeInHierarchy) { contact.enabled = ambient.enabled = false; return; }
            contact.enabled = ambient.enabled = true;
            var b = target.bounds;
            float width = Mathf.Max(0.2f, b.size.x * widthFactor);
            float height = lift ? Mathf.Max(0, lift.localPosition.y * lift.lossyScale.y) : 0;
            float k = Mathf.Clamp01(1 - height / 1.2f); // fades/shrinks as the body lifts off the floor
            var sortLayer = target.sortingLayerID;
            int order = target.sortingOrder + sortingOrder;
            Place(ambient, new Vector3(b.center.x, transform.position.y, 0), width * 1.35f * Mathf.Lerp(0.8f, 1, k), width * 0.22f, ambientOpacity * Mathf.Lerp(0.45f, 1, k), sortLayer, order - 1);
            Place(contact, new Vector3(b.center.x, transform.position.y, 0), width * 0.75f * Mathf.Lerp(0.55f, 1, k), width * 0.11f, contactOpacity * k * k, sortLayer, order);
        }

        static void Place(SpriteRenderer sr, Vector3 worldPos, float w, float h, float alpha, int layer, int order)
        {
            sr.transform.position = new Vector3(worldPos.x, worldPos.y, sr.transform.position.z);
            var parentScale = sr.transform.parent ? sr.transform.parent.lossyScale : Vector3.one;
            sr.transform.localScale = new Vector3(w / Mathf.Max(0.001f, parentScale.x), h * 2 / Mathf.Max(0.001f, parentScale.y), 1);
            sr.transform.rotation = Quaternion.identity;
            sr.color = new Color(1, 1, 1, alpha);
            sr.sortingLayerID = layer; sr.sortingOrder = order;
        }
    }
}
