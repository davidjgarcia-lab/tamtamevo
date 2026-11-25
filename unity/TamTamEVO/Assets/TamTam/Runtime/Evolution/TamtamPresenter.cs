using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// Shows the player's Tamtam: the painted Chispín as a baby, then the evolved form of its genome
    /// (same designs as the web/app prototype), recoloured with the genome's palette and scaled by stage.
    public class TamtamPresenter : MonoBehaviour
    {
        public EvolutionCatalog catalog;
        [Tooltip("Painted family art (10 families × 3 stages). When set, evolved forms use it; the vector forms are the fallback.")]
        public FamilyArt familyArt;
        [Tooltip("Where the creature is placed (defaults to this transform).")]
        public Transform anchor;
        public float emission = 1;

        public GameObject Current { get; private set; }
        public string CurrentName { get; private set; } = "Chispín";
        public bool CurrentIsExact { get; private set; } = true;
        /// Genome shown now (null for the baby).
        public Genome CurrentGenome { get; private set; }
        /// Raised after every Show (habitat backdrops, UI).
        public event System.Action Shown;

        // Same as STAGE_SCALE in apps/mobile/src/creature/useCreature.ts.
        public static float StageScale(string stage) => stage switch { "child" => 1.1f, "juvenile" => 1.22f, "adult" => 1.34f, _ => 1f };

        public void Show(Genome genome, string stage = "baby")
        {
            if (Current) Destroy(Current);
            var parent = anchor ? anchor : transform;
            var art = genome != null && stage != "baby" && familyArt ? familyArt.Get(genome, stage) : null;
            CurrentGenome = stage == "baby" ? null : genome;
            if (art)
            {
                var pc = familyArt.Spawn(art, parent, "Tamtam_" + art.name);
                Current = pc.gameObject;
                Current.transform.localScale = Vector3.one * StageScale(stage);
                var fam = FamilyArt.Dominant(genome);
                pc.floating = fam == Family.shadow || fam == Family.light || fam == Family.plasma;
                pc.SetMutation(genome.mutation);
                CurrentName = Genetics.FormName(genome, 1);
                CurrentIsExact = true;
                Shown?.Invoke();
                return;
            }
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
            if (!Current.GetComponent<GroundShadow>()) Current.AddComponent<GroundShadow>();
            var rig = Current.GetComponentInChildren<CreatureRig>();
            if (rig && genome != null && stage != "baby")
            {
                var p = GenomePalette.Of(genome);
                rig.SetPalette(p.baseC, p.accent, p.eye, p.glow, emission);
            }
            Shown?.Invoke();
        }

        public void Play(string clip)
        {
            if (!Current) return;
            var painted = Current.GetComponent<PaintedCreature>();
            if (painted) { painted.Play(clip); return; }
            var rig = Current.GetComponentInChildren<CreatureRig>();
            if (rig) rig.Play(clip);
        }
    }
}
