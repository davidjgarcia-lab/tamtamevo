# Tanda 2 — Referencias de cuidados y habitación (análisis y plan)

> Fuente: 4 apps Android (XAPK) enviadas el 2026-11-24. Se analizaron sus datos internos (configuración, textos,
> nombres de sistemas). **No se copia arte, código ni personajes**; solo mecánicas, que se rediseñan para TamTam EVO.

| Juego | Motor | Qué es | Qué se pudo leer |
|---|---|---|---|
| **My Boo** | LÖVE (Lua) | Mascota virtual clásica con varias habitaciones y 29 minijuegos | Constantes del juego (valores de cada acción), curva de nivel, 990 textos, notificaciones, gacha, jardín exterior y desbloqueos |
| **My Dragon** | Unity | Mascota virtual 3D (dragón) con decoración de habitación, AR y un minijuego de fusionar | Nombres de todos sus sistemas: felicidad por comer, jugar, dormir y aseo; estrellas de objetos; "problemas" de la mascota; champú por pasos; fotos; diseñador de habitación |
| **Magical Creatures** | Unity (ofuscado) | Clínica de criaturas mágicas: pociones de colores para curar pacientes | Sistemas: maná con recarga, pociones roja, azul, morada y amarilla, mejoras, libro de criaturas, limpiar el laboratorio, recompensa por paciente nuevo |
| **Drakomon** | Unity | RPG de monstruos: capturar, equipo, guardería, combate | Equipo, guardería, barra de hambre, "luchar o alimentar" (más útil para la tanda 3) |

## 1. Lo que hace cada uno (con datos)

### My Boo — el "manual" del cuidado clásico
- **Necesidades:** cariño (love), comida y energía, más estados de **sucio**, **enfermo** y **cacas**. Los umbrales para avisar son cariño < 10, comida < 11, energía < 10 o > 90.
- **Cada acción de cuidado paga** (valores reales de `GameConstants`):

| Acción | Cariño | Comida | Energía | Monedas | XP | Límite |
|---|---|---|---|---|---|---|
| Acariciar | +4 | — | — | 10 ± 2 | 8 | 8 seguidas, 5 s de espera |
| Jugar con juguete | +1 | −0,3 | −0,4 | 1 ± 1 | 4 | 40 |
| Ducha | +5 | — | — | 25 ± 15 | 20 | — |
| Recoger caca | — | — | — | 10 | 10 | — |
| Minijuego | +3 | −1,5 | −8 | según partida | ×2 | — |
| Árbol del jardín | — | — | −1,2 | fruta o monedas | 5 | cada 10 min |

- **Nivel del Boo del 1 al 60** (30 XP para el 2… 32.030 para el 60). Al subir, **desbloquea**:
  - objetos y minijuegos;
  - juguetes para la sala de juegos;
  - un **Boo nuevo**;
  - y **le crecen partes del cuerpo** ("¡Ganaste una cola!", "¡Ganaste alas!"), que se pueden cambiar o desactivar en la pantalla de estilo.
- **Multiplicador de XP por racha de acciones:**
  - escala de 8 niveles: con 10 acciones seguidas ×1,5… con 45 seguidas ×5;
  - XP por sesión repartida en 40% cariño, 30% comida y 30% energía.
- **Habitaciones separadas:** cocina (comer), baño (ducha y aseo), dormitorio (apagar la luz para dormir), sala de juegos (cuerda, pelota, saltarín) y **exterior** con fuente, árboles y vecinos.
- **Árboles:** cada 10 min sueltan **fruta (50%)** o **monedas (50%)**. Las frutas tienen rareza: manzana o cereza 20%… melón 2%.
- **Frases del Boo según lo que necesita** (7 variantes por estado) y **vecinos** que dan pistas. Ejemplos: "¡Hey! ¡Necesitas un baño!", "No te ves bien, toma tu remedio", "Vete a jugar a los minijuegos".
- **Notificaciones** por necesidad, con la voz de la mascota: "¿Boo bo? ¡Se te olvidó mi baño!".
- **Medicina** si está enfermo y **"Hongo mágico"** que sube un nivel.
- **Medallas por minijuego:** bronce, plata, oro y platino, con objetivos por juego.
- **Personalización:** suelo, alfombra, pared, decoración de pared y suelo, y paquetes; ropa y disfraces; colecciones de evento.
- **Gacha** con probabilidades y "probabilidad falsa" para fingir que casi tocó (**no lo copiaremos**). Además, ofertas del día y control parental.

### My Dragon — profundidad en cada acción
- **Felicidad = comer + jugar + dormir + aseo** (`HappinesFeed/Play/Sleep/Toilet`). Cada acción tiene su panel, su tutorial y sus **objetos con estrellas** (comida, juguete, cama, inodoro…).
- **Una cama mejor = dormir menos** (`SleepThreeStarsMinutes`): la calidad del mueble afecta al cuidado. También hay **poción de sueño** para acelerarlo.
- **Baño por pasos con herramientas:** jabón o champú → esponja (frotar hasta hacer espuma) → aclarar con la ducha (`ShampooEffectProgress`).
- **"Problemas" de la mascota** (`PetProblem`): cada cierto tiempo aparece un problema con temporizador que se resuelve con un **mini-reto**, y se puede acelerar.
- **Comportamientos con reacción:** rechaza si no tiene hambre, rascar la barriga, pose de crecimiento, pose de ropa y lamer la cámara.
- **Fotos automáticas o en modo foto al comer, dormir o jugar** (`PhotoWhenEat/Sleep/Play…`), con selfie y AR.
- **Diseñador de habitación:** comprar y colocar decoración, temas y **juguetes coleccionables** (garra, disco, avión…).
- **Meta:**
  - reto diario con calendario y cofre;
  - misiones diarias con cofres de progreso;
  - ruleta, hucha y pase de temporada;
  - minijuego de **fusionar objetos** para ganar monedas.

### Magical Creatures — curar como bucle de juego
- Llegan **pacientes** (unicornio, grifo, hidra, gólem, hombre lobo). Les das la **poción del color correcto**.
- Las pociones gastan **maná que se recarga con el tiempo**: hay 4 maná y 4 pociones, mejorables.
- **Libro de criaturas** (colección), **limpiar el laboratorio** (tarea con recompensa) y recompensa por cada paciente nuevo.

### Drakomon — monstruos en equipo
- Capturar monstruos, equipo activo y **guardería** para los demás, **barra de hambre** y decisión **"luchar o alimentar"**. Se analizará a fondo junto a la Arena (tanda 3).

## 2. Patrones que funcionan
1. **Cada cuidado se nota y se paga:** pequeñas monedas y XP por acariciar, bañar o recoger, con límite y espera para que no se abuse.
2. **El nivel desbloquea y transforma:** subir de nivel da cosas nuevas y **cambia el cuerpo**.
3. **Cada acción tiene su sitio:** habitaciones dedicadas y mueble con calidad (estrellas) que mejora el cuidado.
4. **Acciones táctiles por pasos:** enjabonar → frotar → aclarar → secar; arrastrar la comida a la boca.
5. **Pequeños problemas con temporizador** que invitan a volver (pinchos, nudos, enfermedad) y se resuelven tocando.
6. **La mascota habla:** frases según su necesidad y notificaciones con su voz.
7. **Exterior con recolección:** árbol con espera de 10 min que da comida o monedas.
8. **Colección:** libro de criaturas, juguetes, fotos y medallas.

## 3. Cómo lo llevamos a TamTam EVO

| Idea | Origen | Diseño TamTam EVO |
|---|---|---|
| **Cuidados que pagan** | My Boo | Acariciar +4 cariño, 8 Tc ± 2 (máx. 8 por tanda, 5 s de espera); baño completo 15–35 Tc; limpiar cada caca 6 Tc; todo da **XP de cuidador**. |
| **Baño táctil por pasos** | My Dragon | 1) Arrastras la **pastilla de jabón** sobre el Tamtam: aparece espuma donde frotas. 2) **Ducha**: frotas para aclarar. 3) **Toalla**: frotas para secar. Al terminar, brilla (Lustre). La higiene sube según cuánto lo hayas frotado. |
| **Comer arrastrando** | My Boo / My Dragon | Arrastras la comida desde la bandeja hasta la boca. Si no tiene hambre, **la rechaza** girando la cabeza. Su comida favorita da corazones. |
| **Nivel del Tamtam 1–60** | My Boo | Curva de XP propia; cada nivel desbloquea muebles, comidas, minijuegos, ranuras de Granja y **piezas cosméticas del cuerpo** (además de la evolución). |
| **Habitaciones** | My Boo | La casa-nido pasa a tener **cocina** (nevera y comida), **baño** (ducha y arenero), **dormitorio** (cama e interruptor de luz) y **sala de juegos** (juguetes). Se pasa de una a otra deslizando. |
| **Calidad de muebles (estrellas)** | My Dragon | Cama 1–3★: el sueño recupera más rápido. Arenero: menos cacas en el suelo. Juguetes: más diversión. |
| **Arenero / aseo** | My Dragon | Si hay arenero, el Tamtam lo usa a veces y no ensucia el suelo. Hay que limpiarlo. |
| **Problemas del Tamtam** | My Dragon / Magical Creatures | Cada 3–6 h puede aparecer uno, con temporizador (por ejemplo 2 h), y se resuelve con un reto táctil corto:<br>• **espina en la pata**: tirar con el dedo;<br>• **ceniza en la cresta**: soplar o frotar;<br>• **resfriado**: mezclar una poción;<br>• **nudo de lianas**: desenredar.<br>Si no lo atiendes, baja la higiene o la felicidad (nunca muere). |
| **Enfermedad y pociones** | My Boo / Magical Creatures | Higiene < 15 o hambre < 15 durante horas → **enfermo**. Se cura con una poción que se **prepara**: elegir 2–3 ingredientes del color de su familia, con un toque de minijuego. |
| **El Tamtam habla** | My Boo | Bocadillos con 5–7 frases por estado (hambre, sucio, aburrido, cansado, enfermo, feliz) y notificaciones con su voz ("¡Eh! ¡Se te olvidó mi baño!"). |
| **Jardín / exterior** | My Boo | En la **Granja** (o en el exterior de la casa), un **árbol de bayas** que cada 10 min da fruta (comida, con rarezas) o Tamcoins. |
| **Fotos** | My Dragon | Modo foto: captura al Tamtam comiendo, durmiendo o jugando → **álbum** (y compartir más adelante). |
| **Juguetes** | My Boo / My Dragon | Pelota, cuerda y saltarín colocables: el Tamtam juega solo con ellos (sube Actividad un poco) y tú puedes lanzarle la pelota. |
| **Medallas por minijuego** | My Boo | Bronce, plata, oro y platino por puntuación objetivo (encaja con las estrellas de la tanda 1). |
| **Bestiario** | Magical Creatures | Libro con las formas, familias y mutaciones descubiertas por tus Tamtams. |
| **Ropa y accesorios** | My Boo / My Dragon | Sombreros, bufandas y capas que se enganchan a los huesos de la cabeza y el cuello. |
| **Lo que NO copiamos** | — | Probabilidades falsas en la gacha, anuncios obligatorios para cuidar y ofertas agresivas. |

## 4. Prioridades propuestas (cuidados)

| # | Qué | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | **Baño táctil por pasos** + comer arrastrando + rechazo si está lleno | Alto (es lo que más se toca) | Medio |
| 2 | **Cuidados que pagan + XP de cuidador + nivel 1–60** con desbloqueos | Alto (bucle de progreso) | Medio |
| 3 | **Problemas del Tamtam** con temporizador y retos táctiles; enfermedad y pociones | Alto (motivo para volver) | Medio |
| 4 | **Bocadillos y frases** por necesidad (y textos de notificaciones) | Medio | Bajo |
| 5 | **Habitaciones** (cocina, baño, dormitorio, sala de juegos) con interruptor de luz | Alto | Alto |
| 6 | Calidad de muebles (estrellas), arenero y juguetes | Medio | Medio |
| 7 | Árbol de bayas, fotos, bestiario, ropa | Medio | Medio |
