# Plan de mejoras a partir de las referencias (tandas 1–3)

Resumen priorizado de `TANDA1_MINIJUEGOS.md`, `TANDA2_CUIDADOS_HABITACION.md` y `TANDA3_ARENA.md`.
Principio: **todo gira alrededor del Tamtam** (lo cuidas, juega contigo, lucha y evoluciona), sin monetización
agresiva (nada de anuncios obligatorios ni probabilidades falsas).

## Estado (2026-11-24)

| Fase | Estado | Notas honestas |
|---|---|---|
| A | **IMPLEMENTADO** y probado (E2E-06, 21, 22, 23) | El nivel 1–60 es del **cuidador** (no del Tamtam). Sin notificaciones push (no hay app nativa todavía). |
| B | **IMPLEMENTADO** y probado (E2E-10, 11) | El dibujo que se descubre en ladrillos es un paisaje de fondo, no un puzle de piezas. |
| C | **IMPLEMENTADO** y probado (E2E-16, 25) | Líderes semanales con rivales **locales generados** (sin servidor). Los "objetos de cómic" no están hechos (**NO IMPLEMENTADO**). La escuela se elige en el nivel 10. |
| D | **IMPLEMENTADO** y probado (E2E-23, 24, 26) | Salón, cocina, baño y dormitorio; la **sala de juegos no está hecha** (**NO IMPLEMENTADO**). La ropa son 4 accesorios de cabeza/cuello. La foto se descarga como PNG en la web y en móvil solo se cuenta. |
| E | **BLOQUEADO** | Necesita un servidor (cuentas, retos entre jugadores, rankings reales). |

## Fase A — "Se siente vivo" (cuidados táctiles y progreso)
1. **Baño táctil** por pasos: jabón, frotar, ducha y toalla. **Comer arrastrando**, con rechazo si está lleno.
2. **Cuidar paga:** monedas y XP con límites y espera. **Nivel del Tamtam 1–60** con desbloqueos.
3. **Bocadillos** de lo que necesita (5–7 frases por estado) y textos de notificación con su voz.
4. **Problemas del Tamtam** con temporizador y retos táctiles (espina, ceniza, resfriado con poción, nudo).

## Fase B — "Quiero jugar otra" (minijuegos)
5. Capa común: **3 estrellas**, elogios concretos, el Tamtam animando, **racha diaria con protección** y la primera partida del día más fácil.
6. **Ladrillos → lanzar ascuas** (estilo "ballz") con potenciadores y un dibujo que se descubre.
7. **Cuadrícula → un Tamtam por fila, columna y región** (solución única, vidas, pista diaria).
8. **Estela** con acelerón, bots con carácter, potenciadores y revivir.

## Fase C — "Mi Tamtam es único" (Arena)
9. **Elegir 1 de 2** al subir de nivel en la Arena + **técnicas por familia** del genoma.
10. Narración, iconos, repetición y **revancha**. Energía de Arena 5/día.
11. Ventajas entre familias y **líderes semanales** con insignias.

## Fase D — Casa y colección
12. **Habitaciones** (cocina, baño, dormitorio con luz, sala de juegos) y muebles con **estrellas** (cama, arenero, juguetes).
13. **Árbol de bayas** (10 min), **álbum de paisajes** (piezas de los minijuegos), **modo foto**, **bestiario** y ropa.

## Fase E — Social (necesita servidor)
14. Maestro y alumnos, retar por nombre o código, rankings reales y visitas (Conectar).
