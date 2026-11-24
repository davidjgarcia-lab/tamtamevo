# Tanda 3 — Referencias de Arena (análisis y plan)

> Fuente: **My Brute** (APK de 2011, versión móvil de *La Brute / El Bruto* de Motion Twin, publicado por Bulkypix),
> enviado el 2026-11-24, más el sistema de combate de **Drakomon** (tanda 2). Solo mecánicas; nada de arte, código
> ni personajes.

## 1. My Brute — por qué es un clásico del combate automático

**Bucle:** creas un bruto con estadísticas aleatorias → eliges rival → **el combate se juega solo** y lo ves como una
animación → ganas XP → al subir de nivel **eliges 1 de 2 mejoras al azar**. Pocas decisiones, pero muy
importantes, y cada bruto acaba siendo distinto.

| Sistema | Detalle (textos y datos del juego) |
|---|---|
| **Estadísticas** | Puntos de vida, Fuerza, Agilidad, Rapidez. |
| **Subida de nivel** | Eliges entre **dos** opciones al azar: mejorar una estadística ("Fuerza mejorada"…), una habilidad nueva, un arma o una mascota. |
| **23 habilidades** | **Pasivas:**<br>• Fuerza de Hércules, Agilidad felina, Golpe del rayo y Vitalidad;<br>• Inmortal (mucha vida, pero las demás estadísticas crecen más despacio);<br>• Maestro de Armas, Artes Marciales y 6º sentido (golpear primero);<br>• Pugnaz (contraataque), Escudo, Armadura, Piel reforzada e Intocable;<br>• Sabotaje (rompe un arma rival), Choque (le hace soltar el arma) y Brazo fuerte (armas pesadas);<br>• Implacable (no se puede bloquear) y Supervivencia (un golpe mortal te deja a 1 de vida);<br>• Ladrón (roba el arma) y Bruto Feroz.<br>**De un solo uso:**<br>• Poción trágica (cura), Red (inmoviliza hasta el siguiente golpe), Bomba y Martillo (agarre);<br>• Grito-maldito (ahuyenta animales), Hipnosis (te quedas sus mascotas) y Diluvio (lanzas todas tus armas). |
| **31 armas** | Cuchillo, espadón, lanza, tridente, hacha, maza, mangual, látigo, shuriken… y **armas cómicas** (puerro, sartén, taza, trombón, teclado, bol de ramen, raqueta). Se cogen, se lanzan y se pierden en pleno combate. |
| **Mascotas aliadas** | Perro, lobo, pantera y oso luchan contigo; se pueden ahuyentar o hipnotizar. |
| **Mascota del dojo** | Al crear el dojo eliges oso (fuerza y resistencia), gato (agilidad y esquiva) o serpiente (rapidez y golpear primero), y da una bonificación permanente ("fuerza de oso", "salto de gato", "ataque de cobra"). |
| **Combates por día** | Un número limitado al día ("está agotado, vuelve mañana"; "necesita 24 horas de descanso"). Tras una mala racha a veces regala **un combate extra**. |
| **Rivales** | La arena **elige un rival "especialmente seleccionado para ti"**; también puedes **retar a un bruto por su nombre**. |
| **Después del combate** | Volver a ver el combate y **"Vengarse"** (revancha directa). Frases con personalidad: "Tu bruto ha aplastado a…", "Mal día hoy… ¡mañana serán los demás quienes muerdan el polvo!". |
| **Maestro y alumnos** | Te haces alumno de otro jugador con un código. El maestro gana XP con los combates de sus alumnos y hay regalos por número de alumnos. Fue el motor viral del juego. |
| **Progresión** | Hasta 8 brutos, 8 arenas desbloqueables y más de 70 habilidades y armas. |

**Claves del éxito:** (1) decisiones raras pero con peso (elegir 1 de 2), (2) combate legible y gracioso que da
ganas de verlo, (3) cada personaje es único, (4) sesiones cortas con límite diario que hacen volver, (5) revancha y
retos por nombre que crean rivalidades, (6) maestro y alumnos.

## 2. Drakomon — combate por turnos con elementos (complemento)
- Movimientos con carga o salto, **efectos que duran varios turnos** (daño o curación), estados que se aplican al final del turno, curar al equipo.
- **Insignias por elemento** (fuego, agua, planta, rayo, roca, aire), como líderes de gimnasio. Captura con barra y **guardería** para el resto del equipo.

## 3. Cómo lo llevamos a la Arena de TamTam EVO
La Arena actual ya tiene combate automático en tiempo real, rangos y PC, y estadísticas según las piezas de la evolución.

| Idea | Diseño TamTam EVO |
|---|---|
| **Elegir 1 de 2 al subir de nivel en la Arena** | Cada nivel de Arena (XP por combates) ofrece **2 cartas al azar**: estadística (+Fuerza, +Agilidad…), **técnica** (ver abajo) o **compañero** (un Tamtam bebé de la Granja que apoya en el combate). Cada Tamtam acaba con su propio "mazo". |
| **Técnicas según la familia de sus piezas** | Pasivas y de un solo uso, ligadas a las familias de su genoma:<br>• **Fuego:** Ascuas (daño en el tiempo).<br>• **Metal:** Coraza (reduce el daño).<br>• **Cristal:** Reflejo (devuelve un golpe).<br>• **Sombra:** Esquiva fantasma.<br>• **Planta:** Raíces (inmoviliza, como la red).<br>• **Agua:** Torbellino (empuja, hace perder el turno).<br>• **Gelatina:** Rebote (sobrevivir con 1 de vida, una vez).<br>• **Aire:** Corriente (golpear primero).<br>• **Reptil:** Mordisco feroz (no se puede bloquear).<br>La evolución influye en qué técnicas pueden salir. |
| **Objetos de combate cómicos** | El Tamtam puede coger objetos de la habitación y lanzarlos: cuchara, almohada, maceta, mancuerna… Encaja con la casa. |
| **Estilo de entrenamiento** (como la mascota del dojo) | Al empezar en la Arena eliges escuela: **Garra** (fuerza), **Pluma** (agilidad) o **Rayo** (rapidez). Da una bonificación pequeña y permanente. |
| **Energía de Arena** | 5 combates al día con recarga, más 1 combate extra de consuelo tras 3 derrotas seguidas. Respeta el bienestar: no se puede combatir si el Tamtam está cansado o enfermo. |
| **Rival elegido para ti + retar por nombre** | Los 3 rivales del día (ya existen) más "**retar**" por código de amigo cuando haya servidor (Conectar). |
| **Ver repetición y "¡Revancha!"** | Repetición del combate (ya es determinista por semilla) y botón de revancha con un bonus de PC si ganas. |
| **Narración con personalidad** | Frases del combate y del resultado según la familia y lo que pasó: "¡Chispa ha chamuscado a Pirox!", "Mal día… mañana morderán ellos el polvo". |
| **Combate más legible** | Iconos de técnica al activarse, números de daño ya existentes, "¡Bloqueo!", "¡Contraataque!", "¡Robo!", ritmo con pausas y cámara que se acerca en los golpes críticos. |
| **Elementos (Drakomon)** | Ventajas entre familias (fuego > planta > agua > fuego…, metal > cristal > sombra > metal) con ±15%, mostradas antes de combatir. |
| **Insignias y líderes** | Un **líder por familia**: un rival especial semanal que da una insignia y una pieza cosmética. |
| **Maestro y alumnos** (futuro, con servidor) | Invitar con código: el maestro gana PC y XP extra con los combates de sus alumnos; hay regalos por número de alumnos. |

## 4. Prioridades propuestas (Arena)

| # | Qué | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | **Elegir 1 de 2** al subir de nivel en la Arena + **técnicas por familia** (9 × 2) | Muy alto | Medio |
| 2 | Narración, iconos de técnica, repetición y **revancha** | Alto | Bajo–medio |
| 3 | Energía de Arena (5/día) y combate de consuelo | Medio | Bajo |
| 4 | Ventajas entre familias + líderes semanales con insignias | Medio | Medio |
| 5 | Escuela de entrenamiento (Garra, Pluma, Rayo) y objetos cómicos | Medio | Medio |
| 6 | Maestro y alumnos (con el servidor de Conectar) | Alto (viral) | Alto |
