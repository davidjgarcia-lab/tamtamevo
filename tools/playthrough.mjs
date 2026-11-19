// End-to-end playthrough of the first-Tamtam vertical slice on the web build.
// Usage: node tools/playthrough.mjs [outDir]   (run `pnpm web:build` first)
// Records screenshots for GAMEPLAY_TEST_RESULTS.md and prints PASS/FAIL per check.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const { chromium } = playwright;

const root = resolve(process.env.DIST ?? resolve(import.meta.dirname, "../apps/mobile/dist"));
// PREFIX lets us serve the build under a sub-path (e.g. /tamtam/) to check that every path is relative.
const prefix = process.env.PREFIX ?? "/";
const out = resolve(process.argv[2] ?? "playthrough");
mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf", ".png": "image/png", ".ico": "image/x-icon" };
const server = createServer(async (req, res) => {
  let url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (!url.startsWith(prefix)) { res.writeHead(404).end(); return; }
  url = "/" + url.slice(prefix.length);
  const file = join(root, url === "/" ? "index.html" : url);
  try { const b = await readFile(file); res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}${prefix}`;

const results = [];
const check = (id, name, ok, detail = "") => { results.push({ id, name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${id} ${name} ${detail}`); };
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...(process.env.VIDEO ? { recordVideo: { dir: process.env.VIDEO, size: { width: 390, height: 844 } } } : {}) });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = (n) => page.screenshot({ path: join(out, `${n}.png`) });
const coins = async () => Number((await page.locator('[aria-label$="Tamcoins, ver historial"]').getAttribute("aria-label")).split(" ")[0]);
const need = async (label) => Number((await page.locator(`[aria-label^="${label} "]`).first().getAttribute("aria-label")).split(" ").pop());

try {
  await page.goto(base);
  await page.getByText("Incubando…").waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot("01-egg-incubating");
  check("E2E-01", "Huevo en incubación visible", true);
  await page.getByText("¡Se mueve!").waitFor({ timeout: 30000 });
  await shot("02-egg-ready");
  await page.getByLabel("Abrir el huevo").click();
  await page.waitForTimeout(600);
  await shot("03-egg-cracking");
  await page.getByText("¿Cómo se llamará?").waitFor({ timeout: 10000 });
  await page.waitForTimeout(900);
  await shot("04-naming");
  check("E2E-02", "Eclosión → pantalla de nombre", true);
  await page.getByTestId("name-input").fill("A");
  await page.getByTestId("confirm-name").click();
  await page.waitForTimeout(300);
  check("E2E-03", "Rechaza nombre de 1 carácter", await page.getByText("Necesita al menos 2 caracteres.").isVisible());
  await page.getByTestId("name-input").fill("Ñandú Brasita");
  await page.getByTestId("confirm-name").click();
  await page.getByText("Ñandú Brasita").first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(1500);
  await shot("05-home");
  check("E2E-04", "Nombre Unicode aceptado y visible en Hogar", true);

  const c0 = await coins();
  check("E2E-05", "Monedero inicial 300", c0 === 300, `(${c0})`);

  // Tap Chispín directly (centre of the front lane) → pet.
  const st0 = await page.getByLabel("Habitación").boundingBox();
  const a0 = await need("Cariño");
  await page.mouse.click(st0.x + st0.width / 2, st0.y + st0.height * 0.86);
  await page.waitForTimeout(400);
  const a1 = await need("Cariño");
  check("E2E-17", "Tocar a Chispín lo acaricia (Cariño sube)", a1 > a0, `${a0}→${a1}`);

  // Feeding.
  const h0 = await need("Hambre");
  await page.getByTestId("care-feed").click();
  await page.getByTestId("feed-food_ember_pepper").click();
  await page.waitForTimeout(700);
  await shot("06-eat");
  const h1 = await need("Hambre");
  check("E2E-06", "Comer sube el hambre (saciedad)", h1 > h0 || h1 === 100, `${h0}→${h1}`);

  await page.getByTestId("care-pet").click();
  await page.waitForTimeout(800);
  await shot("07-pet");
  await page.getByTestId("care-bathe").click();
  await page.waitForTimeout(800);
  await shot("08-bathe");
  check("E2E-07", "Higiene a 100 tras bañar", (await need("Higiene")) >= 99);
  await page.getByTestId("care-play").click();
  await page.waitForTimeout(600);
  await shot("09-play");

  // Gym.
  await page.waitForTimeout(2200);
  await page.getByTestId("open-gym").click();
  await page.getByTestId("gym-start").click();
  const hold = page.getByTestId("gym-hold");
  const box = await hold.boundingBox();
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(i === 2 ? 450 : 790);
    if (i === 1) await shot("10-gym-lifting");
    await page.mouse.up();
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(800);
  await shot("11-gym-result");
  const gymOk = await page.getByText(/Tamcoins$/).first().isVisible().catch(() => false);
  check("E2E-08", "Sesión de Gym completa con recompensa", gymOk);
  await page.getByText("Volver a casa").click();
  await page.waitForTimeout(500);
  const c1 = await coins();
  check("E2E-09", "Las monedas del Gym llegan al monedero", c1 > c0, `${c0}→${c1}`);

  // Shop: buy a chair with gym coins.
  await page.getByTestId("open-shop").click();
  await page.getByText("Mobiliario", { exact: true }).click();
  await shot("12-shop");
  await page.getByTestId("buy-furn_chair_wood").click();
  await page.waitForTimeout(400);
  const c2 = await coins();
  check("E2E-10", "Compra descuenta 120", c2 === c1 - 120, `${c1}→${c2}`);
  // Try in my house: poster (wall).
  await page.getByText("Decoración", { exact: true }).click();
  await page.getByText("Probar en mi casa").first().click();
  await page.waitForTimeout(500);
  await shot("13-preview");
  await page.getByTestId("preview-buy").click();
  await page.waitForTimeout(500);
  const c3 = await coins();
  check("E2E-11", "Probar en mi casa → comprar y colocar", c3 < c2, `${c2}→${c3}`);
  await shot("14-after-preview-buy");

  // Decor: place the chair from the inventory.
  await page.getByTestId("open-decor").click();
  await page.getByText(/Silla de madera ×1/).click();
  const stage = await page.getByLabel("Habitación").boundingBox();
  await page.mouse.click(stage.x + stage.width * 0.62, stage.y + stage.height * 0.66);
  await page.waitForTimeout(400);
  await shot("15-decor");
  check("E2E-18", "Colocar mueble del inventario (modo Decorar)", await page.getByText("Todos tus muebles están colocados. Compra más en la Tienda.").isVisible());
  await page.getByTestId("decor-done").click();

  // Tap the dumbbells in the room → gym.
  const st1 = await page.getByLabel("Habitación").boundingBox();
  await page.mouse.click(st1.x + st1.width * 0.88, st1.y + st1.height * 0.63);
  const gymOpened = await page.getByText("Tamtam Gym · Nivel 1").waitFor({ timeout: 3000 }).then(() => true).catch(() => false);
  check("E2E-19", "Tocar las mancuernas abre el Gym", gymOpened);
  if (gymOpened) await page.getByText("Salir", { exact: true }).click();

  // History.
  await page.getByLabel(/Tamcoins, ver historial/).click();
  await page.waitForTimeout(300);
  await shot("16-history");
  check("E2E-12", "Historial muestra Gimnasio y compras", (await page.getByText("Gimnasio").count()) > 0 && (await page.getByText("Silla de madera").count()) > 0);
  await page.getByLabel("Cerrar Monedero").click();

  // Persistence: reload.
  await page.waitForTimeout(800);
  await page.reload();
  await page.getByText("Ñandú Brasita").first().waitFor({ timeout: 30000 });
  const c4 = await coins();
  check("E2E-13", "Tras recargar: nombre y monedas persisten", c4 === c3, `${c3}→${c4}`);

  // Debug mode: separate profile and simulated clock.
  await page.getByTestId("dev").click();
  await page.getByTestId("debug-enter").click();
  await page.getByText("MODO DEBUG · partida de pruebas · reloj simulado").waitFor();
  // The debug panel stays open after entering debug mode.
  await page.getByTestId("dbg-coins").click();
  await page.getByLabel("Cerrar Modo debug").click();
  const hunger0 = await need("Hambre");
  await page.getByTestId("dev").click();
  await page.getByTestId("dbg-24h").click();
  await page.waitForTimeout(1500);
  await page.getByLabel("Cerrar Modo debug").click();
  await page.waitForTimeout(500);
  await shot("17-debug-after-24h");
  const hunger1 = await need("Hambre");
  check("E2E-14", "Debug +24 h hace bajar el hambre (con suelo 25)", hunger1 < hunger0 && hunger1 >= 25, `${hunger0}→${hunger1}`);
  // Lustre comparison (debug).
  await page.getByTestId("dev").click();
  await page.getByTestId("dbg-lustre-lab").click();
  await page.getByText("Lustre · comparativa").waitFor({ timeout: 5000 });
  await page.waitForTimeout(2600);
  await shot("20-lustre-lab");
  check("E2E-21", "Comparativa de Lustre (5 niveles) se muestra", (await page.getByText("Legendario").count()) > 0);
  await page.getByText("Cerrar", { exact: true }).click();
  // Nap.
  await page.getByTestId("care-nap").click();
  await page.waitForTimeout(400);
  check("E2E-20", "Siesta de 20 min disponible y con cooldown", await page.getByText(/^Siesta \d+m$/).isVisible());
  const cDebug = await coins();
  await page.getByTestId("dev").click();
  await page.getByTestId("debug-exit").click();
  await page.waitForTimeout(1500);
  const cMain = await coins();
  check("E2E-15", "Salir de debug: partida normal intacta", cMain === c4 && cDebug === c4 + 500, `main ${cMain}, debug ${cDebug}`);
  await page.getByLabel(/^Ficha de /).click();
  await page.waitForTimeout(400);
  await shot("18-profile");
  await page.getByLabel(/^Cerrar /).first().click();

  // Other resolutions.
  for (const vp of [{ w: 360, h: 640 }, { w: 430, h: 932 }, { w: 768, h: 1024 }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(900);
    await shot(`19-home-${vp.w}x${vp.h}`);
  }
} catch (e) {
  check("E2E-XX", "Playthrough sin excepciones", false, e.message);
  await shot("zz-failure").catch(() => {});
} finally {
  await browser.close();
  server.close();
}
check("E2E-16", "Sin errores de consola/página", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }));
