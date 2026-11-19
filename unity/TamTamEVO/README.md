# TamTam EVO — proyecto Unity (en preparación)

Estado: **ESQUELETO**. Aún no se ha abierto en Unity (no se puede ejecutar Unity en el entorno en la nube).

1. Unity Hub → *Add project from disk* → esta carpeta. Unity 6 LTS (2D, URP).
2. Menú **TamTam ▸ Install required packages** (URP, Shader Graph, 2D Animation, PSD Importer, Input System, Test Framework).
3. *Window ▸ General ▸ Test Runner ▸ EditMode ▸ Run All*: `GeneticsParityTests` comprueba que la evolución en C#
   da exactamente los mismos resultados que el prototipo web (16 casos + semilla).

Contenido: `Assets/TamTam/Core` (lógica pura C#, sin UnityEngine: genética/evolución portada),
`Runtime/GenomeView.cs` (monta un Tamtam desde su genoma con Sprite Library + tintado por shader),
`Editor/TamTamSetup.cs`, `Art/Creatures/README.md` (formato de las piezas pintadas). Plan: `docs/UNITY_MIGRATION_PLAN.md`.
