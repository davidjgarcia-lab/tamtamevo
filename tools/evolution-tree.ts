// Simulates the evolution of every starter under typical care styles and writes docs/EVOLUTION_COMBINATIONS.md.
// Usage: node --no-warnings --experimental-transform-types --import ./tools/ts/register.mjs tools/evolution-tree.ts
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evolvedLook, FAMILIES, formName, GAITS, nextLine, rollEvolution, STARTERS, starterGenome, type CareProfile, type FamilyId, type Genome } from "../packages/core/src/index.ts";

const STYLES: [string, CareProfile][] = [
  ["Guerrero", { care: 0.7, affection: 0.4, hygiene: 0.5, training: 0.9, fighting: 1, study: 0.1, play: 0.2, neglect: 0.3 }],
  ["Limpio y estudioso", { care: 0.85, affection: 0.6, hygiene: 0.95, training: 0.2, fighting: 0.1, study: 0.9, play: 0.2, neglect: 0.15 }],
  ["Mimado", { care: 0.9, affection: 0.95, hygiene: 0.7, training: 0.1, fighting: 0.1, study: 0.2, play: 0.4, neglect: 0.1 }],
  ["Jugón", { care: 0.75, affection: 0.6, hygiene: 0.8, training: 0.4, fighting: 0.1, study: 0.2, play: 0.95, neglect: 0.25 }],
  ["Descuidado", { care: 0.3, affection: 0.2, hygiene: 0.25, training: 0, fighting: 0, study: 0, play: 0, neglect: 0.7 }],
] as never;
const STAGES = ["child", "juvenile", "adult"];
const GAIT_ES: Record<string, string> = { walk: "camina", heavy: "pesado", dash: "veloz", fly: "vuela", float: "flota", slither: "repta/serpentea", bounce: "rebota" };
const N = 500;
const name = (f: FamilyId) => FAMILIES[f].name;
const pct = (x: number) => `${Math.round(x * 100)} %`;

let md = `# Combinaciones de evolución (generado)

> GENERADO por \`tools/evolution-tree.ts\` con el algoritmo real del juego (\`packages/core/src/genetics\`).
> ${STARTERS.length} iniciales × ${STYLES.length} estilos de cuidado × ${N} crías simuladas hasta Adulto.

## Reglas de aspecto y física

| Qué | Lo decide | Ejemplo |
|---|---|---|
| Dibujo de cada etapa | La **línea evolutiva**: la del inicial, hasta que otra familia tiene más piezas que ella y al menos 3 de 5 (entonces la línea se ramifica) | Aqualin que gana 3 piezas de cristal → pasa a la línea de Diamor |
| Etapa del dibujo | Bebé → inicial del huevo · Infantil → inicial · Juvenil → intermedia · Adulto → final | — |
| **Física (cómo se mueve)** | La familia de las **patas** y la etapa | cuerpo de fuego + patas de Lúmina → vuela |
| Aura de híbrido | La **segunda familia**, si tiene 2 piezas o más | Brasildo con 2 piezas de sombra → aura violeta |
| Partículas | La familia del **lomo** | lomo eléctrico → chispas |
| Colores raros | Mutaciones: melánico, albino, aurora, iridiscente | — |
| Nombre | Las dos familias más fuertes | Brasildo + Aqualin → «Brasalin» |

### Física por familia y etapa (bebé · inicial · intermedia · final)

| Familia | Física |
|---|---|
${(Object.keys(GAITS) as FamilyId[]).map((f) => `| ${name(f)} | ${(["baby", "initial", "intermediate", "final"] as const).map((s) => GAIT_ES[GAITS[f][s]]).join(" · ")} |`).join("\n")}

`;

for (const st of STARTERS) {
  md += `## ${st.species} (${st.title}) — ${st.traitLabels.join(", ")}\n\n`;
  md += `| Cuidado | Adulto más probable | Otras salidas | Híbridos | Física de adulto más común | Ejemplo de línea |\n|---|---|---|---|---|---|\n`;
  STYLES.forEach(([label, prof], si) => {
    const adult = new Map<FamilyId, number>();
    const gait = new Map<string, number>();
    let hybrids = 0;
    let example = "";
    for (let i = 0; i < N; i++) {
      let g: Genome = starterGenome(st);
      const line: string[] = [st.species];
      STAGES.forEach((stage, k) => {
        const prev = g.line ?? st.family;
        g = rollEvolution(g, prof, (i + 1) * 7919 + si * 104729 + k * 31337 + st.id.length * 17).genome;
        g = { ...g, line: nextLine(prev, g) };
        if (i === 0) line.push(formName(g, 1));
      });
      const look = evolvedLook(g, "adult");
      adult.set(look.art, (adult.get(look.art) ?? 0) + 1);
      gait.set(look.gait, (gait.get(look.gait) ?? 0) + 1);
      if (look.secondary) hybrids++;
      if (i === 0) example = line.join(" → ");
    }
    const ranked = [...adult.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0]!;
    const others = ranked.slice(1, 4).map(([f, n]) => `${name(f)} ${pct(n / N)}`).join(", ");
    const g0 = [...gait.entries()].sort((a, b) => b[1] - a[1])[0]!;
    md += `| ${label} | **${name(top[0])}** ${pct(top[1] / N)} | ${others} | ${pct(hybrids / N)} | ${GAIT_ES[g0[0]]} (${pct(g0[1] / N)}) | ${example} |\n`;
  });
  md += "\n";
}
writeFileSync(resolve(import.meta.dirname, "../docs/EVOLUTION_COMBINATIONS.md"), md);
console.log("docs/EVOLUTION_COMBINATIONS.md", md.length, "chars");
