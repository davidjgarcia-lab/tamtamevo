using System;
using UnityEditor;
using UnityEngine;

namespace TamTam.EditorTools
{
    /// Command-line entry points (Unity -batchmode -executeMethod ...): run a menu action and exit with 0/1.
    public static class BatchRunner
    {
        static void Run(Action a)
        {
            try { a(); AssetDatabase.SaveAssets(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }

        public static void UpdateEverything() => Run(Evolution.EvolvedFormsBuilder.UpdateEverything);
        public static void BuildArena() => Run(() => { Environments.ArenaBuilder.BuildScene(); Environments.ArenaBuilder.RenderSheet(); });

        /// Rebuilds everything except the 80 vector forms (fast): family art, Chispín, EvolutionLab, NestHouse, Arena.
        [MenuItem("TamTam/Reconstruir escenas (sin formas vectoriales)")]
        public static void RebuildScenes()
        {
            Evolution.EvolvedFormsBuilder.ImportFamilyArt();
            Chispin.PaintedChispinBuilder.Build();
            Chispin.PaintedChispinBuilder.RenderPreview();
            Environments.NestHouseBuilder.BuildScene();
            Environments.ArenaBuilder.BuildScene();
            Environments.ArenaBuilder.RenderSheet();
            Evolution.EvolvedFormsBuilder.BuildScene();
        }

        public static void RebuildScenesBatch() => Run(RebuildScenes);
    }
}
