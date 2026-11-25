using UnityEngine;

namespace TamTam.Evolution
{
    /// UX: frames the Tamtam by stage (style guide §4) — a baby fills the screen as much as an adult does. The feet stay
    /// at the same fraction of the screen (18% from the bottom); the camera eases between sizes.
    [RequireComponent(typeof(Camera))]
    [DefaultExecutionOrder(-50)] // before HabitatBackdrop fits the backdrop to the camera
    public class StageFraming : MonoBehaviour
    {
        public TamtamPresenter presenter;
        [Range(0.05f, 0.4f)] public float feetFromBottom = 0.18f;
        public float baby = 1.95f, child = 2.15f, juvenile = 2.4f, adult = 2.7f;
        public float ease = 4f;
        Camera cam;

        void Awake() => cam = GetComponent<Camera>();

        float Target() => presenter == null ? adult : presenter.CurrentStage switch
        {
            "child" => child, "juvenile" => juvenile, "adult" => adult, _ => baby,
        };

        void LateUpdate()
        {
            if (!presenter) return;
            float size = Application.isPlaying ? Mathf.Lerp(cam.orthographicSize, Target(), 1 - Mathf.Exp(-ease * Time.deltaTime)) : Target();
            cam.orthographicSize = size;
            float feet = presenter.transform.position.y;
            var p = transform.position;
            transform.position = new Vector3(p.x, feet + size - feetFromBottom * 2 * size, p.z);
        }
    }
}
