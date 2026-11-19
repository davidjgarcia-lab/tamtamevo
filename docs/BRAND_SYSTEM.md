# BRAND SYSTEM — TamTam Evolution (marca visual: TamTam EVO)

> Aplicación del **Manual de Identidad Corporativa** y del **Art Direction / Production Bible** (ambos del 2026-11-19, entregados como PDF) al producto.
> Fuente de los tokens en código: `apps/mobile/src/theme.ts`.

## 1. Plataforma de marca
- **Propósito:** crear un vínculo cotidiano con criaturas fantásticas que crecen y cambian con cada decisión del jugador.
- **Promesa:** cada cuidado deja huella; cada Tamtam cuenta una historia distinta. Encaja con el sistema de Lustre (EVOLUTION_SYSTEM §11).
- **Personalidad:** curiosa · cálida · expresiva · fantástica · juguetona · valiente.
- **Voz:** optimista, directa, cercana y ligeramente mágica. Sin culpa por ausencias, sin urgencia de compra, sin exceso de diminutivos ni emojis.
- **Tagline:** "Un mundo de criaturas que crecen contigo." · corta: "Cuida. Juega. Evoluciona."

## 2. Logotipo e icono
| Pieza | Archivo | Uso |
|-------|---------|-----|
| Logo principal (emblema + lettering) | `apps/mobile/assets/brand/logo.png` (fondo transparente) · `logo-640.png` | Pantalla de carga, egg screen, splash y preloader web. Siempre sobre fondo oscuro. No reconstruir el lettering |
| Icono de app (launcher) | `assets/brand/icon.png` (1024², opaco) | iOS y tiendas |
| Icono adaptativo Android | `assets/brand/adaptive-foreground.png` + fondo `#22144A` | Android |
| Favicon | `assets/brand/favicon.png` | Web |
| Splash nativo | `assets/brand/splash-logo.png` sobre `#17132B` | `expo-splash-screen` (app.json) |

Área de seguridad: un margen mínimo igual a la altura de la estrella central.

## 3. Color (núcleo corporativo)
| Token | HEX | Uso |
|-------|-----|-----|
| Violeta núcleo | `#17132B` | Fondos (55–65% de la pantalla) |
| Violeta panel | `#30294F` | Paneles, hojas, tarjetas |
| Cian eléctrico | `#00D4FF` | **Acción principal**, progreso, foco |
| Violeta evolución | `#8B42F6` | Acción secundaria, nombre del Tamtam, avisos |
| Naranja energía | `#FF8A00` | Hambre, actividad |
| Rosa vínculo | `#FF4F9A`\* | Alertas, necesidades, Cariño |
| Menta vida | `#4FD8B4`\* | Estado positivo |
| Azul aventura | `#4499FF`\* | Información |
| Oro recompensa | `#FFD166`\* | Monedas, recompensas, Tienda |
| Blanco nube | `#F5F3FF` | Texto principal |

\* El manual no imprime estos HEX (quedan ocultos tras otros elementos de la página); están **muestreados** de las muestras del PDF. Conviene confirmarlos.

Distribución: 55–65% violetas/oscuros · 20–25% neutros claros · 10–15% acentos. **Los colores elementales viven en los Tamtams y sus entornos**, nunca en el núcleo de la interfaz.

## 4. Tipografía
- **Baloo 2 ExtraBold**: titulares, nombres de Tamtam, botones y celebraciones.
- **Inter** (500 / 700): interfaz, estadísticas y textos.
- Jerarquía: H1 32–40 · H2 22–28 · H3 16–20 · cuerpo 10–12 pt · microcopy 8–9 pt. Evitar texto largo en mayúsculas.

## 5. Componentes (implementados en `src/ui/kit.tsx`)
Botón principal cian (texto oscuro) · secundario violeta · recompensa oro · positivo menta · alerta rosa. Radio de botón 14 · tarjetas 18 · modales 24 · espaciado base 8 · transiciones 180–300 ms · objetivos táctiles de 44–48 dp como mínimo.

## 6. Arranque (launcher → carga → juego)
1. **Launcher:** icono de app y splash nativo (logo sobre Violeta núcleo).
2. **Preloader web** (solo en el navegador, mientras se descarga el motor gráfico): logo con pulso, halo violeta y barra cian indeterminada. Lo inyecta `tools/build-artifact.mjs`.
3. **Pantalla de carga** (`src/screens/LoadingScreen.tsx`): logo con halo, tagline, barra de progreso real (fuentes → partida → listo) y un consejo. Dura como mínimo 1,6 s.
4. **Juego.**

## 7. Art Direction aplicado al producto
- **Paletas de familia de producción** (Art Direction §03). Fuego: `#F04432` `#FF7A24` `#FFC247` `#7D2430` `#351D2B` (picos, cuernos, placas, carbón y núcleo incandescente). Las 8 paletas sustituyen a las de ART_BIBLE §4 como base de producción.
- **Proporciones de cabeza** (§02): Bebé 45–55% de H · Infantil 38–45% · Juvenil 28–38% · Adulto 22–32%. Un rasgo dominante por especie y como máximo dos secundarios.
- **Materiales** (§04): base, sombra suave, sheen, AO, rim light y emisivo. Equilibrio **70% mate o volumétrico · 20% reflejos y rim · 10% emisivo y partículas**. El glow nunca borra el borde ni sobreexpone ojos, UI ni detalles anatómicos.
- **Hogar** (§06): la habitación es un personaje más. Capas: pared → decoración mural → suelo y alfombras → muebles grandes → props → Tamtam → luz y VFX (implementado). La pared pasa a violeta profundo con luz de lámpara cálida.
- **VFX por familia** (§07): Fuego = lenguas ascendentes, chispas, humo fino y *heat shimmer* (ascuas y humo implementados; el shimmer está pendiente).
- **Checklist de aprobación** (§09): silueta a 64 px, expresión sin texto, contraste, anatomía animable, pivotes, sheen y emisivo controlados, VFX que no tapan el juego, variantes documentadas y fuente editable.

## 8. Pendiente de la marca
- Confirmar los HEX muestreados.
- Iconografía propia de la barra de navegación inferior (el prototipo aún no tiene pestañas).
- *Heat shimmer* de Fuego.
- Revisar Chispín frente a las proporciones del Art Direction: con la cabeza y el cuerpo en una sola masa, el Bebé cumple el rango del 45–55%.
