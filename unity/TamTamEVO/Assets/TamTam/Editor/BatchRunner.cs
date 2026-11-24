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
    }
}
