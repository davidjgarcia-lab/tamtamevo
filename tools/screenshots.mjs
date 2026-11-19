// Visual QA: serves the web export and captures the Rig Lab in several viewports and states.
// Usage: node tools/screenshots.mjs [outDir]   (run `pnpm web:build` first)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

// Use the project's Playwright if installed, otherwise the machine-wide one.
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(join(execSync("npm root -g").toString().trim(), "playwright"));
}
const { chromium } = playwright;

const root = resolve(import.meta.dirname, "../apps/mobile/dist");
const out = resolve(process.argv[2] ?? "screenshots");
mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const file = join(root, url === "/" ? "index.html" : url);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const port = server.address().port;

const viewports = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
];
const errors = [];
const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errors.push(`[${vp.name}] ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`[${vp.name}] console: ${m.text()}`));
    await page.goto(`http://localhost:${port}/`);
    await page.getByText("Reposo").waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(out, `${vp.name}-idle.png`) });
    if (vp.name === "390x844") {
      for (const [label, wait] of [["Caminar", 1200], ["Comer", 700], ["Caricia", 1000], ["Dormir", 2200]]) {
        await page.getByText(label, { exact: true }).click();
        await page.waitForTimeout(wait);
        await page.screenshot({ path: join(out, `${vp.name}-${label.toLowerCase()}.png`) });
      }
      await page.getByText("Reposo", { exact: true }).click();
      for (const allele of ["Azul Llama", "Rubí Profundo", "Ceniza", "Oro Fundido"]) {
        await page.getByText(allele, { exact: true }).click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(out, `${vp.name}-color-${allele.split(" ")[0].toLowerCase()}.png`) });
      }
      const fps = await page.locator('[aria-label$="fotogramas por segundo"]').getAttribute("aria-label");
      console.log(`fps (headless, software rendering): ${fps}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (errors.length) {
  console.error("Errors:\n" + errors.join("\n"));
  process.exitCode = 1;
}
console.log(`Screenshots → ${out}`);
