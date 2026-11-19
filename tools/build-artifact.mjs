// Builds a self-hostable copy of the web prototype (relative paths, branded preloader).
// Usage: node tools/build-artifact.mjs   (after `pnpm --filter mobile web:build`)
// Output: apps/mobile/dist-artifact/
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const app = resolve(import.meta.dirname, "../apps/mobile");
const src = join(app, "dist");
const out = join(app, "dist-artifact");
if (!existsSync(join(src, "index.html"))) throw new Error("Run `pnpm --filter mobile web:build` first");
rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true });
mkdirSync(join(out, "brand"), { recursive: true });
copyFileSync(join(app, "assets/brand/logo-640.png"), join(out, "brand/logo.png"));
copyFileSync(join(app, "assets/brand/favicon.png"), join(out, "brand/favicon.png"));

// 0) Hosts may reserve names starting with "_" (artifact server): move them.
renameSync(join(out, "_expo/static/js/web"), join(out, "js"));
rmSync(join(out, "_expo"), { recursive: true, force: true });
if (existsSync(join(out, "assets/__node_modules"))) renameSync(join(out, "assets/__node_modules"), join(out, "assets/node_modules"));
rmSync(join(out, "metadata.json"), { force: true });

// 1) JS bundle: absolute asset URLs → relative.
const jsDir = join(out, "js");
for (const f of readdirSync(jsDir)) {
  const p = join(jsDir, f);
  const before = readFileSync(p, "utf8");
  const after = before.replaceAll('"/assets/__node_modules/', '"./assets/node_modules/').replaceAll('"/assets/', '"./assets/');
  writeFileSync(p, after);
  console.log(`bundle ${f}: ${(before.match(/"\/assets\//g) ?? []).length} asset URLs made relative`);
}

// 2) index.html: relative script, brand head, preloader shown until React mounts (#root is replaced).
let html = readFileSync(join(out, "index.html"), "utf8");
html = html
  .replace('<html lang="en">', '<html lang="es">')
  .replace(/<title>.*<\/title>/, "<title>TamTam EVO — Prototipo</title>")
  .replace(/src="\/_expo\/static\/js\/web\//, 'src="./js/')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="./brand/favicon.png"/>')
  .replace("</head>", `  <meta name="theme-color" content="#17132B"/>
  <style>
    html,body{background:#17132B;margin:0}
    .boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#17132B;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    .boot:before{content:"";position:absolute;width:420px;height:420px;border-radius:50%;top:18%;background:#8B42F6;filter:blur(90px);opacity:.45;animation:glow 2.8s ease-in-out infinite}
    .boot img{position:relative;width:300px;max-width:80vw;animation:pulse 2.8s ease-in-out infinite}
    .boot p{position:relative;margin:0;color:#00D4FF;font-weight:700;letter-spacing:.3px;text-align:center}
    .boot .bar{position:absolute;bottom:64px;left:32px;right:32px;height:8px;border-radius:4px;background:#30294F;overflow:hidden}
    .boot .bar i{display:block;height:100%;width:35%;border-radius:4px;background:#00D4FF;animation:load 1.6s ease-in-out infinite}
    .boot small{position:absolute;bottom:36px;color:#9A92C2;font-size:12px}
    @keyframes pulse{50%{transform:scale(1.035)}}
    @keyframes glow{50%{opacity:.7}}
    @keyframes load{0%{margin-left:-35%}100%{margin-left:100%}}
    @media (prefers-reduced-motion:reduce){.boot img,.boot:before,.boot .bar i{animation:none}}
  </style>
</head>`)
  .replace(
    '<div id="root"></div>',
    `<div id="root"><div class="boot" role="status" aria-label="Cargando TamTam Evolution"><img src="./brand/logo.png" alt="TamTam Evolution"/><p>Un mundo de criaturas que crecen contigo.</p><div class="bar"><i></i></div><small>Cargando el motor gráfico…</small></div></div>`,
  );
writeFileSync(join(out, "index.html"), html);
const size = (d) => readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(join(d, e.name)) : readFileSync(join(d, e.name)).length), 0);
console.log(`dist-artifact ready: ${(size(out) / 1048576).toFixed(1)} MB`);
