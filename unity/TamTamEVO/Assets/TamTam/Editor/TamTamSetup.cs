using System.Collections.Generic;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEngine;

namespace TamTam.EditorTools
{
    /// First-run setup: installs the packages the project needs (latest versions compatible with this Unity).
    /// Menu: TamTam ▸ Install required packages.
    public static class TamTamSetup
    {
        static readonly string[] Packages =
        {
            "com.unity.render-pipelines.universal", // URP 2D renderer: 2D lights, bloom, Shader Graph
            "com.unity.shadergraph",
            "com.unity.2d.animation",               // skinned sprites, bones, Sprite Library / Resolver
            "com.unity.2d.psdimporter",             // layered PSB → rig with one sprite per layer
            "com.unity.2d.spriteshape",
            "com.unity.inputsystem",
            "com.unity.test-framework",
        };
        static readonly Queue<string> queue = new Queue<string>();
        static AddRequest current;

        [MenuItem("TamTam/Install required packages")]
        public static void Install()
        {
            foreach (var p in Packages) queue.Enqueue(p);
            EditorApplication.update += Step;
        }

        static void Step()
        {
            if (current != null && !current.IsCompleted) return;
            if (current != null) Debug.Log(current.Status == StatusCode.Success ? $"TamTam: installed {current.Result.packageId}" : $"TamTam: failed {current.Error?.message}");
            if (queue.Count == 0) { EditorApplication.update -= Step; current = null; Debug.Log("TamTam: packages ready."); return; }
            current = Client.Add(queue.Dequeue());
        }
    }
}
