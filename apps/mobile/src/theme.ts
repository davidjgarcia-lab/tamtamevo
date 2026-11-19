/**
 * Brand tokens — TamTam Evolution · Manual de Marca (2026-11-19).
 * Use: 55–65% violets/darks · 20–25% light neutrals · 10–15% chromatic accents.
 * Elemental family colours live in the creatures, never in the corporate core.
 */
export const brand = {
  core: "#17132B", // Violeta núcleo
  panel: "#30294F", // Violeta panel
  panelHi: "#3C3462",
  line: "#4A4176",
  cyan: "#00D4FF", // Cian eléctrico — primary action
  violet: "#8B42F6", // Violeta evolución — secondary / navigation
  orange: "#FF8A00", // Naranja energía
  pink: "#FF4F9A", // Rosa vínculo — alerts / needs  (sampled from the manual)
  mint: "#4FD8B4", // Menta vida — positive state    (sampled)
  blue: "#4499FF", // Azul aventura                  (sampled)
  gold: "#FFD166", // Oro recompensa                 (sampled)
  cloud: "#F5F3FF", // Blanco nube
  textSoft: "#C9C2EA",
  textDim: "#9A92C2",
};

/** Legacy names used across screens, mapped onto the brand system (dark UI). */
export const colors = {
  cream: brand.core, // screen backgrounds
  ink: brand.cloud, // primary text
  inkSoft: brand.textSoft,
  coral: brand.cyan,
  coralDark: "#00A9CC",
  card: brand.panel,
  line: brand.line,
};

export const fonts = {
  display: "Baloo2_800ExtraBold",
  displayBold: "Baloo2_800ExtraBold",
  body: "Inter_500Medium",
  bodyBold: "Inter_700Bold",
};

/** Tokens: spacing 8 · button radius 14 · cards 18 · modals 24 · transitions 180–300 ms · touch ≥ 44–48. */
export const radius = { button: 14, card: 18, modal: 24 };
export const motion = { instant: 100, quick: 180, base: 280 };

export const tagline = "Un mundo de criaturas que crecen contigo.";
export const taglineShort = "Cuida. Juega. Evoluciona.";
