# CREATURE DATABASE — Tam Tam Evo

> Versión 0.2 · Fase 1 · Estado: **aprobado** (decisiones D1–D10, 2026-11-19)
> Fuente de verdad para el diseño de criaturas. Los datos de este documento se trasladarán a `packages/content` (TypeScript + validación Zod) en la Fase 4.

---

## 0. Convenciones

### 0.1 Identificadores
`{elemento}_{etapa}_{nombre}`, en minúsculas y sin acentos. Ejemplo: `fire_adult_volcaurio`.
Etapas: `baby`, `child`, `juvenile`, `adult`. Los IDs **nunca se reutilizan** aunque una criatura se retire del juego.

### 0.2 Estructura por familia (lanzamiento)
```
Bebé ──► Infantil ──► Juvenil ──┬──► Adulto A   (rama "estructural")
                                └──► Adulto B   (rama "expresiva")
                                └··► Adulto S   (rama secreta, temporadas futuras)
```
8 familias × (1+1+1+2) = **40 formas** en el lanzamiento. Las ramas secretas (S) y las híbridas entre familias están reservadas en el esquema de datos (ver EVOLUTION_SYSTEM §8).

### 0.3 Estadísticas
| Stat | Abrev. | Efecto en combate |
|------|--------|-------------------|
| Vida | VID | Puntos de vida. |
| Fuerza | FUE | Escala el daño de ataques y habilidades ofensivas. |
| Defensa | DEF | Reduce el daño recibido: `100/(100+DEF)`. |
| Velocidad | VEL | Frecuencia de acción, desplazamiento y esquiva. |
| Energía | ENE | Reserva y regeneración para habilidades. |
| Crítico | CRI | Probabilidad crítica = `5% + CRI/4 %`, con un máximo del 35%. |

Cálculo de la estadística final (detalle en GAMEPLAY_SYSTEMS §5.3):
`stat = round( base_forma × (0.4 + 0.012 × nivel) × (1 + potencial/60) ) + bonus_entrenamiento + bonus_equipo`
(nivel máximo 50 en el MVP; el potencial genético va de 0 a 15 por stat).

Las formas pre-adultas usan el perfil Juvenil de su familia multiplicado por **×0.55 (Bebé)**, **×0.75 (Infantil)** y **×1.0 (Juvenil)**. Todos los adultos suman **515** puntos base: el equilibrio se consigue con la distribución, no con el total.

### 0.4 Afinidades elementales
Pentágono: **Fuego → Naturaleza → Tierra → Electricidad → Agua → Fuego** (cada uno vence al siguiente).
Dualidad: **Luz ⇄ Oscuridad** (cada una es fuerte contra la otra: combates de alto riesgo).
**Cosmos**: fuerte contra Luz y Oscuridad; resiste Cosmos. Neutral con el pentágono.

| Atacante ↓ / Defensor → | Fue | Agu | Nat | Ele | Osc | Luz | Tie | Cos |
|---|---|---|---|---|---|---|---|---|
| **Fuego** | 0.8 | 0.8 | **1.25** | 1 | 1 | 1 | 1 | 1 |
| **Agua** | **1.25** | 0.8 | 1 | 0.8 | 1 | 1 | 1 | 1 |
| **Naturaleza** | 0.8 | 1 | 0.8 | 1 | 1 | 1 | **1.25** | 1 |
| **Electricidad** | 1 | **1.25** | 1 | 0.8 | 1 | 1 | 0.8 | 1 |
| **Oscuridad** | 1 | 1 | 1 | 1 | 0.8 | **1.25** | 1 | 0.8 |
| **Luz** | 1 | 1 | 1 | 1 | **1.25** | 0.8 | 1 | 0.8 |
| **Tierra** | 1 | 1 | 0.8 | **1.25** | 1 | 1 | 0.8 | 1 |
| **Cosmos** | 1 | 1 | 1 | 1 | **1.2** | **1.2** | 1 | 0.8 |

La afinidad **secundaria** (heredada, ver EVOLUTION_SYSTEM §6) añade ±5% de resistencia y desbloquea ramas híbridas futuras.

### 0.5 Ejes de comportamiento (usados por la evolución)
**FUE**rza · **AGI**lidad · **ING**enio · **VÍN**culo · **SER**enidad. Ver EVOLUTION_SYSTEM §3.

---

## 1. BRASÁLIDOS — Familia de Fuego 🔶 *(insignia: llama de tres lenguas)*

**Historia.** Nacieron en la Isla Fragua, donde el Tam-Tam late bajo un volcán dormido. Los antiguos Cuidadores los usaban para mantener viva la hoguera comunal durante los inviernos largos.
**Personalidad.** Impulsivos, cariñosos y celosos. Se enfadan rápido y se les pasa enseguida. Les encanta ser el centro de atención.
**Rasgos físicos comunes.** Cuerpo redondeado, de cálido a incandescente; una **cresta de llama** que cambia de tamaño con el ánimo; ojos ámbar con pupila vertical; ascuas que flotan a su alrededor.
**Hábitat.** Cueva de roca basáltica con ríos de lava lejanos, braseros y cristales de obsidiana.
**Necesidades especiales.** Hambre +20% más rápida. Les gusta la comida picante y asada. **Odian el baño** (higiene menos frecuente, pero el baño les causa un breve enfado si su Vínculo es bajo). Si se les ignora más de 6 h, la cresta se apaga (señal visual).
**Animaciones distintivas.** La cresta crece al comer; estornudo de chispas; "berrinche" en el que pisotean y sueltan humo; duermen enroscados como una brasa.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `fire_baby_chispin` | **Chispín** | Bolita lisa con dos patitas y una sola llama en la cabeza. Silueta: gota invertida. |
| Infantil | `fire_child_fogarin` | **Fogarín** | Bípedo rechoncho, cola corta con punta de fuego, cresta de 3 lenguas y pequeños colmillos. |
| Juvenil | `fire_juvenile_brasko` | **Brasko** | Cuadrúpedo ágil de lomo agrietado con brillo interior y melena de llamas que le recorre la espalda. Primeros cuernos. |
| Adulto A | `fire_adult_volcaurio` | **Volcaurio** | **Toro-volcán** colosal. Lomo convertido en cono volcánico humeante, cuernos de obsidiana, grietas de magma pulsantes y pezuñas que dejan brasas. Silueta: montaña con cuernos. |
| Adulto B | `fire_adult_fenixara` | **Fenixara** | **Serpiente-ave danzante**: cuerpo largo y sinuoso con cuatro alas de cinta de fuego y cola de plumas que dibujan arcos. Flota. Silueta: espiral vertical. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_fire_bite` | Mordisco Ardiente | Básico | Cuerpo a cuerpo | 0 | — | Daño 100% FUE. |
| `sk_fire_ember` | Lluvia de Ascuas | Infantil | Distancia | 25 | 6 s | 3 proyectiles de 45%, cada uno con un 20% de probabilidad de **Quemadura**. |
| `sk_fire_tantrum` | Berrinche | Juvenil | Buff | 20 | 12 s | +25% FUE y −10% DEF durante 5 s. |
| `sk_fire_eruption` | Erupción | Volcaurio | Área | 50 | 16 s | 220% de daño y **Aturdido** 1 s. |
| `ps_fire_magmahide` | Piel de Magma | Volcaurio (pasiva) | Pasiva | — | — | Quien le golpee cuerpo a cuerpo recibe un 8% de daño reflejado como fuego. |
| `sk_fire_phoenixdance` | Danza Fénix | Fenixara | Movilidad/ataque | 40 | 10 s | Embiste 3 veces con 70% cada una; esquiva garantizada durante la danza. |
| `ps_fire_rebirth` | Renacer de Ceniza | Fenixara (pasiva) | Pasiva | — | — | Una vez por combate, al caer por debajo del 15% de VID, recupera el 30%. |

**Estadísticas base.**
| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Brasko (Juvenil) | 85 | 90 | 65 | 75 | 60 | 45 |
| Volcaurio | 130 | 120 | 100 | 55 | 70 | 40 |
| Fenixara | 90 | 105 | 65 | 120 | 85 | 50 |

**Árbol y tendencias.** Volcaurio ← FUE + SER (entrenamiento de fuerza, rutina, Arena). Fenixara ← AGI + VÍN (minijuegos de reflejos, juego, caricias). Objetos: *Piedra Magma* → Volcaurio, *Pluma Cenicienta* → Fenixara.

---

## 2. MARÉLIDOS — Familia de Agua 🔷 *(insignia: ola en espiral)*

**Historia.** Descienden de las mareas que rodean la Isla Caracola. Se dice que cada Marélido guarda en su interior el sonido del primer océano.
**Personalidad.** Tranquilos, curiosos y algo despistados. Se ríen con burbujas. Son leales, pero necesitan su espacio.
**Rasgos físicos comunes.** Piel translúcida y brillante, aletas-oreja, **burbujas que flotan alrededor**, ojos grandes y húmedos, patrones de escamas iridiscentes.
**Hábitat.** Laguna de arrecife con corales, cascada, nenúfares y luz cáustica en el suelo.
**Necesidades especiales.** Higiene: **disfrutan del baño** (doble felicidad). Si pasan 8 h sin agua (baño o charco), se "resecan": expresión apagada y menos felicidad. Prefieren comida fresca y fría.
**Animaciones distintivas.** Chapoteo de alegría, sueño flotando dentro de una burbuja, estornudo de espuma, ondulación de aletas al caminar.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `water_baby_gotin` | **Gotín** | Renacuajo-gota con una aleta en la cola y ojos enormes. |
| Infantil | `water_child_burbuy` | **Burbuy** | Nutria-ajolote con branquias plumosas y cola plana; siempre lleva una burbuja en la boca. |
| Juvenil | `water_juvenile_ondrel` | **Ondrel** | Lagarto acuático esbelto con aletas dorsales en ola y bigotes largos. |
| Adulto A | `water_adult_mareon` | **Mareón** | **Tortuga-leviatán** con un caparazón que es un arrecife vivo (corales, peces diminutos que orbitan), aletas enormes y mandíbula ancha. Silueta: isla con cabeza. |
| Adulto B | `water_adult_velamar` | **Velamar** | **Medusa-sirena** flotante: campana translúcida a modo de capucha, torso grácil, decenas de tentáculos luminosos que ondean y núcleo que brilla según la energía. Silueta: campana con cortina. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_water_splash` | Salpicón | Básico | Distancia corta | 0 | — | Daño 90% FUE. |
| `sk_water_bubble` | Burbuja Escudo | Infantil | Defensa | 25 | 10 s | Escudo del 20% de la VID máx. durante 4 s. |
| `sk_water_jet` | Chorro a Presión | Juvenil | Distancia | 30 | 7 s | 140% de daño, empuja al rival y aplica **Empapado**. |
| `sk_water_tidalwall` | Muro de Marea | Mareón | Defensa/área | 45 | 15 s | Reduce el daño recibido un 40% durante 4 s y devuelve el 50% de lo absorbido al expirar. |
| `ps_water_reef` | Arrecife Vivo | Mareón (pasiva) | Pasiva | — | — | Regenera un 1% de VID cada 2 s. |
| `sk_water_stinglight` | Aguijón Lumínico | Velamar | Distancia | 35 | 8 s | 4 golpes de 40% con un 25% de probabilidad de **Aturdido** breve (0.4 s). |
| `ps_water_tides` | Corriente Interna | Velamar (pasiva) | Pasiva | — | — | Regeneración de ENE +30%. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Ondrel (Juvenil) | 95 | 70 | 80 | 65 | 80 | 30 |
| Mareón | 150 | 80 | 125 | 45 | 80 | 35 |
| Velamar | 95 | 75 | 80 | 90 | 130 | 45 |

**Tendencias.** Mareón ← SER + FUE. Velamar ← ING + VÍN. Objetos: *Concha Abisal* → Mareón, *Perla Lunar* → Velamar.

---

## 3. BROTÁLIDOS — Familia de Naturaleza 🟢 *(insignia: brote de tres hojas)*

**Historia.** Germinaron en la Isla Verdal, alrededor del Árbol-Tambor, cuyas raíces laten al ritmo del Tam-Tam. Hacen que todo crezca donde duermen.
**Personalidad.** Pacientes, juguetones y protectores. Les encantan las rutinas y se ponen nerviosos con los cambios bruscos.
**Rasgos físicos comunes.** Piel de corteza suave o musgo; **hojas y flores que brotan del cuerpo según la estación del año real**; ojos verdes con destellos dorados.
**Hábitat.** Claro de bosque con setas gigantes, luciérnagas, un riachuelo y hojas que caen.
**Necesidades especiales.** Necesitan "sol" (actividad de día) y **Descanso** regular. Penalización suave si duermen menos de 6 h. Comida: frutas y néctar; no les gusta la carne.
**Animaciones distintivas.** Fotosíntesis (cierra los ojos al sol y le salen hojas), sacudirse como un perro soltando pétalos, dormir enraizado.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `nature_baby_brotin` | **Brotín** | Semilla con carita y un brote doble en la cabeza; se balancea al andar. |
| Infantil | `nature_child_hojarin` | **Hojarín** | Cervatillo-hoja con orejas de hoja grande y cola de helecho enrollado. |
| Juvenil | `nature_juvenile_ramaje` | **Ramaje** | Cuadrúpedo ágil con astas de ramas jóvenes, musgo en el lomo y flores en la cola. |
| Adulto A | `nature_adult_robledon` | **Robledón** | **Alce-roble guardián**: cuerpo macizo de corteza, astas que son la copa de un árbol con nidos y pájaros, y raíces en las patas. Silueta: árbol que camina. |
| Adulto B | `nature_adult_floriska` | **Floriska** | **Mantis-orquídea**: bípeda esbelta, guadañas de pétalo, alas de flor plegadas y cabeza triangular con ojos de rocío. Silueta: flor erguida con hojas-cuchilla. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_nature_vinewhip` | Látigo de Liana | Básico | Alcance medio | 0 | — | 95% FUE. |
| `sk_nature_pollen` | Polen Calmante | Infantil | Debuff | 20 | 9 s | −20% VEL al rival durante 4 s. |
| `sk_nature_roots` | Raíces Atrapantes | Juvenil | Control | 30 | 11 s | **Enraizado** 1.5 s y daño de 60%. |
| `sk_nature_canopy` | Bóveda Ancestral | Robledón | Curación | 45 | 14 s | Cura el 25% de la VID máx. y otorga +20% DEF durante 5 s. |
| `ps_nature_bark` | Corteza Milenaria | Robledón (pasiva) | Pasiva | — | — | Inmune a Aturdido la primera vez de cada combate. |
| `sk_nature_petalscythe` | Guadaña de Pétalo | Floriska | Cuerpo a cuerpo | 30 | 6 s | 160% de daño y +30% de probabilidad crítica en este golpe. |
| `ps_nature_ambush` | Emboscada Floral | Floriska (pasiva) | Pasiva | — | — | El primer ataque del combate es crítico garantizado. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Ramaje (Juvenil) | 90 | 80 | 75 | 70 | 65 | 40 |
| Robledón | 145 | 95 | 120 | 40 | 75 | 40 |
| Floriska | 80 | 115 | 60 | 125 | 70 | 65 |

**Tendencias.** Robledón ← SER + VÍN. Floriska ← AGI + FUE. Objetos: *Bellota Ancestral* → Robledón, *Néctar Afilado* → Floriska.

---

## 4. VOLTÍIDOS — Familia de Electricidad 🟡 *(insignia: rayo en zigzag doble)*

**Historia.** Cayeron sobre la Isla Tronada durante una tormenta que duró cien días. Viven en las torres de cobre que dejaron Cuidadores ancestrales.
**Personalidad.** Hiperactivos, bromistas y con poca paciencia. Coleccionan objetos brillantes.
**Rasgos físicos comunes.** Pelaje esponjoso **que se eriza con estática** según el ánimo; antenas o bigotes con chispas; ojos tipo LED; marcas en zigzag.
**Hábitat.** Azotea de un taller con bobinas Tesla, nubes de tormenta pequeñas y luces de guirnalda.
**Necesidades especiales.** **Actividad** decae el doble de rápido. Si están aburridos, hacen travesuras (tiran una decoración, que vuelve a su sitio al tocarla). Comida: "baterías" de fruta cítrica y comida crujiente.
**Animaciones distintivas.** Electrizarse al acariciarlos a contrapelo (gracioso y sin daño), carreras cortas, dormir con chispas tipo ronquido.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `electric_baby_zumbi` | **Zumbi** | Bola de pelusa con dos antenas que chisporrotean y patitas invisibles bajo el pelo. |
| Infantil | `electric_child_voltin` | **Voltín** | Ardilla-hurón con cola en forma de rayo y orejas puntiagudas. |
| Juvenil | `electric_juvenile_dinamix` | **Dinamix** | Felino largo con aletas de membrana entre las patas (planea), cola-bobina y crin de chispas. |
| Adulto A | `electric_adult_truenarca` | **Truenarca** | **Dragón-cometa de tormenta**: cuerpo largo y delgado, alas como velas de nube con relámpagos internos y cola de cinta. Vuela siempre. Silueta: cometa de papel con cabeza de dragón. |
| Adulto B | `electric_adult_amperix` | **Ampérix** | **Escarabajo-bobina acorazado**: caparazón segmentado con bobinas de cobre, tenazas de condensador y cuernos-electrodo que forman un arco. Silueta: tanque compacto con cuerno doble. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_elec_zap` | Chispazo | Básico | Distancia | 0 | — | 85% FUE; ataca un 15% más rápido que otros básicos. |
| `sk_elec_static` | Carga Estática | Infantil | Buff | 20 | 10 s | Los 3 próximos básicos aplican **Aturdido** 0.3 s con un 30% de probabilidad. |
| `sk_elec_dash` | Relámpago Veloz | Juvenil | Movilidad | 25 | 7 s | Teletransporte detrás del rival y golpe de 110%. |
| `sk_elec_stormcall` | Llamada de Tormenta | Truenarca | Área | 50 | 15 s | 5 rayos en 2 s, cada uno de 60%. |
| `ps_elec_skyborne` | Nacido del Cielo | Truenarca (pasiva) | Pasiva | — | — | +10% de esquiva frente a ataques cuerpo a cuerpo. |
| `sk_elec_overload` | Sobrecarga | Ampérix | Cuerpo a cuerpo | 40 | 12 s | Carga 1 s y golpea con un 260%; si es crítico, recupera 20 ENE. |
| `ps_elec_capacitor` | Condensador | Ampérix (pasiva) | Pasiva | — | — | Cada golpe recibido otorga +3 ENE. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Dinamix (Juvenil) | 75 | 85 | 60 | 95 | 70 | 45 |
| Truenarca | 90 | 100 | 65 | 130 | 90 | 40 |
| Ampérix | 100 | 125 | 95 | 70 | 55 | 70 |

**Tendencias.** Truenarca ← AGI + ING. Ampérix ← FUE + ING. Objetos: *Núcleo Nimbo* → Truenarca, *Bobina de Cobre Viejo* → Ampérix.

---

## 5. UMBRÁLIDOS — Familia de Oscuridad 🟣 *(insignia: luna creciente con ojo)*

**Historia.** Nacen en la cara nocturna de la Isla Penumbra, donde nunca amanece del todo. Los Cuidadores antiguos creían que se alimentan de las pesadillas y dejan solo sueños tranquilos.
**Personalidad.** Tímidos, misteriosos e intensamente leales una vez que confían. De noche son traviesos y de día, perezosos.
**Rasgos físicos comunes.** Cuerpo de humo denso con bordes que se difuminan; **ojos brillantes como única fuente de luz**; motas que parecen estrellas apagadas; forma ligeramente cambiante.
**Hábitat.** Bosque nocturno de árboles violetas, setas bioluminiscentes, niebla baja y luna enorme.
**Necesidades especiales.** **Ritmo invertido**: más activos de noche (hora local) y duermen mejor de día. **Cariño** decae más rápido (necesitan atención); si se les asusta con acciones bruscas, se esconden.
**Animaciones distintivas.** Esconderse fundiéndose con su sombra, asomar solo los ojos, sonrisa que aparece en la oscuridad, dormir boca abajo como un murciélago.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `dark_baby_sombrin` | **Sombrín** | Nubecita de humo oscuro con dos ojos enormes y una cola de vapor. |
| Infantil | `dark_child_penumbri` | **Penumbri** | Gatito-murciélago con orejas-ala y cuerpo de humo que deja estela. |
| Juvenil | `dark_juvenile_noctaro` | **Noctaro** | Zorro de sombra con tres colas de humo y una máscara de hueso lunar. |
| Adulto A | `dark_adult_eclipsor` | **Eclipsor** | **Polilla-señor del eclipse**: alas inmensas con un eclipse dibujado (anillo de luz alrededor de un disco negro), antenas plumosas y cuerpo afelpado oscuro. Silueta: mariposa gigante con círculo central. |
| Adulto B | `dark_adult_umbralobo` | **Umbralobo** | **Lobo de vacío**: lobo enorme con zonas del cuerpo que son "agujeros" al cielo estrellado, melena de humo y garras de sombra que se estiran. Silueta: lobo aullante con huecos. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_dark_claw` | Zarpa Umbría | Básico | Cuerpo a cuerpo | 0 | — | 100% FUE. |
| `sk_dark_fade` | Desvanecer | Infantil | Defensa | 20 | 10 s | Esquiva garantizada durante 1.5 s. |
| `sk_dark_fear` | Mirada Abisal | Juvenil | Debuff | 30 | 12 s | **Miedo**: el rival retrocede y no ataca durante 1.2 s. |
| `sk_dark_eclipse` | Eclipse Total | Eclipsor | Debuff/área | 50 | 18 s | **Ceguera** 3 s (−40% de precisión) y −20% FUE al rival. |
| `ps_dark_dust` | Polvo Somnífero | Eclipsor (pasiva) | Pasiva | — | — | Al recibir un golpe, 10% de probabilidad de reducir la VEL del atacante. |
| `sk_dark_devour` | Devorar Estrellas | Umbralobo | Cuerpo a cuerpo | 35 | 8 s | 150% de daño; se cura el 50% del daño causado. |
| `ps_dark_packless` | Lobo Solitario | Umbralobo (pasiva) | Pasiva | — | — | +15% FUE mientras su VID está por debajo de la del rival. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Noctaro (Juvenil) | 80 | 85 | 65 | 80 | 75 | 45 |
| Eclipsor | 95 | 90 | 80 | 95 | 115 | 40 |
| Umbralobo | 100 | 120 | 70 | 105 | 50 | 70 |

**Tendencias.** Eclipsor ← ING + SER. Umbralobo ← FUE + AGI. Objetos: *Escama de Eclipse* → Eclipsor, *Colmillo de Vacío* → Umbralobo. **Condición especial:** si el Vínculo es muy bajo, Umbralobo es la rama por defecto ("lobo solitario"); esta condición es visible en el Códice tras descubrirla.

---

## 6. LUMÁLIDOS — Familia de Luz ⚪ *(insignia: sol de ocho rayos)*

**Historia.** Brotan de los reflejos sobre el lago espejo de la Isla Aurora. Cada uno nace con la luz de un amanecer concreto, y lo recuerdan.
**Personalidad.** Optimistas, nobles y un poco vanidosos. Les encanta que se les mire y se les fotografíe.
**Rasgos físicos comunes.** Pelaje o plumaje blanco cálido con **halo flotante**; destellos al moverse; colores pastel dorados; ojos con reflejo estrellado.
**Hábitat.** Templo-jardín de mármol blanco con vidrieras, estanque espejo y rayos de sol que entran por arcos.
**Necesidades especiales.** Felicidad vinculada a la **decoración** del hábitat (bonus de felicidad por decoraciones colocadas). Si el hábitat está sucio, se entristecen el doble. Comida: miel, pan de luz y frutas doradas.
**Animaciones distintivas.** Posar (cuando se abre la cámara o la ficha), brillar al recibir cariño y dormir con el halo atenuado como lamparita.

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `light_baby_lumi` | **Lumi** | Pollito-bombilla con un halo diminuto y alitas que brillan. |
| Infantil | `light_child_destelli` | **Destelli** | Conejo-búho con plumas en las orejas y la cola, y halo más definido. |
| Juvenil | `light_juvenile_aurelio` | **Aurelio** | Felino alado (león joven) con alas pequeñas de plumas doradas y melena incipiente de rayos. |
| Adulto A | `light_adult_solarca` | **Solarca** | **León-sol**: melena que es un disco solar de rayos que giran despacio, alas grandes doradas, armadura natural en el pecho y cola con llama blanca. Silueta: león con sol detrás. |
| Adulto B | `light_adult_prismara` | **Prismara** | **Ciervo-serpiente de cristal**: cuerpo alargado y elegante de cristal facetado que refracta arcoíris, astas de prisma y patas finas. Silueta: ciervo larguísimo con astas angulosas. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_light_peck` | Destello | Básico | Distancia | 0 | — | 90% FUE; 10% de probabilidad de **Ceguera** 1 s. |
| `sk_light_flash` | Fogonazo | Infantil | Control | 25 | 10 s | **Aturdido** 0.8 s. |
| `sk_light_aegis` | Égida Áurea | Juvenil | Defensa | 30 | 12 s | Escudo del 15% y +15% DEF durante 4 s. |
| `sk_light_solarflare` | Llamarada Solar | Solarca | Distancia | 45 | 12 s | Rayo de 200%; +50% si el rival tiene un debuff. |
| `ps_light_pride` | Orgullo del Alba | Solarca (pasiva) | Pasiva | — | — | +10% FUE mientras su VID es mayor del 70%. |
| `sk_light_refract` | Refracción | Prismara | Defensa/contraataque | 40 | 14 s | Durante 3 s devuelve el 60% del daño de distancia recibido. |
| `ps_light_spectrum` | Espectro | Prismara (pasiva) | Pasiva | — | — | Resistencia elemental +10% contra cualquier elemento. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Aurelio (Juvenil) | 85 | 80 | 80 | 70 | 75 | 35 |
| Solarca | 105 | 125 | 80 | 85 | 70 | 50 |
| Prismara | 110 | 70 | 110 | 75 | 115 | 35 |

**Tendencias.** Solarca ← FUE + VÍN. Prismara ← ING + SER. Objetos: *Fragmento de Alba* → Solarca, *Prisma Puro* → Prismara.

---

## 7. TERRÁLIDOS — Familia de Tierra 🟤 *(insignia: montaña con gema)*

**Historia.** Excavaron sus madrigueras en las raíces de piedra de la Isla Cantera, cuyo corazón es una geoda del tamaño de una ciudad. Son los guardianes de los túneles del Tam-Tam.
**Personalidad.** Tozudos, glotones y fiables. Lentos al principio, pero muy constantes. Coleccionan piedras bonitas.
**Rasgos físicos comunes.** Placas de roca sobre piel arcillosa, **cristales que asoman** por las grietas (de colores heredables), garras de excavar y ojos pequeños y tranquilos.
**Hábitat.** Cañón de capas de colores con cuevas de cristal, vagonetas viejas y arena.
**Necesidades especiales.** **Comen mucho** (raciones dobles), pero el hambre decae despacio. La higiene se ensucia rápido (barro), aunque no les molesta tanto. Les gusta excavar: actividad con mini-recompensa diaria (encuentran un objeto).
**Animaciones distintivas.** Enterrarse y asomar, rodar como bola, masticar ruidosamente y dormir como una roca (inmóviles y con un ronquido grave).

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `earth_baby_guijin` | **Guijín** | Topito-guijarro con hocico rosa y una pequeña gema en la frente. |
| Infantil | `earth_child_terron` | **Terrón** | Armadillo bebé con placas de roca y garras grandes, que rueda. |
| Juvenil | `earth_juvenile_cantoral` | **Cantoral** | Cuadrúpedo robusto (tejón-rinoceronte) con cristales en hileras sobre el lomo y un cuerno de piedra. |
| Adulto A | `earth_adult_monolitan` | **Monolitán** | **Gólem-armadillo fortaleza**: caparazón de bloques megalíticos con runas grabadas, patas como columnas y cabeza blindada pequeña. Silueta: fortaleza con patas. |
| Adulto B | `earth_adult_geodrax` | **Geodráx** | **Raptor-geoda**: bípedo veloz, piel de roca agrietada que deja ver cristales brillantes, cola-mazo de amatista y garras de cristal. Silueta: velocirraptor cristalino. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_earth_slam` | Pisotón | Básico | Cuerpo a cuerpo | 0 | — | 105% FUE; ataque un 10% más lento. |
| `sk_earth_rollout` | Rodada | Infantil | Movilidad/ataque | 25 | 8 s | Rueda hasta el rival con un 120% y +20% DEF durante la carga. |
| `sk_earth_quake` | Temblor | Juvenil | Área | 35 | 12 s | 110% de daño y −25% VEL durante 3 s. |
| `sk_earth_bastion` | Bastión Rúnico | Monolitán | Defensa | 40 | 16 s | Inmune a control y −50% de daño recibido durante 3 s. |
| `ps_earth_bedrock` | Lecho de Roca | Monolitán (pasiva) | Pasiva | — | — | No puede ser empujado; +5% DEF por cada 10% de VID perdida. |
| `sk_earth_shardstorm` | Tormenta de Esquirlas | Geodráx | Distancia | 35 | 9 s | 6 esquirlas de 30%; los críticos aplican **Sangrado de cristal** (DoT). |
| `ps_earth_facets` | Facetas | Geodráx (pasiva) | Pasiva | — | — | Daño crítico +25%. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Cantoral (Juvenil) | 100 | 85 | 90 | 50 | 55 | 40 |
| Monolitán | 160 | 95 | 135 | 30 | 60 | 35 |
| Geodráx | 95 | 120 | 85 | 90 | 55 | 70 |

**Tendencias.** Monolitán ← SER + FUE. Geodráx ← AGI + ING. Objetos: *Runa de Basalto* → Monolitán, *Geoda Viva* → Geodráx.

---

## 8. ASTRÁLIDOS — Familia del Cosmos 🌌 *(insignia: anillo orbital con estrella)*

**Historia.** No nacieron en ninguna isla: cayeron del cielo como estrellas fugaces. Son los únicos Tamis que *recuerdan* el primer latido del Tam-Tam y, según la leyenda, podrían reavivarlo.
**Personalidad.** Soñadores, sabios y distraídos. Se quedan mirando al cielo. Les fascinan los rompecabezas.
**Rasgos físicos comunes.** Cuerpo con **interior de nebulosa visible** (textura animada de galaxia dentro de la silueta), pequeños planetas u orbes que orbitan, y ojos como constelaciones.
**Hábitat.** Observatorio flotante con telescopio, cúpula de estrellas, planetas en miniatura y auroras.
**Necesidades especiales.** Necesidades más estables (decaen un 15% más lento), pero piden **estímulo mental**: si no juegan a `grid` o a `maze` en 24 h, se aburren (−felicidad). Comida: polvo de estrellas, gominolas de cometa.
**Animaciones distintivas.** Levitar al estar contentos, orbes que cambian de órbita según el humor y "constelar" (dibuja figuras en el aire al recibir caricias).

| Etapa | ID | Nombre | Diseño / silueta |
|-------|----|--------|------------------|
| Bebé | `cosmos_baby_nebulin` | **Nebulín** | Gotita de nebulosa con una estrella en la frente y un orbe diminuto en órbita. |
| Infantil | `cosmos_child_orbi` | **Orbi** | Criatura-satélite tipo erizo-de-mar redondeado con anillo planetario y dos orbes. |
| Juvenil | `cosmos_juvenile_cometrix` | **Cometrix** | Zorro-cometa con cola larguísima de polvo estelar y tres orbes. |
| Adulto A | `cosmos_adult_galaxion` | **Galaxión** | **Ballena-galaxia** que nada en el aire: cuerpo inmenso cuyo interior es una galaxia espiral, aletas como brazos galácticos y planetas en su estela. Silueta: ballena con espiral interna. |
| Adulto B | `cosmos_adult_astrolabis` | **Astrolabis** | **Búho-astrolabio**: búho mecánico-astral con anillos dorados concéntricos que giran a su alrededor, plumas de metal estelar y ojos de lente. Silueta: búho encerrado en esfera armilar. |

**Habilidades.**
| ID | Nombre | Se aprende | Tipo | ENE | CD | Efecto |
|----|--------|-----------|------|-----|----|--------|
| `sk_cosmos_orb` | Orbe Errante | Básico | Distancia | 0 | — | 90% FUE; el proyectil rebota y le sigue. |
| `sk_cosmos_gravity` | Pozo Gravitatorio | Infantil | Control | 25 | 10 s | Atrae al rival y −15% VEL durante 3 s. |
| `sk_cosmos_starfall` | Lluvia Estelar | Juvenil | Área | 35 | 11 s | 4 meteoros de 50%. |
| `sk_cosmos_bigbang` | Gran Expansión | Galaxión | Área | 60 | 20 s | 250% de daño; daño +1% por cada 2 ENE restantes tras pagar. |
| `ps_cosmos_mass` | Masa Estelar | Galaxión (pasiva) | Pasiva | — | — | Reduce todos los cooldowns propios un 10%. |
| `sk_cosmos_timeloop` | Bucle Temporal | Astrolabis | Utilidad | 45 | 18 s | Reinicia el cooldown de la última habilidad usada y recupera el 10% de VID. |
| `ps_cosmos_foresight` | Presciencia | Astrolabis (pasiva) | Pasiva | — | — | Esquiva la primera habilidad especial que reciba en cada combate. |

| Forma | VID | FUE | DEF | VEL | ENE | CRI |
|-------|-----|-----|-----|-----|-----|-----|
| Cometrix (Juvenil) | 85 | 70 | 70 | 80 | 95 | 30 |
| Galaxión | 130 | 85 | 90 | 60 | 120 | 30 |
| Astrolabis | 90 | 85 | 80 | 110 | 110 | 40 |

**Tendencias.** Galaxión ← SER + VÍN. Astrolabis ← ING + AGI. Objetos: *Polvo de Supernova* → Galaxión, *Engranaje Celeste* → Astrolabis.

---

## 9. Habilidades universales (aprendibles por cualquier familia)

Se desbloquean con entrenamiento, logros o Manuales comprados con Chispas. Cada criatura equipa en Arena **1 básico (fijo) + 3 habilidades activas + 1 pasiva**.

| ID | Nombre | Cómo se aprende | ENE | CD | Efecto |
|----|--------|-----------------|-----|----|--------|
| `sk_uni_tackle` | Embestida | Entrenamiento de Fuerza nv. 3 | 15 | 5 s | 120% de daño y empuje. |
| `sk_uni_guard` | Guardia | Entrenamiento de Defensa nv. 3 | 15 | 8 s | −35% de daño durante 2 s. |
| `sk_uni_breath` | Respiro | Meditación nv. 3 | 0 | 15 s | Recupera 30 ENE. |
| `sk_uni_cheer` | Grito de Ánimo | Vínculo ≥ 70 | 20 | 14 s | +15% a todas las stats durante 4 s. |
| `sk_uni_sidestep` | Paso Lateral | Carrera nv. 3 | 10 | 6 s | Esquiva el siguiente ataque. |
| `ps_uni_grit` | Tesón | 25 victorias en Arena | — | — | Sobrevive con 1 VID a un golpe letal una vez por combate (solo si VID > 30% antes del golpe). |

---

## 10. Estados alterados (referencia)

| Estado | Efecto | Duración típica | Acumulable |
|--------|--------|-----------------|-----------|
| Quemadura | 3% de VID máx./s | 3 s | No (se refresca) |
| Empapado | −15% VEL; recibe ×1.2 de daño eléctrico | 4 s | No |
| Enraizado | No puede moverse (sí atacar a distancia) | 1–2 s | No |
| Aturdido | No actúa | 0.3–1 s | No; 2 s de inmunidad tras terminar |
| Ceguera | −40% de precisión (los ataques pueden fallar) | 1–3 s | No |
| Miedo | Retrocede y no ataca | ≤1.2 s | No; inmunidad 3 s |
| Sangrado de cristal | 2% de VID máx./s | 4 s | Hasta 3 cargas |
| Escudo | Absorbe daño | 3–5 s | Se suma |

---

## 11. Plantilla para nuevas criaturas (temporadas)

```ts
// packages/content/creatures/<family>/<id>.ts
export const form: CreatureForm = {
  id: "fire_adult_volcaurio",          // único y permanente
  family: "fire",
  stage: "adult",
  names: { es: "Volcaurio", en: "Volcaurus" },
  silhouette: "mountain_horned",      // etiqueta de QA de silueta
  rig: "rig_quadruped_heavy",         // rig de animación compartido
  parts: "art/fire/volcaurio/*.svg",
  baseStats: { hp:130, str:120, def:100, spd:55, ene:70, crit:40 },
  skills: ["sk_fire_eruption"], passive: "ps_fire_magmahide",
  evolvesFrom: "fire_juvenile_brasko",
  evolutionRule: "evo_fire_j_a",      // ver EVOLUTION_SYSTEM
  geneLoci: ["horns", "magma_pattern", "tail"],
  codex: { hints: ["hint_fire_a_1","hint_fire_a_2","hint_fire_a_3"] },
  season: 0,
};
```

Checklist de una nueva forma: silueta única (prueba en negro sobre blanco a 64 px), arte de partes, al menos las 11 animaciones básicas, sonido, regla de evolución, 3 pistas de Códice, habilidades, prueba de balance en simulador (§ GAMEPLAY_SYSTEMS 5.9).
