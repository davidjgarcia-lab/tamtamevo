# CHARACTER ANIMATION GUIDE — TamTam Evolution

> Versión 1.0 · 2026-11-19 · Sistema: **TamRig** (rig esqueletal vectorial + capas procedurales + partículas sin estado). Decisión D3.

## 1. Por qué TamRig
| Opción | Veredicto |
|--------|-----------|
| Spritesheets | Solo para VFX: no permiten partes genéticas intercambiables, ocupan mucha memoria |
| Spine 2D | Descartado: no tiene runtime mantenido para React Native |
| Rive | Alternativa si se incorpora un animador (requiere su editor) |
| **TamRig** | ✅ Partes SVG tintadas por genética, clips en JSON versionables, procedurales y partículas deterministas, render en GPU con Skia, en el hilo de UI |

## 2. Capas de una animación
1. **Clip con keyframes** (por hueso: x, y, rot, sx, sy; easing cúbico por defecto).
2. **Slots de estado** sincronizados con el clip: `eyes`, `mouth`, `brows`, `prop`.
3. **Procedural:** respiración (frecuencia y amplitud por clip), parpadeo determinista (cada 2,6–5 s, a veces doble), **follow-through** con retardo de 0,10–0,22 s en llama, cola y ascua, reacción a la velocidad horizontal y flicker de llamas.
4. **Partículas** por clip (ascuas, polvo, migas, corazones, Zzz, chispas, sudor, burbujas, humo), con capa delante o detrás de la criatura.
5. **Cross-fade** de 0,25 s entre clips (sin saltos).

## 3. Principios con números
- **Anticipación:** 8–15% de la duración antes de un impacto o salto (celebrar: squash de 0,15 s antes de despegar).
- **Squash & stretch:** ±8% (Bebé hasta ±18% en saltos), conservando el volumen (sx ≈ 1/sy).
- **Follow-through:** colas, orejas y llamas con retardo creciente por segmento (0,06 s por eslabón).
- **Ease:** `inOut` por defecto; `out` al despegar, `in` al caer, `linear` en desplazamientos de pies.
- **Arcos:** las manos describen arcos y no líneas (rotación + traslación).
- **Asimetría:** nunca dos lados idénticos en reposo (las manos van desfasadas en el idle).

## 4. Catálogo y estado (forma Bebé, Chispín)

| Animación | Clip | Duración | Loop | Prioridad | Estado |
|-----------|------|----------|------|-----------|--------|
| Idle | `idle` | 2,4 s | ✅ | 0 (base) | ✅ |
| Caminar | `walk` | 0,56 s (2 pasos) | ✅ | 1 | ✅ |
| Correr | — | 0,40 s | ✅ | 1 | ⛔ No implementado |
| Saltar / Celebrar | `celebrate` | 1,1 s | ✅ | 3 | ✅ |
| Comer | `eat` | 2,2 s | ✅ | 3 | ✅ |
| Dormir | `sleep` | 3,6 s | ✅ | 2 (estado) | ✅ |
| Despertarse | (cross-fade a `celebrate`) | 1,1 s | — | 3 | 🟡 Provisional |
| Acariciar | `pet` | 1,6 s | ✅ | 3 | ✅ |
| Bañarse | `bathe` | 1,2 s | ✅ | 3 | ✅ |
| Jugar | `celebrate` | 1,1 s | ✅ | 3 | 🟡 Reutiliza celebrar |
| Enfadarse | `angry` | 1,0 s | ✅ | 3 | ✅ |
| Triste / cansado / sucio | `sad` | 3,2 s | ✅ | 1 (estado) | ✅ |
| Hambriento | `hungry` | 2,4 s | ✅ | 1 (estado) | ✅ |
| Entrenar | `train` (prop mancuerna) | 1,4 s | ✅ | 3 | ✅ |
| Estudiar · Cocinar · Muebles (sentarse) | — | — | — | — | ⛔ No implementado |
| Evolucionar | — | ~6 s (ART_DIRECTION §7.4) | — | 4 | ⛔ No implementado |
| Atacar · Defender · Recibir daño · KO | — | — | — | 4 | ⛔ No implementado (no hay Arena) |

**Prioridades:** 4 ceremonia/combate > 3 reacción a una acción (temporal) > 2 estado persistente (dormido) > 1 estado de ánimo (hambre, tristeza) y desplazamiento > 0 idle. En el código: `reaction ?? (walking ? walk : mood)`.

## 5. Máquina de estados en Hogar
```
           ┌──────────── acción del jugador (temporal, 1–2,6 s) ────────────┐
idle ⇄ walk (deambula cada ~4,5 s si está contento)                      ▼
  │                                                                     reacción → vuelve al estado base
  └─ estado base por ánimo: dormido → sleep · hambre < 35 → hungry · tristeza/cansancio/suciedad → sad · resto → idle
```

## 6. Requisitos por etapa (para las siguientes formas)
| Etapa | Clips mínimos | Notas |
|-------|---------------|-------|
| Bebé | Los 11 de Chispín + correr, despertar y sentarse | Movimiento torpe, rebote alto |
| Infantil | + jugar con juguete, estudiar, cocinar | Manos con 3 dedos: los props se agarran |
| Juvenil | + ataque básico, habilidad, defender, daño, KO | Primer arquetipo cuadrúpedo |
| Adulto | + vuelo o levitación (si aplica) y evolución de entrada | Emisivos animados (magma, plumas de cinta) |
