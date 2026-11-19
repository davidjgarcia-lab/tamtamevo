# HOME SYSTEM — Tam Tam Evo (TamTam Home)

> Versión 0.3 · Brief v3.0 · Estado: **propuesta, pendiente de aprobación** (decisión N4)
> Código: `packages/core/src/home` (reglas de colocación, ya implementadas y probadas). Render y editor: Fase 5.

---

## 1. Concepto
La **casa** es el centro visual del juego (pestaña Hogar). Es una habitación ilustrada en **vista frontal tipo casa de muñecas**, con una pared al fondo, un suelo con profundidad y una ventana. Ahí viven hasta 3 Tamtams activos.

**Relación con los hábitats de familia (decisión N4):** los hábitats elementales de los documentos anteriores (cueva de basalto, laguna…) dejan de ser el fondo principal. Pasan a ser:
- **la vista de la ventana** (el paisaje de la isla de la familia del Tamtam principal),
- **temas de casa** cosméticos (paredes, suelo y muebles con estética de familia),
- escenarios de minijuegos, Arena y eventos.

El hábitat de Fuego del spike se reutiliza como vista de ventana y tema.

## 2. Estructura de la habitación

```
┌──────────────────────── PARED (rejilla 12 × 6) ────────────────────────┐
│  [póster]   ┌─ventana─┐   [estante]      [cuadro]        [lámpara pared] │
│             │ isla    │                                                  │
│             └─────────┘                                                  │
├──────────────────────── zócalo ───────────────────────────────────────────┤
│ SUELO (rejilla 12 × 4, fila 0 = fondo, fila 3 = primer plano)           │
│  [cama]        [alfombra (capa propia)]        [escritorio]   [planta]  │
└───────────────────────────────────────────────────────────────────────────┘
```

| Capa | Rejilla | Admite | Reglas |
|------|---------|--------|--------|
| `wall` | 12 × 6 | Pósters, cuadros, estanterías, lámparas de pared, relojes | Sin solapes entre objetos de pared. La ventana ocupa celdas fijas. |
| `floor` | 12 × 4 | Muebles, objetos funcionales, plantas, juguetes | Sin solapes. La huella es de `w × d` celdas. |
| `rug` | 12 × 4 (rejilla del suelo) | Alfombras | Sin solapes entre alfombras; **sí** puede haber muebles encima. |
| `surface` | Huecos de un mueble | Objetos pequeños sobre mesas o estanterías (lámpara de mesa, maceta) | Solo en muebles con `surfaceSlots`. |
| Acabados | — | Color de pared, papel pintado y suelo | Se cambian sin colocar; uno de cada tipo activo. |

- **Orden de dibujo:** pared → acabados → objetos de pared → alfombras → objetos de suelo ordenados por fila (de fondo a frente) → Tamtams intercalados según su fila → primer plano.
- **"Girar":** en vista frontal, girar es **reflejar** el objeto horizontalmente (`mirrored`). Los objetos con huella no cuadrada que lo permitan (`rotatable`) también pueden intercambiar ancho y fondo.
- **Celdas transitables:** las celdas de suelo libres (las alfombras son transitables) forman el mapa de navegación de los Tamtams. La colocación se rechaza si deja **inaccesible** algún punto de interacción o encierra a un Tamtam (comprobación por inundación).

## 3. Editor de habitación

| Acción | Gesto | Resultado |
|--------|-------|-----------|
| Entrar en modo edición | Botón "Decorar" en Hogar | Se muestra la rejilla (sutil) y los Tamtams se apartan a un lado |
| Seleccionar | Tocar un objeto | Contorno y barra flotante: mover, reflejar, color, retirar |
| Mover | Arrastrar | El objeto se ajusta a la rejilla; la huella se ve **verde** si es válida o **roja** si no |
| Colocar nuevo | Arrastrar desde la bandeja de inventario | Igual que mover |
| Reflejar o girar | Botón ⟲ | Solo si el objeto lo permite |
| Cambiar color | Botón de paleta | Variantes de color del objeto (`colorVariants`), si existen |
| Retirar | Botón o arrastrar a la bandeja | Vuelve al inventario |
| Previsualizar compra | Desde la tienda: "Probar en mi casa" | Objeto fantasma semitransparente, colocable; "Comprar" lo confirma y "Descartar" lo quita |
| Guardar / descartar | Botones de la barra | Los cambios se aplican de forma atómica; "Descartar" vuelve al estado anterior |

Mientras se edita se trabaja sobre un **borrador**: nada se guarda hasta confirmar, y el borrador sobrevive si la app se cierra.

## 4. Modelo de datos
```ts
interface RoomLayout {
  schemaVersion: 1;
  floor: { cols: 12; rows: 4 };
  wall: { cols: 12; rows: 6 };
  finishes: { wallColor: ItemId | string; wallpaper?: ItemId; flooring: ItemId };
  placements: Placement[];
  windowView: FamilyId;            // vista de isla
}
interface Placement {
  uid: string;                     // instancia colocada
  itemId: ItemId;                  // artículo de catálogo
  layer: "floor" | "wall" | "rug" | "surface";
  x: number; y: number;            // celda superior izquierda (en surface: índice de hueco)
  mirrored: boolean;
  rotated: boolean;                // intercambia w y d si el objeto lo permite
  colorVariant?: string;
  parentUid?: string;              // en surface: mueble que lo sostiene
}
interface FurnitureSpec {           // parte del artículo de catálogo
  layer: Placement["layer"];
  w: number; h: number;            // celdas (h = fondo en suelo, alto en pared)
  mirrorable: boolean; rotatable: boolean;
  surfaceSlots?: number;
  interactions?: InteractionSpot[];
  colorVariants?: string[];
}
interface InteractionSpot {
  kind: "sit" | "sleep" | "play" | "look" | "toggle_light" | "train" | "study" | "garden" | "music" | "craft" | "eat";
  dx: number; dy: number;          // celda de acceso relativa a la huella
  capacity: number;                // Tamtams a la vez (actividades compartidas)
}
```

## 5. Tamtams y mobiliario
La IA de utilidad de GAMEPLAY_SYSTEMS §3.1 se amplía con **comportamientos de mobiliario**:
- Cada mueble declara `interactions` con su punto de acceso. El Tamtam elige uno por utilidad (necesidad + preferencia de familia + novedad) y va hasta él por las celdas transitables (A* en la rejilla 12×4).

| Interacción | Mueble | Efecto |
|-------------|--------|--------|
| Sentarse | Silla, sofá, cojín | +Energía leve, animación `sit` |
| Dormir | Cama, cesta | Mejor calidad de sueño (+10–25% de recuperación de Energía según la cama) |
| Jugar | Juguetes | +Actividad y Felicidad |
| Observar | Cuadros, acuario, ventana | +Felicidad; preferencias por familia |
| Encender o apagar | Lámparas | Cambio de iluminación; a los Umbrálidos les gusta apagarlas |
| Usar objeto funcional | Gym, Academy, Garden, Music, Workshop | Uso **espontáneo** breve (animación y +1 XP de atributo, **sin monedas**). Las sesiones completas las inicia el jugador |
| Compartida | Sofá (2), mesa (3), juguetes grandes | Con varios Tamtams: jugar juntos, merendar, concierto a dúo → +Lazo |

**Confort:** la suma del Confort de las decoraciones colocadas reduce hasta un 15% el decaimiento de Felicidad (sin cambios respecto a GAMEPLAY_SYSTEMS §3.3).

## 6. Persistencia
El `RoomLayout` se guarda como entidad propia (snapshot + `schemaVersion`) junto al inventario, en la misma transacción que cualquier compra desde "Probar en mi casa".

## 7. Pruebas (implementadas)
Colocación válida e inválida (límites, solapes por capa, alfombras bajo muebles), mover, reflejar, girar, retirar, límite de copias según el inventario, validación de la huella del catálogo y serialización ida y vuelta. Pendiente para la Fase 5: accesibilidad de los puntos de interacción y comprobación por inundación.
