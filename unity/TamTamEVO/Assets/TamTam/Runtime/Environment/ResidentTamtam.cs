using System.Linq;
using TamTam.Evolution;
using UnityEngine;

namespace TamTam.World
{
    /// The Tamtam that lives in the nest-house: a starter from catalog.json (Brasildo by default) that idles, wanders a
    /// little and sleeps at night. Pure presentation — the genome and motion come from the shared data.
    [RequireComponent(typeof(TamtamPresenter))]
    public class ResidentTamtam : MonoBehaviour
    {
        public string starterId = "brasildo";
        TamtamPresenter presenter; DayNight dayNight; float next; Vector3 home;

        void Start()
        {
            presenter = GetComponent<TamtamPresenter>();
            dayNight = FindFirstObjectByType<DayNight>();
            home = transform.position;
            var cat = presenter.catalogJson ? JsonUtility.FromJson<CatalogJson>(presenter.catalogJson.text) : null;
            var st = cat?.starters?.FirstOrDefault(s => s.id == starterId) ?? cat?.starters?.FirstOrDefault();
            if (st != null) presenter.Show(st.genome.ToGenome(), "baby");
            next = Time.time + 2;
        }

        void Update()
        {
            if (!presenter || !presenter.Current) return;
            bool night = dayNight && dayNight.night;
            var pc = presenter.Current.GetComponent<PaintedCreature>();
            if (night) { if (pc && pc.Current != "sleep") presenter.Play("sleep"); return; }
            if (pc && pc.Current == "sleep") presenter.Play("idle");
            if (Time.time < next) return;
            next = Time.time + Random.Range(3f, 6f);
            presenter.Play(Random.value < 0.6f ? "idle" : Random.value < 0.5f ? "pet" : "celebrate");
        }
    }
}
