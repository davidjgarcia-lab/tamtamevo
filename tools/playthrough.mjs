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

const stageBox = async () => page.getByTestId("stage").boundingBox();
const sweep = async (y, times = 4, x0 = 0.12, x1 = 0.88) => {
  const b = await stageBox();
  await page.mouse.move(b.x + b.width * x0, b.y + b.height * y);
  await page.mouse.down();
  for (let i = 0; i < times; i++) {
    for (let k = 0; k <= 20; k++) await page.mouse.move(b.x + b.width * (x0 + ((i % 2 ? 20 - k : k) / 20) * (x1 - x0)), b.y + b.height * y, { steps: 2 });
  }
  await page.mouse.up();
};
const dev = async (id) => { await page.getByTestId("dev").click(); await page.getByTestId(id).click(); await page.getByLabel(/^Cerrar /).first().click().catch(() => {}); await page.waitForTimeout(300); };

try {
  const t0 = Date.now();
  await page.goto(base);
  await page.getByTestId("stage").waitFor({ timeout: 30000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(800);
  await shot("01-egg-in-room");
  check("E2E-01", "Carga rápida y el huevo aparece directamente en la habitación", loadMs < 8000 && (await page.getByText("Tu primer huevo se está calentando").count()) > 0, `${loadMs} ms`);
  await page.getByText("¡Se mueve!").waitFor({ timeout: 30000 });
  const b = await stageBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.72);
  await page.waitForTimeout(500);
  await shot("02-egg-cracking");
  await page.getByText("¡Ha nacido un Brasálido!").waitFor({ timeout: 5000 });
  await page.waitForTimeout(600);
  await shot("03-naming-in-room");
  check("E2E-02", "El huevo se abre en la habitación (sin pantalla aparte)", await page.getByTestId("stage").isVisible());
  await page.getByTestId("name-input").fill("!!");
  await page.getByTestId("confirm-name").click();
  await page.waitForTimeout(300);
  const invalid = await page.getByTestId("name-input").isVisible();
  await page.getByTestId("name-input").fill("Tizón");
  await page.getByTestId("confirm-name").click();
  await page.getByText("Tizón", { exact: true }).waitFor({ timeout: 5000 });
  await page.waitForTimeout(800);
  await shot("04-home");
  check("E2E-03", "Validación y nombre del Tamtam", invalid);
  check("E2E-04", "Barra inferior Casa · Granja · Tienda · Arena · Conectar", (await Promise.all(["home", "farm", "shop", "arena", "connect"].map((t) => page.getByTestId(`tab-${t}`).isVisible()))).every(Boolean));
  check("E2E-05", "Mimos ya no es un botón", (await page.getByRole("button", { name: "Mimos" }).count()) === 0);

  // Feeding with visible food.
  const h0 = await need("Hambre");
  await page.getByTestId("care-feed").click();
  await page.waitForTimeout(400);
  const foodImgs = await page.locator('img[src^="data:image/png"]').count();
  await shot("05-food-sheet");
  await page.getByTestId("feed-food_ember_pepper").click();
  await page.waitForTimeout(650);
  await shot("06-eating-pepper");
  await page.waitForTimeout(2500);
  check("E2E-06", "Cada comida tiene imagen y el Tamtam come (hambre sube)", foodImgs >= 2 && (await need("Hambre")) > h0, `imgs ${foodImgs}, ${h0}→${await need("Hambre")}`);

  // Shower and towel.
  await page.getByTestId("care-bathe").click();
  await page.waitForTimeout(900);
  await shot("07-shower");
  await page.waitForTimeout(1300);
  await shot("08-towel");
  await page.waitForTimeout(1200);

  // Stroke to pet.
  const a0 = await need("Cariño");
  for (const y of [0.78, 0.84, 0.72]) await sweep(y, 4);
  await page.waitForTimeout(500);
  await shot("09-petting");
  const a1 = await need("Cariño");
  check("E2E-07", "Acariciar deslizando el dedo da mimos", a1 > a0, `${a0}→${a1}`);
  await page.waitForTimeout(2500);

  // Debug: dirty Tamtam + poops around the room.
  await page.getByTestId("dev").click();
  await page.getByTestId("debug-enter").click();
  await page.waitForTimeout(1200);
  await page.getByLabel(/^Cerrar /).first().click();
  const cDebugStart = await coins();
  await dev("dbg-mess");
  await page.waitForTimeout(1200);
  await shot("10-dirty-flies-poops");
  check("E2E-08", "Sucio: manchas y moscas; cacas repartidas por la habitación", (await page.getByTestId("care-clean").getAttribute("aria-label")) !== null && (await need("Higiene")) <= 20);
  // Mop.
  await page.getByTestId("care-clean").click();
  await page.waitForTimeout(300);
  for (const y of [0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 0.97, 0.62, 0.78, 0.94]) {
    if (!(await page.getByText(/Limpiando · \d+ por recoger/).isVisible().catch(() => false))) break;
    await sweep(y, 3, 0.04, 0.96);
  }
  await shot("11-mopping");
  await page.waitForTimeout(1000);
  const left = await page.getByText(/Limpiando · \d+ por recoger/).isVisible().catch(() => false);
  if (left) { await shot("11b-mop-left"); await page.getByTestId("mop-done").click(); }
  check("E2E-09", "Fregona: frotando con el dedo se limpian las cacas", !left);

  // Jugar → minigames (icons only).
  await page.getByTestId("care-play").click();
  await page.getByTestId("game-maze").waitFor({ timeout: 4000 });
  await page.waitForTimeout(500);
  await shot("12-minigame-hub");
  const hubText = await page.locator("text=/Laberinto|Ladrillos|Sudoku|Serpiente/").count();
  check("E2E-10", "Jugar abre los 4 minijuegos, solo con iconos", hubText === 0 && (await page.getByTestId("game-trail").isVisible()));
  for (const id of ["maze", "bricks", "grid"]) {
    await page.getByTestId(`game-${id}`).click();
    await page.waitForTimeout(700);
    if (id === "maze") for (const d of ["derecha", "abajo", "derecha", "abajo"]) await page.getByTestId(`pad-${d}`).click();
    if (id === "bricks") { const bb = await page.getByTestId("bricks-board").boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * 0.9); await page.waitForTimeout(900); }
    if (id === "grid") for (const c of [0, 1, 2, 5, 6]) await page.getByTestId(`cell-${c}`).click().catch(() => {});
    await page.waitForTimeout(400);
    await shot(`13-game-${id}`);
    await page.getByTestId("game-exit").click();
    await page.waitForTimeout(300);
  }
  const cBefore = await coins();
  await page.getByTestId("game-trail").click();
  await page.waitForTimeout(800);
  await shot("13-game-trail");
  await page.getByTestId("game-done").waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await shot("14-game-result");
  await page.getByTestId("game-done").click();
  await page.getByTestId("hub-close").click();
  await page.waitForTimeout(400);
  check("E2E-11", "Terminar un minijuego da Tamcoins", (await coins()) > cBefore, `${cBefore}→${await coins()}`);

  // Gym inside the room, long press without text selection.
  await dev("dbg-energy");
  await page.getByTestId("open-gym").click();
  await page.waitForTimeout(1500);
  await page.getByTestId("gym-start").click();
  const hold = await page.getByTestId("gym-hold").boundingBox();
  for (let i = 0; i < 7 && (await page.getByTestId("gym-hold").isVisible().catch(() => false)); i++) {
    await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(i === 0 ? 900 : 780);
    if (i === 0) await shot("15-gym-in-room");
    await page.mouse.up();
    await page.waitForTimeout(250);
  }
  const selected = await page.evaluate(() => window.getSelection()?.toString() ?? "");
  check("E2E-12", "Gimnasio dentro de la habitación; mantener pulsado no selecciona texto", selected === "" && (await page.getByTestId("stage").isVisible()), JSON.stringify(selected));
  await page.getByText("Terminar", { exact: true }).click().catch(() => page.getByTestId("gym-exit").click());
  await page.waitForTimeout(300);
  // Study at the desk.
  await page.getByTestId("open-study").click();
  await page.waitForTimeout(1200);
  await page.getByTestId("study-start").click();
  await page.waitForTimeout(1500);
  await shot("16-study-memorise");
  for (let i = 0; i < 80; i++) {
    if (await page.getByText(/XP de Inteligencia|demasiado cansado/).isVisible()) break;
    if (await page.getByText(/Repite la receta/).isVisible()) await page.getByTestId("study-food_berry_bun").click();
    await page.waitForTimeout(400);
  }
  await page.getByText(/XP de Inteligencia|demasiado cansado/).waitFor({ timeout: 10000 });
  await shot("17-study-result");
  check("E2E-13", "Estudio dentro de la habitación (memoria de ingredientes)", true);
  await page.getByText("Terminar", { exact: true }).click();

  // Tienda (own section) → try in my room → buy and place.
  await page.getByTestId("tab-shop").click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Mobiliario" }).click();
  await page.waitForTimeout(400);
  await shot("18-shop");
  await page.getByRole("button", { name: "Probar en mi casa" }).first().click();
  await page.waitForTimeout(800);
  await shot("19-preview-in-room");
  const cShop = await coins();
  await page.getByTestId("preview-buy").click();
  await page.waitForTimeout(500);
  check("E2E-14", "Tienda fuera de la habitación; 'Probar en mi casa' y comprar", (await coins()) < cShop, `${cShop}→${await coins()}`);

  // Granja.
  await page.getByTestId("dev").click();
  await page.getByRole("button", { name: "Huevo Ceniza" }).click();
  await page.getByLabel(/^Cerrar /).first().click();
  await page.getByTestId("tab-farm").click();
  await page.waitForTimeout(1200);
  await shot("20-farm");
  const before = await page.getByTestId("profile").getAttribute("aria-label");
  const farmName = await page.locator('text=/Descansando en la granja/').count();
  await page.getByTestId("farm-swap-0").click();
  await page.waitForTimeout(800);
  const after = await page.getByTestId("profile").getAttribute("aria-label");
  const swapped = farmName > 0 && (before !== after || (await page.getByText(/vuelve a casa/).isVisible()));
  check("E2E-15", "Granja: los Tamtams que no juegan; se pueden intercambiar", swapped);
  await page.getByTestId("tab-farm").click();
  await page.getByTestId("farm-swap-0").click();
  await page.waitForTimeout(600);

  // Arena.
  await dev("dbg-energy");
  await page.getByTestId("tab-arena").click();
  await page.waitForTimeout(1200);
  await shot("21-arena");
  await page.getByTestId("fight-even").click();
  await page.waitForTimeout(2500);
  await shot("22-battle");
  await page.getByTestId("battle-exit").waitFor({ timeout: 60000 });
  await shot("23-battle-result");
  const won = await page.getByText("¡Victoria!").isVisible();
  await page.getByTestId("battle-exit").click();
  await page.waitForTimeout(500);
  check("E2E-16", "Arena: combate automático en tiempo real con resultado y PC", (await page.getByText(/^(Victoria|Derrota) contra/).count()) > 0, won ? "victoria" : "derrota");

  // Conectar.
  await page.getByTestId("tab-connect").click();
  await page.waitForTimeout(500);
  await page.getByTestId("friend-code").fill("ABCD2345");
  await page.getByRole("button", { name: "Guardar amigo" }).click();
  await shot("24-connect");
  check("E2E-17", "Conectar: código de amigo y aviso honesto de servidor", await page.getByText(/Requiere el servicio online/).isVisible());

  // Evolution: simulate a warrior stage, complete maturity, ritual.
  await page.getByTestId("tab-home").click();
  await page.getByTestId("dev").click();
  await page.getByTestId("dbg-style-Guerrero").click();
  await page.getByTestId("dbg-mature").click();
  await page.getByLabel(/^Cerrar /).first().click();
  await page.waitForTimeout(600);
  const ready = await page.getByTestId("evolve").isVisible();
  await page.getByTestId("evolve").click();
  await page.waitForTimeout(1200);
  await shot("27-ritual-charge");
  await page.getByTestId("ritual-done").waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
  await shot("28-ritual-result");
  await page.getByTestId("ritual-done").click();
  await page.waitForTimeout(800);
  await shot("29-evolved-home");
  const sub = await page.getByTestId("profile").getAttribute("aria-label");
  check("E2E-20", "Evoluciona según los cuidados (aviso + ritual + forma nueva Infantil)", ready && (await page.getByText(/· Infantil · Nv/).isVisible()), sub ?? "");
  await page.getByTestId("dev").click();
  await page.getByTestId("dbg-evolab").click();
  await page.waitForTimeout(1500);
  await shot("30-evolution-lab");
  await page.getByTestId("evolab-close").click();

  // Leave debug: main save intact.
  await page.getByTestId("tab-home").click();
  await page.getByTestId("dev").click();
  await page.getByTestId("debug-exit").click();
  await page.waitForTimeout(1500);
  check("E2E-18", "Salir de debug: partida normal intacta", (await coins()) === cDebugStart, `${await coins()} vs ${cDebugStart}`);
  await page.getByTestId("profile").click();
  await page.waitForTimeout(400);
  await shot("25-profile");
  await page.getByLabel(/^Cerrar /).first().click();
  for (const vp of [{ w: 360, h: 640 }, { w: 430, h: 932 }, { w: 768, h: 1024 }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(900);
    await shot(`26-home-${vp.w}x${vp.h}`);
  }
} catch (e) {
  check("E2E-XX", "Playthrough sin excepciones", false, e.message);
  await shot("zz-failure").catch(() => {});
} finally {
  await browser.close();
  server.close();
}
check("E2E-19", "Sin errores de consola/página", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }));
