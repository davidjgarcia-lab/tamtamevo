# Tanda 1 — Referencias de minijuegos (análisis y plan)

> Fuente: 4 apps Android (XAPK) enviadas por el usuario el 2026-11-24. Se analizaron sus datos internos (niveles,
> configuración, nombres de sistemas y textos de interfaz), **sin copiar arte, código, niveles ni personajes**: solo
> mecánicas y patrones de diseño, que se rediseñan para TamTam EVO.

| Juego | Motor | Género | Qué se pudo leer |
|---|---|---|---|
| **One More Brick** | libGDX + Box2D | "Ballz": apuntar y disparar muchas bolas contra bloques con vida | 161 desafíos JSON completos, potenciadores, 25 sonidos |
| **Break Bricks** | Cocos2d-JS + Chipmunk | Rompeladrillos clásico con pala | Configuración de niveles, ruleta, cofres, tareas, tienda, aspectos y todos los textos |
| **Meowdoku** | Godot 4 | Puzle lógico tipo "reinas": 1 gato por fila, columna y región de color | ~200 ajustes de pruebas A/B, módulos, bancos de niveles por tamaño y textos |
| **Snake.io** | Unity (IL2CPP) | Serpiente multijugador .io | 300 paquetes de contenido y nombres de sistemas: potenciadores, bots, revivir, zonas, jefe, misiones |

## 1. Lo que hace cada uno y por qué engancha

### One More Brick — "un tiro más"
- **Bucle:** apuntas una vez y sale una ráfaga de N bolas que rebotan. Los bloques muestran su **vida en número** y bajan una fila por turno; pierdes si llegan abajo.
- **Desafíos (datos reales):** cuadrícula de **9 columnas × ~7 filas**, con `sh` (tiros disponibles), `ba` (bolas), `ix` (columna de salida) y bloques con `hp` y forma.
  - 7 formas: cuadrado, 4 triángulos (desvían la bola), círculo y otra más.
  - Por categoría: intro (≈20 bloques, vida media 29) → fácil 71 → muy difícil (vida máx. 500) → épico (vida máx. 800).
  - Hay categorías temáticas: *boom* (explosivos), *bonus* y *secret*.
- **11 potenciadores en el tablero:** bola extra (el más común, 586 apariciones), calavera (447, hay que eliminarla), láser vertical y horizontal, duplicar bola, fantasma (atraviesa), dispersión, bola potente, encoger, bomba y expandir.
- **Por qué funciona:** un solo gesto de habilidad (el ángulo) seguido de un caos satisfactorio. Ver la vida bajar en número da progreso visible, cada ráfaga trae el "uno más" y los rebotes en triángulos dan jugadas épicas.

### Break Bricks — pala + "romper el dibujo"
- **Bucle:** tocas para lanzar y deslizas para mover la pala. Cada nivel es un **dibujo pixel-art hecho de ladrillos**: el jugador quiere "destapar" la imagen.
- **Datos:** cada nivel tiene un número de bolas (`b`) y un **tiempo para 3 estrellas** (60–90 s).
  - Rejilla de 30×30 a 50×50 celdas; bloques con color y dureza.
  - Hay obstáculos.
- **Modos de desafío desbloqueables:** Normal, Bomba (si te alcanza, mueres), Tiempo, Relax y Láser, que se abren en los niveles 15/18/21/24/27.
- **Ayudas:**
  - "Dividir bolas ×4" y "+3 bolas".
  - **Guía de apuntado** (línea de trayectoria).
  - **Súper pala**, una barrera que evita perder la bola.
- **Sistemas de enganche:**
  - Ruleta diaria con probabilidades (35% 20 diamantes, 4% 100…).
  - Cofres con llaves, voltear 2 cartas y bonus de 7 días ("3 días seguidos" da un aspecto).
  - Tareas diarias (completar 10 niveles, 1 desafío, usar 3 objetos), aspectos de bola y pala, y eventos de temporada con puntos.
- **Lo que NO queremos:** el abuso de anuncios ("mira un anuncio para…" en casi todo).

### Meowdoku — puzle lógico con mascotas
- **Regla:** colocar un gato por fila, por columna y por región de color, sin que se toquen. Tamaños de **4×4 a 12×12**, con bancos de niveles ordenados por "ritmo" (dificultad progresiva) y estilos de tablero.
- **Lo más valioso son sus ajustes A/B**, porque muestran lo que retiene. Los nombres de configuración son reales:
  - **Retroalimentación positiva constante:**
    - frases de ánimo por rendimiento: "¡0 errores!", "Mejor que 9 de cada 10", "¿Tan rápido?";
    - combos con texto y voz; vibración en combo;
    - reacción del gato al acertar o fallar;
    - ánimo al ir progresando;
    - "estuviste cerca" al casi perder.
  - **Errores que no frustran:** vidas por partida con aviso de "te queda una", deshacer, pistas (gratis X al día), protección contra doble toque y autocompletar el final.
  - **Dificultad adaptativa (DDA):**
    - la primera partida del día es más fácil;
    - el ranking calcula el nivel del jugador;
    - los rivales del ranking son **simulados** (bots con nombres localizados, "impulso" y "acoso" al jugador).
  - **Rachas diarias:**
    - calendario y regalo por racha;
    - **protección de racha** y "revivir racha";
    - mensajes de vuelta ("¡Los gatos te extrañan!") y recompensa por volver tras días fuera.
  - **Colección:** "Diario de puzles": cada nivel da una pieza y las piezas completan ilustraciones. También hay "Pez dorado", un bonus raro que permite saltar o premiar.
  - **Modos especiales desbloqueables:** desafío de colores, modo "a ciegas" (blind mod) y mezcla de tamaños.

### Snake.io — crecer, esquivar, dominar
- **Bucle:** comer bolitas para crecer y hacer que otros choquen con tu cuerpo. **Velocidad constante con acelerón** a costa de masa.
- **Potenciadores (bolitas especiales):** crecimiento, invencibilidad, imán (radio de absorción), velocidad, empezar grande, alejar cámara y bolitas "errantes" que huyen. También hay un "cubo de potenciadores" con probabilidades configurables.
- **Bots con perfiles (`AISnakeProfileConfigs`):**
  - nivel de agresividad;
  - deciden si ir a portales de potenciador o a zonas de muerte;
  - la puntuación media de los bots se calibra con la de jugadores reales;
  - **los principiantes están protegidos** (`BotProtect`, empezar grande e invencible las primeras partidas).
- **Zonas y jefes:**
  - zonas de captura;
  - zonas de muerte que se cargan;
  - **jefe "Parca"** al que se puede matar, con barra de vida y aviso, y recompensa;
  - modo desafío diario con jefe.
- **Revivir:** normal o **"revivir más grande"**, conservando la puntuación.
- **Meta:**
  - misiones diarias e iniciales y pase de temporada;
  - eventos con ranking propio;
  - aspectos + accesorios (sombrero, capa, alas, espalda) y emotes.

## 2. Patrones comunes (lo que "a la gente más le gusta")
1. **Un gesto, mucha respuesta:** un toque o un deslizamiento desencadena física vistosa (rebotes, cadenas, explosiones).
2. **Números que bajan y barras que suben:** vida de los bloques, progreso del nivel, estrellas por tiempo.
3. **"Casi lo tengo" → reintentar:** revivir, "te queda una vida", "estuviste cerca", partidas cortas (30–120 s).
4. **Elogio específico:** no "¡bien!", sino *por qué* fue bien (0 errores, rápido, mejor que el 90%).
5. **Dificultad que se adapta:** primera partida del día fácil, protección del principiante, bots calibrados.
6. **Variedad sin aprender reglas nuevas:** el mismo juego con modificadores (bomba, tiempo, láser, a ciegas, tamaños).
7. **Colección y rachas:** piezas que completan un dibujo, calendario de racha con protección, aspectos.
8. **Rivales "vivos":** ranking con rivales que suben y bajan cerca de ti.

## 3. Cómo lo llevamos a TamTam EVO

Principio: **el minijuego es una actividad del Tamtam, no un juego aparte.** El Tamtam aparece, reacciona y crece con ello; no copiamos sistemas de monetización agresivos.

### 3.1 Rediseño de los 4 minijuegos (siguen siendo solo iconos, D9)

| Nuestro minijuego | Se inspira en | Rediseño |
|---|---|---|
| **Ladrillos** (`bricks`) | One More Brick + Break Bricks | Pasa a **"lanzar ascuas"**: el Tamtam, abajo, apunta y lanza una ráfaga de N ascuas (N crece con el nivel del Tamtam). Bloques de roca con **vida en número** y formas (cuadrado, triángulos, círculo) que bajan por turnos. Potenciadores: +1 ascua, rayo horizontal/vertical, duplicar, atravesar y bomba. Guía de trayectoria corta. Modos desbloqueables: bomba y contrarreloj. Al limpiar, se descubre **un dibujo** (paisaje de la familia del Tamtam). |
| **Cuadrícula** (`grid`) | Meowdoku | Pasa a **"un Tamtam por fila, columna y región"** (colocar emblemas o mini-Tamtams sin que se toquen). Tamaños de 4×4 a 8×8; niveles generados con solución única; 3 vidas por puzle, deshacer y 1 pista gratis al día. Elogios con motivo ("¡0 errores!", "¡En 40 s!"). |
| **Estela** (`trail`) | Snake.io | **Velocidad constante + acelerón** que gasta longitud. Bots con 3 perfiles (tímido, glotón, agresivo). Bolitas especiales: imán, escudo (invencible 5 s), crecer y velocidad. Jefe ocasional ("Sombra"), revivir una vez por partida y protección del principiante (los rivales son más lentos las primeras partidas). |
| **Laberinto** (`maze`) | Patrones generales | Estrellas por tiempo, objetos a recoger (llaves → cofre), niebla en modo difícil. |

### 3.2 Capa común para todos los minijuegos
- **Efecto en el Tamtam (ya existe y se refuerza):** Felicidad y Actividad suben según la calidad de la partida. El Tamtam **anima desde un lado de la pantalla**: celebra los combos y se pone nervioso cuando "casi" pierdes. Da XP de atributo: ladrillos y estela → Agilidad/Fuerza; cuadrícula y laberinto → Inteligencia.
- **Estrellas** (1–3) por objetivo: tiempo, errores y combos.
- **Elogios específicos** al terminar: un banco de frases ligadas a métricas reales.
- **Racha de juego diaria:** calendario de 7 días con regalo (comida o mueble) y **protección de racha** (1 a la semana, gratis).
- **Primera partida del día más fácil** y dificultad adaptativa suave según tus últimas 5 partidas.
- **Colección "Álbum de paisajes":** cada partida con 3 estrellas da una pieza, y las piezas completan los cuadros de paisajes para la casa. Así se conecta con la decoración.
- **Rivales de ranking simulados** por minijuego (bots con nombres de Tamtams), hasta que exista el servidor de Conectar.
- **Sin anuncios forzados:** revivir o pista extra se pagan con Tamcoins o con la racha, nunca con anuncios obligatorios.

## 4. Prioridades propuestas

| # | Qué | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Capa común: estrellas, elogios específicos, Tamtam animando, racha diaria con protección | Alto (vale para los 4) | Medio |
| 2 | **Ladrillos → lanzar ascuas** (estilo "ballz") con potenciadores | Alto | Medio |
| 3 | **Cuadrícula → un Tamtam por fila, columna y región** con generador de solución única | Alto | Medio |
| 4 | **Estela** con acelerón, bots con perfiles, potenciadores y revivir | Medio | Medio |
| 5 | Álbum de paisajes (colección) y rivales simulados | Medio | Bajo–medio |
| 6 | Laberinto con estrellas, llaves y niebla | Bajo | Bajo |
