# ECONOMY SYSTEM — Tam Tam Evo

> Versión 0.3 · Brief v3.0 · Estado: **propuesta, pendiente de aprobación** (decisiones N5–N6)
> Sustituye a GAMEPLAY_SYSTEMS §6. Código: `packages/core/src/economy`, `inventory`, `shop`, `rewards`.

---

## 1. Monedas

| Moneda | ID | Tipo | Cómo se obtiene | Para qué sirve |
|--------|----|------|-----------------|----------------|
| **Tamcoins** (nombre provisional) | `tamcoin` | Principal | Minijuegos, actividades (Gym, Academy, Garden, Music, Workshop), misiones, logros, Arena, venta de cosechas y objetos fabricados, pequeñas recompensas por cuidar | Muebles, decoración, comida, equipo, mejoras de objetos funcionales, materiales, semillas, desbloqueo de actividades, cría |
| **Astrolitos** | `astrolite` | Especial, **solo se gana jugando** | Logros, primer ascenso de rango, objetivos semanales, hitos del Códice, eventos | Cosméticos especiales, Reliquias, huecos de Santuario y temas de casa |

Las **Chispas** (moneda común en los documentos anteriores) pasan a llamarse **Tamcoins** (decisión N5). No se pueden comprar con dinero real: la monetización sigue siendo solo cosmética (D7).

---

## 2. Reglas técnicas

### 2.1 Libro mayor (*ledger*) inmutable
Cada movimiento de moneda es un **asiento** de un libro mayor de solo escritura. Nunca se modifica un saldo directamente.

```ts
interface LedgerEntry {
  id: string;              // `${key}` (único)
  key: string;             // clave de idempotencia
  currency: "tamcoin" | "astrolite";
  amount: number;          // entero; positivo = ingreso, negativo = gasto
  balanceAfter: number;    // saldo tras aplicar el asiento (auditoría)
  kind: "reward" | "purchase" | "sale" | "upgrade" | "refund" | "adjustment";
  source: string;          // p. ej. "activity:gym", "shop:furn_lamp_mushroom"
  ts: number;              // reloj inyectado (ms UTC)
}
```

### 2.2 Garantías
| Garantía | Cómo se cumple |
|----------|----------------|
| **Atomicidad** | Una operación compuesta (p. ej. una compra: cobrar + añadir al inventario + registrar) se aplica en **una sola transacción** del almacén. Si falla un paso, no cambia nada. En memoria se trabaja sobre un borrador que solo se confirma al final; en SQLite (Fase de persistencia) se usa `BEGIN IMMEDIATE … COMMIT`. |
| **Idempotencia** | Toda operación lleva una **clave de idempotencia** determinista (`reward:minigame:<runId>`, `purchase:<uuid de intención>`, `harvest:<plotId>:<plantedAt>`). Si la clave ya existe, la operación devuelve el resultado original sin volver a aplicarse. Un doble toque, un reintento o un reinicio a mitad de una compra nunca duplican nada. |
| **Saldo nunca negativo** | `debit` comprueba el saldo dentro de la transacción y lanza `InsufficientFunds`. |
| **Importes válidos** | Solo enteros positivos (el signo lo pone el tipo de operación). Se rechazan `NaN`, decimales y valores mayores que el límite de seguridad. |
| **Auditoría** | `balanceAfter` permite verificar el libro completo: `Σ amount = saldo` (hay un test para ello). |
| **Offline y sincronización futura** | El libro mayor es la unidad de sincronización. El servidor recibirá los asientos con su clave, revalidará cada uno (las recompensas se recalculan a partir del resultado reproducible del minijuego o la actividad) y rechazará los duplicados por clave. |

### 2.3 Inventario
```ts
interface InventoryState { items: Record<ItemId, { qty: number; firstAcquiredAt: number }> }
```
- Los objetos apilables (comida, semillas, materiales) usan `qty`. Los muebles también: tener 3 sillas iguales es `qty: 3`.
- Los objetos colocados en la casa se calculan a partir de las colocaciones (HOME_SYSTEM). No se puede colocar más copias de las que se poseen, ni vender una copia que está colocada.

### 2.4 Compra
`purchase(state, item, { key, qty, ts, context })`, en una sola transacción:
1. Si `key` ya se aplicó → devuelve el resultado anterior (idempotencia).
2. Valida los requisitos: nivel de Cuidador, nivel de actividad, máximo poseído y que el artículo no esté retirado.
3. `debit(price × qty)`.
4. `inventory.add(item, qty)`.
5. Devuelve `{ entry, inventoryAfter }`.

**Estados del artículo en la tienda:** `owned` (tienes el máximo), `available` (puedes comprarlo), `too_expensive` (te faltan monedas), `locked` (te falta un requisito; se indica cuál).

---

## 3. Fuentes de Tamcoins y límites

### 3.1 Principio: **sin ingresos pasivos**
- Ningún reloj genera monedas solo. El Garden y el Workshop usan temporizadores reales, pero cada ciclo **exige** una acción (plantar, regar, cosechar, recoger) y consume recursos (semillas, materiales).
- Toda actividad que da monedas cuesta **Energía** (la necesidad *Descanso* pasa a llamarse **Energía**; decisión N6) y en la mayoría hay una interacción jugable cuya calidad (0,5–1,5) multiplica la recompensa.
- **Entusiasmo** (ya definido para los minijuegos) se aplica a cada actividad, por Tamtam y por día. El día se reinicia a las 04:00 hora local.

| Sesiones del día (por Tamtam y actividad) | Multiplicador de monedas | Multiplicador de XP y atributos |
|-------------------------------------------|--------------------------|----------------------------------|
| 1–4 | 100% | 100% |
| 5–8 | 50% | 75% |
| 9+ | 10% | 50% |

### 3.2 Ingresos de referencia (jugador medio: 3–4 sesiones al día, unos 45 min, 1 Tamtam)
| Fuente | Tamcoins al día (aprox.) |
|--------|--------------------------|
| Minijuegos (unas 6 partidas) | 400 |
| Actividades de casa (unas 6 sesiones; la Energía lo limita) | 300 |
| Garden (cosechas vendidas, nivel 1–2) | 80–200 |
| Arena (unos 5 combates; la fatiga lo limita) | 220 |
| Objetivos diarios (3) | 150 |
| Cuidados (+2 por acción útil, máx. 80) | 80 |
| **Total** | **≈ 1.200** (≈ 1.700 con 3 Tamtams activos, porque Entusiasmo y Energía son por Tamtam) |

### 3.3 Fórmula de recompensa de una actividad
```
monedas = round( base_actividad × calidad × mult_nivel_objeto × mult_entusiasmo )
calidad          ∈ [0.5, 1.5]  (resultado de la interacción; un fallo total da 0.5)
mult_nivel_objeto = 1.00 (Nv1) · 1.25 (Nv2) · 1.50 (Nv3)
tope por sesión  = 2 × base_actividad
```
Los valores base de cada actividad están en ACTIVITIES_SYSTEM §2.

---

## 4. Precios iniciales

### 4.1 Consumibles
| Artículo | Precio (TC) | Notas |
|----------|-------------|-------|
| Comida básica / favorita / gourmet | 10 / 25 / 60 | Los platos cocinados con la Academy (cocina) dan más efecto |
| Medicina | 50 | |
| Semillas (común → rara) | 10 – 120 | Las raras requieren nivel de Garden |
| Materiales básicos (madera, tela, arcilla, metal) | 15 – 40 | También se obtienen en minijuegos y con la Ciencia |
| Tónico de eje | 250 | EVOLUTION_SYSTEM §3D |
| Catalizador | 900 (o 10 fragmentos) | |
| Lupa Genética | 300 | |

### 4.2 Casa (por rareza)
| Rareza | Precio (TC) | Ejemplos |
|--------|-------------|----------|
| Común | 80 – 300 | Silla de madera, maceta, póster pequeño, alfombra redonda |
| Poco común | 300 – 900 | Lámpara de seta, estantería, sofá de cojines |
| Raro | 900 – 2.500 | Cama-nido, acuario, chimenea de brasas |
| Épico | 2.500 – 6.000 | Ventanal de isla flotante, cúpula de estrellas (algunos solo con diseño de Arte) |
| Pintura de pared (color) | 50 | Paleta de 24 colores |
| Papel pintado | 200 – 800 | |
| Suelos | 300 – 1.200 | |

### 4.3 Objetos funcionales y mejoras
| Actividad | Nv1 (objeto inicial) | Nv2 | Nv3 |
|-----------|----------------------|-----|-----|
| **Gym** | Mancuernas — **gratis** (regalo de bienvenida) | Banco de pesas — 2.000 · Fuerza nv. 4 | Gimnasio avanzado — 7.000 · Fuerza nv. 10 · 6 metal |
| **Academy** | Escritorio — 400 | Biblioteca — 2.500 · 2 materias nv. 3 | Laboratorio-aula — 8.000 · 2 materias nv. 7 |
| **Garden** | Macetas y semillas — 300 | Huerto elevado — 2.000 · Afinidad natural nv. 4 | Invernadero — 7.500 · Afinidad natural nv. 10 · 8 madera |
| **Music** | Instrumento básico (tamborcillo) — 500 | Set de instrumentos — 2.500 · Creatividad nv. 4 | Escenario — 8.000 · Creatividad nv. 10 · 3 canciones de nv. 3 |
| **Workshop** | Mesa de trabajo — 700 | Taller equipado — 3.000 · Habilidad manual nv. 4 | Forja-taller — 9.000 · Habilidad manual nv. 10 · 6 metal |

**Ritmo esperado** (2–3 sesiones diarias de esa actividad): el primer Nv2 llega hacia el día 4–6 y el primer Nv3 hacia la semana 3–4, sin pagar dinero real. Lo que marca el ritmo es el atributo, no las monedas.

---

## 5. Sumideros
Comida y cuidados (~120 TC al día), semillas y materiales, mejoras de objetos funcionales (el gran sumidero de la progresión), decoración (sin límite, por gusto), cría (150), equipo de Arena y crafteo. Los precios de decoración escalan por rareza, de modo que siempre hay algo que desear sin que sea necesario para progresar.

## 6. Antiabuso
- Entusiasmo + Energía + tope por sesión (§3).
- Sin bucles rentables: los alimentos que restauran Energía están limitados por el Hambre (no se puede comer si está llena) y por la *digestión* (máx. 2 comidas energéticas cada 6 h). Además, cuestan más de lo que rinde la sesión de actividad que permiten.
- Venta: los objetos se venden por el 40% de su precio de compra (fabricados: 60–150% del coste de los materiales según la calidad), para que comprar y vender no genere ganancias.
- Claves de idempotencia en todas las recompensas (`reward:<fuente>:<id de partida>`).
- El reloj del sistema solo afecta al temporizador del Garden y del Workshop; un salto de reloj hacia delante solo adelanta cosechas ya plantadas, con los límites de GAMEPLAY_SYSTEMS §2.5.

## 7. Pruebas (implementadas en `packages/core`)
Saldo, libro mayor auditable, idempotencia de recompensas y compras, rechazo de saldo negativo e importes inválidos, atomicidad (una compra fallida no deja rastro), inventario (añadir, quitar, insuficiente), requisitos de tienda, estados de artículo y Entusiasmo.
