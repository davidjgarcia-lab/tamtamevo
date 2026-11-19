# GAMEPLAY TEST RESULTS

> Ejecución del 2026-11-19 · commit del vertical slice · entorno: contenedor Linux en la nube, Chromium headless (build web), Node 22.
> Resumen: **102 tests unitarios y de integración PASSED** (rig 14, core 83, art 5) · **19/19 comprobaciones E2E PASSED** · 0 errores de consola.
> Evidencia: `docs/media/slice/*.jpg`, vídeo `docs/media/vertical-slice-demo.mp4`, matriz `EVOLUTION_TEST_MATRIX.md`.

## 1. E2E (tools/playthrough.mjs, 390×844)

| ID | Funcionalidad | Escenario / entrada | Esperado | Obtenido | Estado | Evidencia |
|----|---------------|---------------------|----------|----------|--------|-----------|
| E2E-01 | Huevo | Arranque en partida nueva | Huevo incubando con barra | ✔ | PASSED | slice/01 |
| E2E-02 | Eclosión | Tocar el huevo listo | Grietas → pantalla de nombre | ✔ | PASSED | slice/03, 04 |
| E2E-03 | Validación de nombre | "A" | Error, no avanza | ✔ | PASSED | — |
| E2E-04 | Nombre Unicode | "Ñandú Brasita" | Visible en Hogar | ✔ | PASSED | slice/05 |
| E2E-05 | Monedero inicial | — | 300 | 300 | PASSED | — |
| E2E-17 | Acariciar tocando | Tap en Chispín | Cariño sube | 70→78 | PASSED | — |
| E2E-06 | Comer | Pimiento ascua | Hambre sube | 80→100 | PASSED | slice/06 |
| E2E-07 | Bañar | Bañar | Higiene ≥ 99 | ✔ | PASSED | slice/08 |
| E2E-08 | Gym | 5 repeticiones | Pantalla de recompensa | ✔ | PASSED | slice/10, 11 |
| E2E-09 | Monedas del Gym | — | Saldo sube | 300→325 | PASSED | — |
| E2E-10 | Compra | Silla (120) | −120 | 325→205 | PASSED | slice/12 |
| E2E-11 | Probar en mi casa | Póster (80) | Compra y coloca | 205→125 | PASSED | slice/13 |
| E2E-18 | Decorar | Silla del inventario → casilla | Colocada | ✔ | PASSED | slice/15 |
| E2E-19 | Mancuernas → Gym | Tap en las mancuernas | Abre el Gym | ✔ | PASSED | — |
| E2E-12 | Historial | Monedero | Gimnasio + compras listados | ✔ | PASSED | slice/16 |
| E2E-13 | Persistencia | Recargar la página | Nombre y saldo iguales | 125→125 | PASSED | — |
| E2E-14 | Debug +24 h | Reloj simulado | Hambre baja con suelo 25 | 94→25 | PASSED | slice/17 |
| E2E-15 | Debug aislado | +500 en debug y salir | Partida normal sin cambios | main 125, debug 625 | PASSED | — |
| E2E-16 | Estabilidad | Toda la sesión | 0 errores | 0 | PASSED | — |

## 2. Unitarias e integración (selección por área; detalle en los archivos de test)

| ID | Área | Prueba | Estado |
|----|------|--------|--------|
| U-NAME-* | Nombres | 9 válidos, NFC, grafemas, longitudes, inválidos, bloqueo, colapso de espacios | PASSED |
| U-ID-* | Identidad | Nombre por defecto determinista, conservación tras evolución, renombrar, edad | PASSED |
| U-ECO-* | Economía | Libro mayor, idempotencia, saldo no negativo, importes inválidos, auditoría | PASSED |
| U-SHOP-* | Tienda | Catálogo, estados, compra atómica, rollback tras fallo, máximo poseído, venta | PASSED |
| U-HOME-* | Habitación | Límites, solapes por capa, ventana, copias, mover, girar, color, superficies, celdas transitables, persistencia | PASSED |
| U-CARE-01 | Tiempo | 3 h cerrada = 180 pasos de 1 min (necesidades exactas, madurez < 0,5%) | PASSED |
| U-CARE-02 | Tiempo | Amortiguación tras 8 h y suelo 25 durante 7 días | PASSED |
| U-CARE-03 | Tiempo | Reloj hacia atrás ignorado | PASSED |
| U-CARE-04 | Descanso | Sueño +12/h y autodespertar al llegar a 100 | PASSED |
| U-CARE-05 | Excrementos | Aparecen 90–150 min tras comer; limpiar sube la higiene | PASSED |
| U-FOOD-01 | Alimentación | Consume inventario, favorita, rechazo por estar lleno sin consumir, sin comida → error | PASSED |
| U-FOOD-02 | Alimentación | Comida odiada (−felicidad); comida especial (+energía, buff) | PASSED |
| U-GYM-01..04 | Gym | Coste, monedas, XP, idempotencia, cansado, +FUE cada 10, 3 niveles | PASSED |
| U-LOOP-01 | Integración | Monedas del Gym → compra rechazada si es cara → compra de silla y colocación en una transacción → reintento sin doble cobro | PASSED |
| U-SIM-01 | Progresión | Bebé → elegible para adulto en 119–168 h en todos los perfiles activos | PASSED |
| EVO-01..17 | Evolución | Matriz completa | PASSED |
| U-RIG-* / U-ART-* | Animación | Compilación, FK, blink, cross-fade, partículas, paletas, estados faciales con arte, transformaciones finitas | PASSED |

## 3. Funcionalidades pedidas que NO están implementadas (no se marcan como probadas)

| ID | Funcionalidad | Estado | Nota |
|----|---------------|--------|------|
| NI-01 | Minijuego laberinto (`maze`) | NOT IMPLEMENTED | Fase 8 del roadmap |
| NI-02 | Minijuego bloques (`bricks`) | NOT IMPLEMENTED | |
| NI-03 | Minijuego cuadrícula (`grid`) | NOT IMPLEMENTED | |
| NI-04 | Minijuego serpiente (`trail`) | NOT IMPLEMENTED | |
| NI-05 | Arena: combate, IA, rangos, medallas, historial | NOT IMPLEMENTED | Solo existe el cálculo de FUE de Arena (probado) |
| NI-06 | Evolución en partida (Ritual, animación, formas Infantil, Juvenil y Adulto) | NOT IMPLEMENTED | Motor probado; en debug se fuerza el cambio en los datos |
| NI-07 | Acumulación de ejes de comportamiento desde las acciones | NOT IMPLEMENTED | El motor los recibe; falta conectarlos |
| NI-08 | Genética y cría (herencia, mutaciones, huevos con rareza) | NOT IMPLEMENTED | Solo los 5 alelos de color (probados) |
| NI-09 | Recetas y cocina (Academy) | NOT IMPLEMENTED | El "Guiso de fuerza" se compra hecho |
| NI-10 | Malestar (enfermedad leve) y estado Abatido | NOT IMPLEMENTED | |
| NI-11 | Guardería | NOT IMPLEMENTED | `advanceCare` ya admite congelar |
| NI-12 | IA de mobiliario (sentarse en la silla, usar la cama) | NOT IMPLEMENTED | Chispín deambula por delante |
| NI-13 | Animaciones: correr, despertar, estudiar, cocinar, sentarse, evolución, combate | NOT IMPLEMENTED | CHARACTER_ANIMATION_GUIDE §4 |
| NI-14 | Pausar / abandonar minijuego | NOT IMPLEMENTED | No hay minijuegos |
| NI-15 | Sonido y háptica | NOT IMPLEMENTED | |

## 4. Bloqueadas

| ID | Prueba | Estado | Motivo |
|----|--------|--------|--------|
| B-01 | 60 fps en Android de gama media | BLOCKED | El entorno en la nube no tiene GPU ni dispositivo. En Chromium headless (renderizado por software) se ven 25–50 fps, que no son representativos |
| B-02 | Persistencia en iOS y Android (AsyncStorage nativo) | BLOCKED | Requiere dispositivo o emulador. Probado solo en web |
| B-03 | Notificaciones locales | BLOCKED / NOT IMPLEMENTED | |

## 5. Errores encontrados y corregidos en esta fase
| # | Error | Causa | Solución | Prueba de regresión |
|---|-------|-------|----------|---------------------|
| 1 | Los toques en la habitación no hacían nada en web (acariciar tocando, recoger excrementos, abrir Gym, decorar) | `nativeEvent.locationX` no es fiable en react-native-web | Coordenadas de página menos la posición medida del escenario | E2E-17, 18, 19 |
| 2 | Al salir del modo debug el panel quedaba abierto y tapaba la casa | El estado de la hoja sobrevivía al cambio de perfil | Cerrar al salir | E2E-15 |
| 3 | El crecimiento integrado en tramos largos se desviaba un 2,4% | Ritmo constante por tramo, aunque la satisfacción cambia | Subpasos de ≤ 15 min | U-CARE-01 (< 0,5%) |
| 4 | Riesgo: `structuredClone` no existe en todos los motores JS móviles | API del navegador | `cloneData` propio | Tests de store |
| 5 | Ventana y pósters se dibujaban con un recorte invertido | Constante de recorte incorrecta | `ClipOp.Intersect` | Revisión visual slice/05 |

## 6. Revisión visual (capturas en `docs/media/slice/` y resoluciones en el playthrough)
| Comprobación | 360×640 | 390×844 | 430×932 | 768×1024 |
|--------------|---------|---------|---------|----------|
| Interfaz sin cortes | ✔ | ✔ | ✔ | ✔ |
| Personaje sin deformaciones | ✔ | ✔ | ✔ | ✔ |
| Texto legible | ✔ (pastillas de 11 px: límite) | ✔ | ✔ | ✔ |
| Botones ≥ 40 px de alto | ✔ | ✔ | ✔ | ✔ |

Observaciones: (a) en 360×640 Chispín se ve pequeño respecto a la casa; (b) los muebles no proyectan sombra de contacto salvo la cama; (c) las pastillas de necesidades usan 11 px (mínimo aceptable).
