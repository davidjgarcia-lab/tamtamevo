using UnityEngine;

namespace TamTam
{
    /// Chispín Lab: buttons for the 14 clips and the fire colour alleles (IMGUI, works with any input backend).
    public class CreatureDemo : MonoBehaviour
    {
        [System.Serializable]
        public struct Allele { public string name; public Color baseC, accent, eye, glow; }

        public CreatureRig rig;
        public Allele[] alleles;
        public float emission = 1;
        int allele;

        void Start() { if (alleles != null && alleles.Length > 0) ApplyAllele(0); }

        void ApplyAllele(int i)
        {
            allele = i; var a = alleles[i];
            rig.SetPalette(a.baseC, a.accent, a.eye, a.glow, emission);
        }

        void OnGUI()
        {
            if (!rig) return;
            float s = Mathf.Max(1, Screen.height / 720f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1));
            GUILayout.BeginArea(new Rect(12, 12, 170, 700));
            GUILayout.Label($"<b>Chispín</b> · {rig.Current}", new GUIStyle(GUI.skin.label) { richText = true, fontSize = 15 });
            foreach (var c in rig.clips)
                if (GUILayout.Button(c.id, GUILayout.Height(26))) rig.Play(c.id);
            GUILayout.EndArea();
            GUILayout.BeginArea(new Rect(Screen.width / s - 182, 12, 170, 400));
            GUILayout.Label("Color", new GUIStyle(GUI.skin.label) { fontSize = 15 });
            for (int i = 0; i < alleles.Length; i++)
                if (GUILayout.Toggle(allele == i, alleles[i].name, GUI.skin.button, GUILayout.Height(26)) && allele != i) ApplyAllele(i);
            GUILayout.Label($"Brillo {emission:0.00}");
            float e = GUILayout.HorizontalSlider(emission, 0, 2);
            if (!Mathf.Approximately(e, emission)) { emission = e; ApplyAllele(allele); }
            GUILayout.EndArea();
        }
    }
}
