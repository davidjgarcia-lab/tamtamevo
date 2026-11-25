using System.Collections.Generic;
using TamTam.Core;
using UnityEngine;

namespace TamTam.Evolution
{
    /// EvolutionLab: evolve Chispín with a care style (same algorithm as the web game) and see the real form.
    public class EvolutionLabDemo : MonoBehaviour
    {
        public TamtamPresenter presenter;
        static readonly (string name, CareProfile p)[] Styles =
        {
            ("Guerrero", new CareProfile { care = .7, affection = .4, hygiene = .5, training = .9, fighting = .9, study = .1, play = .2, neglect = .3 }),
            ("Limpio y estudioso", new CareProfile { care = .85, affection = .6, hygiene = .95, training = .2, fighting = .1, study = .9, play = .2, neglect = .15 }),
            ("Mimado", new CareProfile { care = .9, affection = .95, hygiene = .7, training = .1, fighting = .1, study = .2, play = .4, neglect = .1 }),
            ("Jugón", new CareProfile { care = .75, affection = .6, hygiene = .8, training = .2, fighting = .1, study = .2, play = .95, neglect = .25 }),
            ("Descuidado", new CareProfile { care = .3, affection = .2, hygiene = .25, training = 0, fighting = 0, study = 0, play = 0, neglect = .7 }),
        };
        static readonly string[] Stages = { "baby", "child", "juvenile", "adult" };
        static readonly string[] Clips = { "idle", "walk", "attack", "celebrate", "eat", "sleep", "pet", "sad" };

        Genome genome; Family? line; int stage; uint seed = 1; string info = "Chispín · Bebé";

        void Start() => NewEgg();

        /// A new egg: one of the starters at random (same list as the web game).
        void NewEgg()
        {
            var catalogText = presenter.catalogJson ? presenter.catalogJson.text : null;
            var cat = catalogText != null ? JsonUtility.FromJson<CatalogJson>(catalogText) : null;
            if (cat?.starters == null || cat.starters.Length == 0) { genome = null; stage = 0; presenter.Show(null); info = "Chispín · Bebé"; return; }
            var st = cat.starters[UnityEngine.Random.Range(0, cat.starters.Length)];
            genome = st.genome.ToGenome(); stage = 0; line = genome[PartSlot.body];
            presenter.Show(genome, "baby");
            info = $"¡Ha nacido un {st.species}! · {st.title} · {string.Join(", ", st.traits)}";
        }

        void Evolve(CareProfile p)
        {
            if (stage >= Stages.Length - 1) return;
            var roll = Genetics.Roll(genome ?? Genetics.Chispin, p, seed++ * 7919u);
            var prev = line ?? (genome != null ? FamilyArt.Dominant(genome) : Family.fire);
            genome = roll.genome; stage++;
            line = FamilyArt.NextLine(prev, genome);
            presenter.Show(genome, Stages[stage], line);
            info = $"{presenter.CurrentName} · {Stages[stage]}{(presenter.CurrentIsExact ? "" : " · (forma más parecida: constrúyela en TamTam ▸ Evoluciones ▸ 2)")}";
        }

        void OnGUI()
        {
            float s = Mathf.Max(1, Screen.height / 720f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1));
            GUILayout.BeginArea(new Rect(12, 12, 260, 700));
            GUILayout.Label($"<b>{info}</b>", new GUIStyle(GUI.skin.label) { richText = true, fontSize = 15, wordWrap = true });
            GUILayout.Label("Evolucionar con estilo de cuidado:");
            foreach (var (name, p) in Styles) if (GUILayout.Button(name, GUILayout.Height(26))) Evolve(p);
            if (GUILayout.Button("Nuevo huevo (inicial al azar)", GUILayout.Height(26))) NewEgg();
            GUILayout.EndArea();
            GUILayout.BeginArea(new Rect(Screen.width / s - 160, 12, 148, 400));
            foreach (var c in Clips) if (GUILayout.Button(c, GUILayout.Height(24))) presenter.Play(c);
            GUILayout.EndArea();
        }
    }
}
