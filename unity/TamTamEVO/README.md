# TamTam EVO — proyecto Unity

Unity **6.3 LTS (6000.3.29f1)**, URP con **2D Renderer**, espacio de color lineal, HDR.

## Puesta en marcha

1. Unity Hub → *Add project from disk* → esta carpeta. Los paquetes están en `Packages/manifest.json`
   (feature 2D: 2D Animation 13, PSD Importer 12, SpriteShape…; URP 17.3, Shader Graph, Input System, Test Framework).
2. **TamTam ▸ Build Chispín (rig, clips, scene)** regenera todo lo de Chispín (también configura URP 2D + Bloom).
3. Abrir `Assets/TamTam/Scenes/ChispinLab.unity` y pulsar Play: botones para los 14 clips, los 5 alelos de color y el brillo.
4. Tests: *Window ▸ General ▸ Test Runner ▸ EditMode ▸ Run All* (paridad de genética + assets de Chispín).

Desde línea de comandos (con el Editor cerrado):

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.29f1\Editor\Unity.exe" -batchmode -projectPath . -executeMethod TamTam.EditorTools.Chispin.ChispinBuilder.BuildAllBatch -logFile build.log
& "C:\Program Files\Unity\Hub\Editor\6000.3.29f1\Editor\Unity.exe" -batchmode -nographics -projectPath . -runTests -testPlatform EditMode -testResults results.xml -logFile tests.log
```

## Contenido

| Ruta | Qué es |
|---|---|
| `Assets/TamTam/Core` | Lógica pura C# (sin UnityEngine): genética/evolución portada, con test de paridad |
| `Assets/TamTam/Shaders/CreatureLit2D.shader` | `TamTam/CreatureLit`: sprite iluminado por luces 2D, recoloreo por máscara (R base, G acento, A glow), emisivo HDR (B) para Bloom, iridiscencia; compatible con SpriteSkin |
| `Assets/TamTam/Editor/RenderSetup.cs` | URP 2D Renderer, HDR, lineal, perfil de post (Bloom, tonemapping Neutral, grading, viñeta) |
| `Assets/TamTam/Editor/Chispin/` | Port de `packages/art/src/fire/chispin.ts` (huesos, piezas, 14 clips) y el generador: capas pintadas + máscaras, **cola con 4 huesos y pesos (2D Animation SpriteSkin)**, clips + Animator, escena |
| `Assets/TamTam/Runtime/Creature/` | `CreatureRig` (respiración, parpadeo, inercia de cola/llamas, paleta, ascuas), `FlickerLight2D`, `CreatureDemo` |
| `Assets/TamTam/Runtime/GenomeView.cs` | Montaje por genoma con Sprite Library (para las piezas de las 9 familias, fase 3) |
| `../../docs/media/unity/chispin-clips.png` | Render de verificación generado en batch (14 clips + alelos Azul Llama y Oro Fundido) |

## Arte

Las capas de `Art/Creatures/Chispin/Generated` se **generan** desde las formas del prototipo con sombreado, grano y
líneas más finas: son provisionales. Cuando llegue el PSB pintado por IA (formato en `Art/Creatures/README.md`)
sustituye a esas capas; huesos, clips, shader, luces y escena se mantienen.
