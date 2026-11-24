using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Shows the player's Tamtam: the painted Chispín as a baby, then the evolved form of its genome
    /// (same designs as the web/app prototype), recoloured with the genome's palette and scaled by stage.
    public class TamtamPresenter : MonoBehaviour
    {
        public EvolutionCatalog catalog;
        [Tooltip("Where the creature is placed (defaults to this transform).")]
        public Transform anchor;
        public float emission = 1;

        public GameObject Current { get; private set; }
        public string CurrentName { get; private set; } = "Chispín";
        public bool CurrentIsExact { get; private set; } = true;

        // Same as STAGE_SCALE in apps/mobile/src/creature/useCreature.ts.
        public static float StageScale(string stage) => stage switch { "child" => 1.1f, "juvenile" => 1.22f, "adult" => 1.34f, _ => 1f };

        public void Show(Genome genome, string stage = "baby")
        {
            if (Current) Destroy(Current);
            var parent = anchor ? anchor : transform;
            GameObject prefab;
            if (genome == null || stage == "baby") { prefab = catalog.babyPrefab; CurrentName = "Chispín"; CurrentIsExact = true; }
            else
            {
                var e = catalog.Find(genome, out bool exact);
                prefab = e?.prefab ? e.prefab : catalog.babyPrefab;
                CurrentName = Genetics.FormName(genome, 1);
                CurrentIsExact = exact;
                if (!exact) Debug.LogWarning($"TamTam: form {GenomeKeys.ShapeKey(genome)} is not built yet; showing the closest ({e?.shapeKey}). Build it with TamTam ▸ Evoluciones ▸ Construir forma desde genoma.");
            }
            if (!prefab) { Debug.LogError("TamTam: EvolutionCatalog has no prefabs. Run TamTam ▸ Evoluciones ▸ Construir formas."); return; }
            Current = Instantiate(prefab, parent);
            Current.transform.localPosition = Vector3.zero;
            Current.transform.localScale = Vector3.one * StageScale(stage);
            var rig = Current.GetComponentInChildren<CreatureRig>();
            if (rig && genome != null && stage != "baby")
            {
                var p = GenomePalette.Of(genome);
                rig.SetPalette(p.baseC, p.accent, p.eye, p.glow, emission);
            }
        }

        public void Play(string clip) { var rig = Current ? Current.GetComponentInChildren<CreatureRig>() : null; if (rig) rig.Play(clip); }
    }
}
