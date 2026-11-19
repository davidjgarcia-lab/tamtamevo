# GAMEPLAY TEST PLAN — Primer Tamtam (vertical slice)

> Escenarios jugables. Cada fila enlaza con su prueba automatizada o indica por qué no se puede ejecutar todavía.

| ID | Escenario | Pasos | Esperado | Automatización |
|----|-----------|-------|----------|----------------|
| GP-01 | Primera partida | Abrir → esperar incubación → tocar el huevo | Grietas, luz, pantalla de nombre | E2E-01/02 |
| GP-02 | Nombre inválido | Escribir "A" → Confirmar | Error "al menos 2 caracteres", no avanza | E2E-03 |
| GP-03 | Nombre Unicode | "Ñandú Brasita" | Se acepta y aparece en Hogar | E2E-04 |
| GP-04 | Nombre vacío | Confirmar sin escribir | Nombre temático por defecto | Unit `birth and naming` |
| GP-05 | Renombrar | Ficha → Cambiar nombre | Nuevo nombre guardado + historial | Unit; UI manual |
| GP-06 | Acariciar tocando | Tocar a Chispín | Animación + corazones, Cariño +8 | E2E-17 |
| GP-07 | Comer favorita | Comer → Pimiento ascua | "¡Su comida favorita!", Hambre ↑, inventario −1 | E2E-06, unit |
| GP-08 | Comer lleno | Hambre ≥ 95 → comer | Rechaza (enfado), no consume | Unit |
| GP-09 | Comida odiada | Gelatina fresca | Enfado, Felicidad −8 | Unit |
| GP-10 | Comida especial | Guiso de fuerza | +25 Energía y buff +5% FUE visible en la ficha | Unit |
| GP-11 | Bañar / limpiar / excrementos | Comer → +2 h → tocar excremento | Excremento aparece y se recoge; Higiene ↑ | Unit + E2E-07 |
| GP-12 | Dormir / despertar | Dormir → +3 h | Luces apagadas, Zzz, Energía +12/h, despierta al llegar a 100 | Unit; UI manual |
| GP-13 | Gym completo | Gimnasio → 5 repeticiones | Monedas, XP de Fuerza, Energía −12 | E2E-08/09 |
| GP-14 | Gym cansado | Energía < 12 | Mensaje, no cobra nada | Unit |
| GP-15 | Fuerza → Arena | 10 sesiones | +1 FUE permanente reflejado en la ficha | Unit |
| GP-16 | Mejora del Gym | Fuerza 4 + 2.000 TC | Nivel 2, multiplicador ×1,25 | Unit; UI manual |
| GP-17 | Comprar con monedas del Gym | Tienda → silla | Saldo −120, historial | E2E-10/12 |
| GP-18 | Probar en mi casa | Tienda → Probar → Comprar y colocar | Fantasma verde o rojo; compra y colocación atómicas | E2E-11 |
| GP-19 | Decorar | Decorar → elegir del inventario → casilla | Colocado; colisiones rechazadas | E2E-18, unit |
| GP-20 | Persistencia | Recargar la app | Nombre, monedas, muebles intactos | E2E-13 |
| GP-21 | Debug: tiempo | +24 h | Necesidades bajan con suelo 25, excrementos | E2E-14 |
| GP-22 | Debug aislado | Salir del debug | Partida normal intacta | E2E-15 |
| GP-23 | Evolución | Madurez → Ritual | Animación y nueva forma | **NOT IMPLEMENTED** (motor probado aparte) |
| GP-24 | Minijuegos (4) | — | — | **NOT IMPLEMENTED** |
| GP-25 | Arena | — | — | **NOT IMPLEMENTED** |
| GP-26 | Genética y cría | — | — | **NOT IMPLEMENTED** (solo alelos de color) |
