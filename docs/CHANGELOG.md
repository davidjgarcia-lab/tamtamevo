# CHANGELOG — Tam Tam Evo

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico desde la primera build jugable.

## [Sin publicar]

### Arte pintado de las 10 familias (2026-11-24)
#### Cambiado
- **10 familias** según las hojas de arte del usuario: Brasildo (fuego), Aqualin (agua), Foliaris (planta), Voltix (eléctrico),
  Rocanix (roca), Umbrin (sombra), Lúmina (luz), Diamor (cristal), Plasmax (plasma) y Mistor (místico, nueva).
  Ids internos: metal→electric, reptile→rock, ghost→shadow, ether→light, gel→plasma, más mystic.
  Hay 230.400 millones de combinaciones genéticas. El bebé Chispín pasa a ser de fuego puro (línea Brasildo).
- Afinidades: entrenar lleva a Rocanix, entrenar jugando a Voltix, estudiar a Mistor y los mimos a Lúmina/Foliaris.
  Técnicas de Arena reasignadas: Relámpago (Voltix), Coraza de roca (Rocanix) y Haz de luz (Lúmina).
  Nueva técnica **Ilusión** (Mistor). Ventajas: fuego>planta>roca>eléctrico>agua>fuego, luz>sombra>místico>luz, cristal>plasma>eléctrico.
#### Añadido
- **Las formas evolucionadas usan el arte pintado** (30 criaturas: 10 familias × inicial/intermedia/final), recortado
  de la hoja con fondo transparente y **escalado ×4 con superresolución (EDSR)**: de unos 120 px a unos 500 px. Infantil →
  inicial, Juvenil → intermedia, Adulto → final. La familia que se ve es la dominante del genoma. Se anima con el
  esqueleto compartido (respira, camina, ataca, salta y come), y las mutaciones tiñen el sprite.
- **Biomas pintados** (bosque, cascada, lava, cueva de cristal, setas de sombra, ruinas, islas del cielo y coliseo), también escalados ×4,
  como escenario de la Arena según la familia del rival.
- Unity: `Art/Creatures/Families` (30 PNG), `Art/Environments/Biomes` (8 PNG), menú **TamTam ▸ Evoluciones ▸ 0 · Importar arte
  pintado de familias**, `FamilyArt` y `PaintedCreature` (animación procedural). `TamtamPresenter` usa el arte pintado si está.
- `tools/import-family-sheet.py` repite el recorte y el escalado. Las hojas originales están en `docs/media/concept/sheets/`.
#### Limitaciones
- La mezcla de piezas del genoma sigue en las estadísticas, el nombre y las piezas vectoriales, pero el dibujo pintado muestra la **familia dominante**
  (una ilustración entera no se puede mezclar por piezas).
- Los objetos de entorno, los iconos y la habitación morada de las hojas **no se han importado** (fondo oscuro con brillos y muy baja resolución).

### Fases C y D del plan de mejoras + puente a Unity (2026-11-24)
#### Añadido
- **Arena (fase C):** una técnica por familia (Ascuas, Coraza, Reflejo, Esquiva fantasma, Raíces, Torbellino, Rebote,
  Corriente, Mordisco feroz). Ventajas entre familias (+15 %/−13 %) que se ven antes de luchar. Nivel de Arena con
  **carta 1 de 2** (estadística, técnica o compañero de la Granja). **Energía de Arena 5/día** y combate de consuelo
  tras 3 derrotas. No se lucha dormido, agotado ni con hambre. Escuelas Garra, Pluma y Rayo (nivel 10 de cuidador).
  Líderes de la semana con insignias (tabla local). Narración en el combate, **Repetir** y **¡Revancha!**
- **Casa (fase D):** habitaciones por nivel (Salón 1, Cocina 2, Baño 4, Dormitorio 6), cada una con sus muebles y acabados.
  La cocina sacia un 15 % más y el baño limpia un 20 % más. En el dormitorio, el interruptor de luz y la cama aceleran
  el descanso. Nuevos muebles: arenero de musgo (recoge la mitad de las cacas), pelota, peonza, fogón y tina.
  Estrellas de confort en la tienda. **Árbol de bayas** en la Granja (10 min). **Colección**: bestiario de formas vistas
  (tuyas y rivales), álbum de cuadros y armario con 4 accesorios que se ven sobre la cabeza. **Modo foto** (descarga PNG en la web).
- **Unity:** `tools/export-unity.ts` (familias, biblioteca de piezas, esqueleto y 80 formas) y `tools/export-unity-assets.mjs`
  (casa-nido, acabados, paisajes, cuadros y muebles). En Unity: menú **TamTam ▸ Actualizar todo**, constructor de formas
  evolucionadas, `EvolutionCatalog` y `TamtamPresenter`, escenas EvolutionLab y NestHouse, y tests de paridad.
  Guía: `docs/UNITY_UPDATE_GUIDE.md`. DEV ▸ **Copiar genoma para Unity**.
- E2E ampliado a 26 comprobaciones (baño por pasos, comida arrastrada, problemas, niveles, habitaciones, foto/colección, Arena con cartas, bayas).
#### Limitaciones
- El C# nuevo **no se ha compilado aquí** (no hay Unity en este entorno): está pendiente de probar en el PC.
- Las formas evolucionadas (web y Unity) siguen siendo piezas vectoriales; el arte pintado por familia está **BLOQUEADO** (sin cupo de generación de imágenes).
- Sala de juegos, objetos de cómic en Arena y fase E (social) **NO IMPLEMENTADOS**.

### Chispín pintado en la app web (2026-11-24)
#### Añadido
- El Chispín **pintado con IA** del proyecto Unity (PaintedChispinBuilder) ahora también en la app/prototipo web:
  malla deformable (902 vértices) con los mismos 16 huesos y pesos que en Unity, piel calculada en cada frame sobre el
  esqueleto compartido → los 14 clips, respiración, parpadeo (ojos cerrados pintados) y cola/llamas con inercia.
  Generado con `tools/gen_painted_chispin.py` desde los assets de Unity.
- Alelos de color sobre la pintura (Ceniza, Oro Fundido, Rubí, Azul Llama) por cambio de tono/saturación; brillo extra con Lustre alto.
- Arena con el fondo pintado de la **guarida de fuego**.
#### Limitaciones
- La boca sigue pintada cerrada (al comer, la comida se ve pero la mandíbula no se abre); las formas evolucionadas siguen siendo vectoriales.

### Casa-nido de bosque (2026-11-19)
#### Añadido
- **Paredes y suelos editables** (Decorar ▸ Paredes / Suelo, y Tienda ▸ Paredes y suelos): nido trenzado, troncos, piedra con musgo, papel de hojas, corazón del árbol · tablones, musgo, losas de río, anillos de árbol. `setFinish` en core.
- Habitación como **casa-nido de bosque**: marco de tronco curvado, techo de ramitas con hojas, raíces como zócalo, **ventana redonda** al bosque (luciérnagas de noche).
- **Cuadros de paisajes** con marco de madera: volcán, noche estrellada, bosque al alba, acantilado y mar, montañas nevadas, aurora boreal, cascada, dunas.
#### Cambiado
- Muebles redibujados con formas más reales y sombra de contacto: cama-nido de mimbre con edredón y almohada, lámpara seta con láminas iluminadas, silla con patas, travesaño y respaldo de listones, helecho con frondas y maceta de barro, sofá de troncos, brasero de trípode, soporte de mancuernas, escritorio.

### Evolución genética según los cuidados + 10 familias (2026-11-19)
#### Añadido
- **Evolución jugable**: cuando la madurez de la etapa se completa aparece "¡listo para evolucionar!" en Casa → Ritual (resplandor, destello y la nueva forma con qué familias aportó cada pieza y qué cuidados influyeron).
- **Algoritmo genético** (`packages/core/src/genetics/`, `EVOLUTION_ALGORITHM.md`): perfil de cuidado de la etapa (cuidados, mimos, higiene, entreno, combate, estudio, juego) → afinidad por familia → sorteo de 5 piezas (herencia 28%, mutación salvaje 5–17%, resto por afinidad²) + colores, ojos, patrón y mutaciones raras. Determinista por Tamtam. **110.199.605.760** combinaciones.
- **9 familias de piezas** (Magmáridos, Silváridos, Ferrálidos, Cristálidos, Umbrálidos, Mareálidos, Gelíferos, Etéridos, Escamáridos) + Quimeras; piezas vectoriales modulares sobre el esqueleto de Chispín (los 14 clips funcionan con cualquier mezcla; sombra y aire levitan).
- Las formas evolucionadas cambian los stats de Arena (cada pieza aporta los de su familia, más fuerza por etapa) y la habilidad (la del lomo). Los rivales evolucionados también tienen formas aleatorias.
- Ficha: barras de cómo lo estás criando y **tendencia de la próxima evolución** (% por familia).
- Debug: madurez completa, forzar evolución, simular estilos de crianza y **Laboratorio de evolución** (9 tiradas por perfil).
- Registro de etapa en el cuidado (caricias, baños, comidas, Gym, estudio, minijuegos, combates).
- `CREATURE_FAMILIES_ANATOMY.md` v2: 10 familias × 5 propuestas mezclando rasgos.

### Primera versión de app móvil: pestañas, Chispín v3, cuidados táctiles, minijuegos, Arena (2026-11-19)
#### Añadido
- **Chispín v3**: rediseño completo como lagarto de magma cuadrúpedo (rig nuevo, 14 clips: idle, walk, run, eat, pet, sleep, celebrate, train, bathe, sad, hungry, angry, attack, hit). Ojos blancos almendrados con pupila de rendija, vetas de magma emisivas, cresta de tres llamas.
- `CREATURE_FAMILIES_ANATOMY.md`: 5 familias (Acuáticas, Gelatinosas, Etéreas, Reptilianas, Híbridas) × 3 propuestas, reglas de anatomía/ojos/materiales y set de locomoción por familia. **Pendiente de validación**; hojas de concepto bloqueadas por el límite de imágenes.
- **Navegación con pestañas**: Casa · Granja · Tienda · Arena · Conectar. Perfil desde la cabecera.
- **Huevo en la habitación**: se calienta y se abre allí mismo (grietas y destello); el nombre se pone en un panel bajo el recién nacido. Eliminadas las pantallas de huevo y de nombre.
- **Comer**: cada comida tiene ilustración (en el menú y en la tienda) y se ve en la boca del Tamtam, desapareciendo en tres bocados.
- **Bañar**: ducha con alcachofa, chorro de agua, salpicaduras y espuma; después, toalla.
- **Cacas por la habitación** (posición derivada de su hora) y **Limpiar con fregona**: frotar con el dedo sobre cada una.
- **Suciedad visible**: manchas cuando la higiene baja de 50 y **moscas** por debajo de 30.
- **Mimos acariciando**: deslizar el dedo sobre el Tamtam (ya no hay botón).
- **Jugar → 4 minijuegos solo con iconos** (D9): laberinto, rompeladrillos, cuadrícula de emblemas 4×4 y estela con rival IA. Récords, monedas con rendimientos decrecientes diarios, diversión/actividad.
- **Gimnasio y Estudio dentro de la habitación**: el Tamtam camina a las mancuernas o al escritorio (nuevo mueble) y la actividad aparece en el panel inferior. Estudio = memorizar recetas de ingredientes (Inteligencia).
- **Granja**: Tamtams que no juegan (necesidades en pausa) e intercambio con el de casa.
- **Arena**: rangos Bronce→Leyenda con PC, 3 rivales diarios (fácil/igualado/difícil), combate automático en tiempo real con barras de vida, daño flotante, esquivas y habilidad; recompensas idempotentes.
- **Conectar**: código de amigo y lista de amigos. Visitas y combates amistosos **desactivados**: requieren servidor online (no existe aún).
- Core: `arena.ts`, `activities.ts` (estudio, minijuegos, combate, granja), `poopSpot`/`cleanPoop`, SCHEMA_VERSION 2.
#### Cambiado
- Carga mínima 1600 → 400 ms.
- Iconos, comidas y miniaturas se renderizan una vez a imagen (en web cada lienzo Skia es un contexto WebGL y el navegador solo mantiene unos 16).
#### Corregido
- Gimnasio: mantener pulsado en móvil ya no selecciona texto ni abre el menú contextual.

### Marca aplicada + launcher + carga + prototipo publicado (2026-11-19)
#### Añadido
- `BRAND_SYSTEM.md`: aplicación del Manual de Marca y del Art Direction (tokens, logo, icono, tipografía, componentes, arranque).
- Recursos de marca en `apps/mobile/assets/brand/`: logo transparente, icono de app 1024², icono adaptativo Android, favicon y splash.
- **Launcher**: icono, icono adaptativo y splash nativo (`expo-splash-screen`) en app.json. Nombre en el dispositivo: **TamTam EVO**.
- **Pantalla de carga** con logo, halo, progreso real, tagline y consejos, más un **preloader web** para la descarga del motor.
- UI con la marca: fondo Violeta núcleo, paneles, botones cian, violeta, oro, menta y rosa, tipografía Baloo 2 + Inter. Habitación violeta con luz cálida. Huevo con la espiral cian del icono.
- Almacenamiento seguro: si el navegador bloquea localStorage, el juego sigue funcionando en memoria.
- `tools/build-artifact.mjs` (build web portable con rutas relativas) y prueba E2E bajo una subruta. **Prototipo publicado como artefacto.**

### Decisiones N9, N11, N12 + magia y Lustre (2026-11-19)
#### Añadido
- **Lustre** (`core/appearance`): puntuación de cuidado, actividades, Arena y vínculo con 5 niveles; se **graba en cada evolución** como calidad de forma (stats ×0,88–1,10, habilidades Debilitada→Ascendida, pasiva extra en Legendario). Marca de vida por atributo dominante.
- Efectos visuales: emisivo con bloom, halo (y luces en órbita), sheen animado, destellos, saturación y densidad de partículas según el nivel; adornos físicos por nivel en Chispín (hollín, pecas doradas, llamas extra, runa, corona).
- Siestas de 20 min (+15 Energía, cada 90 min). Coste del Gym 5/8/10 según el nivel.
- Debug: historial de cuidado forzable y comparativa de Lustre.
- Marca: el juego se llama **TamTam Evolution** y la marca visual es **TamTam EVO**.

### Art Bible + vertical slice del primer Tamtam (2026-11-19)
#### Añadido
- `ART_BIBLE.md` (identidad, proporciones por etapa, anatomía modular, paletas de 8 familias, 14 expresiones, guía de documentación) y concept art generado con IA (`docs/media/concept/`, solo referencia).
- Chispín v2: cejas, cuernitos de brasa, cola con ascua, cuerpo con degradado y 11 clips (6 nuevos: celebrar, entrenar con mancuerna, bañarse, triste, hambriento, enfado). El rig admite rellenos con degradado y los slots `brows` y `prop`.
- **Prototipo jugable**: huevo → eclosión → nombre → casa con muebles → cuidados → comida → Gym (3 niveles) → monedero, historial y tienda ("Probar en mi casa") → decorar → ficha (FUE de Arena) → guardado.
- **Developer Debug Mode**: partida separada, reloj simulado, monedas, necesidades, atributos, objetos, evolución forzada y huevos.
- `packages/core`: simulación de cuidados en tiempo real (`care/needs.ts`), contenido y reglas del slice (`game/*`), motor de evolución con reglas de Fuego (`evolution/engine.ts`) y simulador de ciclo de vida (`sim/lifecycle.ts`).
- Tests: 102 unitarios y de integración, 19 comprobaciones E2E (`tools/playthrough.mjs`), matriz de evolución de 27 escenarios + 5.000 aleatorios.
- Documentos: CHARACTER_DESIGN_FIRST_TAMTAM, CHARACTER_ANIMATION_GUIDE, EVOLUTION_TEST_MATRIX, GAMEPLAY_TEST_PLAN, QA_TEST_PLAN, GAMEPLAY_TEST_RESULTS, PROGRESSION_TIMELINE, BALANCE_CONFIG, FIRST_TAMTAM_VERTICAL_SLICE y REUSABLE_CREATURE_TEMPLATE.
#### Corregido
- Toques en la habitación en web, cierre del panel debug, precisión del crecimiento, `structuredClone` y recorte de la ventana (GAMEPLAY_TEST_RESULTS §5).

### Brief v3.0 — Documentación y núcleo de lógica (2026-11-19)
#### Añadido
- `HOME_SYSTEM.md`, `ECONOMY_SYSTEM.md` y `ACTIVITIES_SYSTEM.md`.
- Análisis de las 5 imágenes de referencia y reglas de estilo derivadas (ART_DIRECTION §11–12).
- Identidad individual del Tamtam y reglas de nombre (CREATURE_DATABASE §12).
- Término de atributos en la fórmula de evolución (específico por rama).
- `packages/core`, lógica pura con 51 tests: identidad y nombres, monedero sobre libro mayor (atómico, idempotente y auditable), inventario, catálogo y tienda, colocación de muebles, recompensas con Entusiasmo, atributos y mejoras de objetos funcionales, y snapshots versionados.
#### Cambiado
- Las criaturas pasan a llamarse **Tamtams** y la moneda común **Tamcoins** (pendiente de N5).
- Hogar = casa decorable (pendiente de N4). Las secciones sustituidas de GAMEPLAY_SYSTEMS están marcadas.
- ROADMAP combinado en 12 fases (pendiente de N8), con unos 12 meses estimados hasta la 1.0.
#### No implementado todavía
- Ninguna pantalla nueva (eclosión con nombre, ficha, tienda, editor de casa, actividades).
- Persistencia SQLite; las actividades jugables; las animaciones nuevas.

### Fase 2 — Spike técnico de animación (2026-11-19)
#### Añadido
- Monorepo pnpm: `apps/mobile` (Expo SDK 58, React Native 0.88, Skia 2.14, Reanimated 4.7), `packages/rig` y `packages/art`.
- **TamRig** (`packages/rig`), runtime de animación esqueletal vectorial:
  - Huesos jerárquicos y clips por keyframes con easing.
  - Cross-fade entre clips de 0,25 s.
  - Capas procedurales: respiración, parpadeo determinista y follow-through con retardo y reacción a la velocidad (llamas, colas).
  - Expresiones faciales por estado.
  - Partículas sin estado.
  - Paletas genéticas derivadas en OKLCH.
  - Todo es TypeScript puro ejecutable como worklet en el hilo de UI.
- **Chispín** (`packages/art`): 14 huesos, 40 partes vectoriales con canales de tinte, 5 clips (reposo, caminar, comer, caricia y dormir), emisores de partículas por clip (ascuas, polvo, migas, corazones y Zzz) y 5 alelos de color de la familia Fuego.
- Hábitat de Fuego en versión spike (cueva basáltica, río de lava y cristales de obsidiana) en 4 capas.
- Pantalla "Rig Lab" (herramienta de desarrollo): cambio de animación, acariciar tocando a la criatura, cambio de alelo de color y contador de FPS.
- 19 tests (Vitest) y `tools/screenshots.mjs` para QA visual con Playwright en 4 resoluciones.
- Vídeo y capturas en `docs/media/`.

### Fase 1 — Aprobación (2026-11-19)
#### Cambiado
- Decisiones D1–D8 aprobadas tal como se propusieron.
- **D9:** los minijuegos no tienen nombre visible; se identifican solo por iconos. IDs internos `maze`, `bricks`, `grid` y `trail`. Se ha añadido la especificación de los iconos en ART_DIRECTION §5 y un criterio de aceptación en el ROADMAP.
- **D10:** nuevo sistema de **Madurez** (EVOLUTION_SYSTEM §2.1). El crecimiento de Bebé a Adulto dura entre 5 y 7 días según el cuidado y el juego activo. El nivel y el CQ dejan de bloquear las transiciones (ahora hay topes de nivel por etapa). Se ha añadido el test de propiedad 120–168 h.
- Todos los documentos pasan a la versión 0.2, en estado aprobado.

### Fase 1 — Diseño (2026-11-19)
#### Añadido
- `GAME_DESIGN_DOCUMENT.md`: visión, pilares, bucles, navegación, FTUE, reglas fundamentales, mundo, audio, accesibilidad, monetización (propuesta) y decisiones pendientes D1–D10.
- `CREATURE_DATABASE.md`: 8 familias, 40 formas (Bebé → Infantil → Juvenil → 2 Adultos), tabla elemental, 56 habilidades de familia, 6 universales, estados alterados y plantilla de nuevas criaturas.
- `EVOLUTION_SYSTEM.md`: fórmula de evolución determinista (gates + puntuación + overrides + desempate), CQ, ejes, objetos, genética mendeliana con semilla, mutaciones con garantía, reproducción, huevos, Códice y pruebas requeridas.
- `GAMEPLAY_SYSTEMS.md`: cuidados con simulación por timestamps, vida en el hábitat, 4 minijuegos, Arena en tiempo real (20 Hz, determinista, IA de utilidad, gambits, rangos), economía y entrenamiento.
- `TECHNICAL_ARCHITECTURE.md`: comparativa de stacks, propuesta Expo + RN + Skia + Reanimated + TS, rig de animación TamRig, monorepo, persistencia offline, pruebas, backend Supabase futuro y preparación para multijugador.
- `ART_DIRECTION.md`: pilares visuales, lenguaje de formas, paletas, tipografía, iconografía, animación, storyboards y pipeline.
- `ROADMAP.md`: 8 fases con criterios de aceptación y registro de funcionalidades.

#### Decisiones de diseño internas
- Los pesos de eje de todas las ramas suman 2.2 (invariante) para garantizar el balance neutro entre ramas.

## Errores conocidos
_Ninguno (todavía no hay código)._
