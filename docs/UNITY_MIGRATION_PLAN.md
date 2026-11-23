# Migración a Unity — plan (decisión del usuario, 2026-11-19)

**Decisión:** el juego pasa a **Unity** (2D, URP) con **arte pintado generado por IA**. Motivo: el aspecto
"hecho por un niño" venía del arte (formas vectoriales dibujadas en código), no del motor; Unity aporta la cadena
profesional para animar ilustraciones pintadas (2D Animation: huesos + deformación de malla, Sprite Library para
intercambiar piezas, luces 2D, bloom, Shader Graph para emisivo/translúcido/iridiscente, VFX).
Unreal (3D, desproporcionado) y GameMaker (sin ventaja) se descartan; Godot queda como alternativa abierta.

## 1. Arquitectura

| Capa | Tecnología | Estado |
|---|---|---|
| Reglas (cuidados, economía, genética, Arena) | C# puro (`TamTam.Core`, sin UnityEngine) portado de `packages/core` | Genética **portada** con test de paridad; resto pendiente |
| Criaturas | 2D Animation: PSB por familia con capas comunes + mismo esqueleto; Sprite Library (categoría = pieza, etiqueta = familia_variante) | Chispín: rig completo, cola con SpriteSkin (4 huesos), 14 clips + Animator, capa procedural; **arte provisional generado** (falta el PSB pintado) |
| Materiales | `TamTam/CreatureLit` (HLSL para el 2D Renderer): máscara R/G/A → base/acento/glow, B → emisivo HDR, iridiscencia | hecho (translucidez y rim por shader, pendientes) |
| Luz y post | URP 2D Renderer: luces 2D por habitación, bloom, color grading | hecho (escena ChispinLab) |
| Partículas | VFX Graph / Particle System por familia (ascuas, hojas, chispas, burbujas, niebla) | ascuas de Chispín (Particle System + shader aditivo HDR); resto pendiente |
| UI | UI Toolkit con los tokens de marca (BRAND_SYSTEM) | pendiente |
| Guardado | JSON con el mismo esquema (SCHEMA_VERSION 2) → migración de partidas | pendiente |

## 2. Fases

1. **Fundación** ✅ (2026-11-23, Unity 6000.3.29f1): paquetes instalados, 18/18 tests de paridad, URP 2D + bloom.
2. **Chispín pintado** — técnica ✅ (rig, 14 clips, luces, bloom, recoloreo; render en `docs/media/unity/chispin-clips.png`), arte pintado ⏳: generar el concepto pintado, separarlo por capas, rig en 2D Animation, los 14 clips (idle, walk, run, eat, pet, sleep, celebrate, train, bathe, sad, hungry, angry, attack, hit). *Hito de calidad: compararlo con tus referencias.*
3. **Piezas de las 9 familias** (2 variantes por pieza) en el mismo formato → evolución visible en Unity.
4. **Port del juego**: habitación, cuidados táctiles, comida/ducha/fregona, minijuegos, Gym/Estudio, Granja, Tienda, Arena, Conectar.
5. **Móvil**: builds Android/iOS, rendimiento (atlas, batching), pruebas en dispositivos.

El prototipo web sigue siendo la referencia jugable y de reglas hasta que Unity lo iguale.

## 3. Arte con IA (formato de encargo)

Prompt base (por pieza y familia): *"Professional mobile creature-collector game art, painterly 2D, soft glowing light,
high detail, [familia y pieza], 3/4 side view facing right, isolated on transparent background, consistent with the
TamTam EVO style sheet (luminous almond eyes with thin pupils, anatomical, elegant, not childish)"* + hoja de estilo de
referencia (las imágenes del usuario). Salida → limpieza de bordes, separación por capas, máscaras de color, PSB.
**Bloqueo actual:** el generador de imágenes del plan gratuito ha alcanzado su límite diario.

## 4. Lo que necesito

- Tu ordenador conectado a una sesión (Claude Desktop o `claude remote-control` en la carpeta del repo) con **Unity Hub + Unity 6 LTS** instalados.
- Más capacidad de generación de imágenes (esperar al reinicio diario, plan de pago, o tus propias imágenes).
