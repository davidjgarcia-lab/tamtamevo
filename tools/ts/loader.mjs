// Minimal resolver so Node (type stripping) can run the monorepo's TypeScript sources directly:
// extensionless relative imports → .ts / index.ts.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as r } from "node:path";
export async function resolve(spec, ctx, next) {
  if ((spec.startsWith(".") || spec.startsWith("/")) && ctx.parentURL?.startsWith("file:")) {
    const base = r(dirname(fileURLToPath(ctx.parentURL)), spec);
    for (const c of [base + ".ts", base + "/index.ts", base]) if (existsSync(c) && statSync(c).isFile()) return next(pathToFileURL(c).href, ctx);
  }
  return next(spec, ctx);
}
