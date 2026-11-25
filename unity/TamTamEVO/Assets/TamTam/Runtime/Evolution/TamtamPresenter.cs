using System.Linq;
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
        [Tooltip("Data/Evolution/catalog.json: starters (personality, eyes) and the motion of each family/stage.")]
        public TextAsset catalogJson;
        CatalogJson data;
        CatalogJson Data => data ??= catalogJson ? JsonUtility.FromJson<CatalogJson>(catalogJson.text) : null;

        /// Starter whose look this genome has (pure genome of a starter family/variant), if any.
        public StarterJson StarterFor(Genome g)
        {
            if (Data?.starters == null || g == null || g.parts.Distinct().Count() != 1) return null;
            return Data.starters.FirstOrDefault(s => s.family == g.parts[0].ToString() && s.variant == g.variant[0])
                ?? Data.starters.FirstOrDefault(s => s.family == g.parts[0].ToString());
        }
        [Tooltip("Where the creature is placed (defaults to this transform).")]
        public Transform anchor;
        public float emission = 1;

        public GameObject Current { get; private set; }
        public string CurrentName { get; private set; } = "Chispín";
        public bool CurrentIsExact { get; private set; } = true;

        // Same as STAGE_SCALE in apps/mobile/src/creature/useCreature.ts.
        public static float StageScale(string stage) => stage switch { "child" => 1.1f, "juvenile" => 1.22f, "adult" => 1.34f, _ => 1f };

        public void Show(Genome genome, string stage = "baby", Family? line = null)
        {
            if (Current) Destroy(Current);
            var parent = anchor ? anchor : transform;
            var art = genome != null && familyArt ? familyArt.Get(genome, stage, line) : null;
            if (art)
            {
                Current = new GameObject("Tamtam_" + art.name);
                Current.transform.SetParent(parent, false);
                Current.transform.localScale = Vector3.one * StageScale(stage);
                var sr = new GameObject("sprite").AddComponent<SpriteRenderer>();
                sr.transform.SetParent(Current.transform, false);
                sr.sprite = art;
                var pc = Current.AddComponent<PaintedCreature>();
                pc.body = sr;
                var artStage = FamilyArt.ArtStage(stage);
                var fam = artStage == "baby" ? FamilyArt.Dominant(genome) : line ?? FamilyArt.Dominant(genome);
                var starter = artStage == "baby" ? StarterFor(genome) : null;
                // Physics: evolved forms move with their LEGS' family (web: motionFor(parts.legs, stage)).
                var legs = genome[PartSlot.legs].ToString();
                var mj = starter?.motion ?? Data?.motions?.FirstOrDefault(x => x.family == legs && x.stage == artStage)?.motion;
                if (mj != null) pc.motion = mj;
                pc.SetMutation(genome.mutation);
                if (starter?.eye != null && !string.IsNullOrEmpty(starter.eye.lid)) pc.SetEye(starter.eye);
                var sec = artStage == "baby" ? null : FamilyArt.Secondary(genome, fam);
                if (sec.HasValue) pc.SetAura(GenomePalette.Hex(Genetics.Defs[sec.Value].Glow));
                CurrentName = starter != null ? starter.species : Genetics.FormName(genome, 1);
                CurrentIsExact = true;
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
            var rig = Current.GetComponentInChildren<CreatureRig>();
            if (rig && genome != null && stage != "baby")
            {
                var p = GenomePalette.Of(genome);
                rig.SetPalette(p.baseC, p.accent, p.eye, p.glow, emission);
            }
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
