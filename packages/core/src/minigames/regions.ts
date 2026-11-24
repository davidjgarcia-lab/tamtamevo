/**
 * "One Tamtam per row, column and colour region, none touching" puzzle (references batch 1).
 * Generates N×N boards with a unique solution: place N non-adjacent tokens (one per row/column), grow a
 * region from each one by random flood fill, and keep the board only if the solver finds exactly one solution.
 */
export interface RegionPuzzle {
  n: number;
  regions: number[]; // region id per cell (row-major)
  solution: number[]; // column of the token in each row
}

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Counts solutions (stops at `limit`). */
export function countSolutions(n: number, regions: number[], limit = 2): number {
  return solutions(n, regions, limit).length;
}

export function solutions(n: number, regions: number[], limit = 2): number[][] {
  const out: number[][] = [];
  const colUsed = new Array(n).fill(false), regUsed = new Array(n).fill(false);
  const pos: number[] = [];
  let found = 0;
  const go = (r: number) => {
    if (found >= limit) return;
    if (r === n) { found++; out.push([...pos]); return; }
    for (let c = 0; c < n; c++) {
      const reg = regions[r * n + c]!;
      if (colUsed[c] || regUsed[reg]) continue;
      if (r > 0 && Math.abs(pos[r - 1]! - c) <= 1) continue;
      colUsed[c] = regUsed[reg] = true; pos[r] = c;
      go(r + 1);
      colUsed[c] = regUsed[reg] = false;
    }
  };
  go(0);
  return out;
}

function connected(n: number, reg: number[], id: number): boolean {
  const cells = reg.map((v, i) => (v === id ? i : -1)).filter((i) => i >= 0);
  if (!cells.length) return false;
  const seen = new Set([cells[0]!]);
  const st = [cells[0]!];
  while (st.length) {
    const c = st.pop()!;
    const r = Math.floor(c / n), k = c % n;
    for (const [a, b] of [[r - 1, k], [r + 1, k], [r, k - 1], [r, k + 1]]) {
      if (a! < 0 || b! < 0 || a! >= n || b! >= n) continue;
      const j = a! * n + b!;
      if (reg[j] === id && !seen.has(j)) { seen.add(j); st.push(j); }
    }
  }
  return seen.size === cells.length;
}

/** Breaks alternative solutions by moving single cells to a neighbouring region (keeps regions connected). */
function repair(n: number, reg: number[], sol: number[], r: () => number): boolean {
  const solCells = new Set(sol.map((c, row) => row * n + c));
  for (let it = 0; it < 120; it++) {
    const all = solutions(n, reg, 2);
    if (all.length === 1) return true;
    const alt = all.find((a) => a.some((c, i) => c !== sol[i]))!;
    const rows = [...Array(n).keys()].filter((i) => alt[i] !== sol[i]).sort(() => r() - 0.5);
    let moved = false;
    for (const row of rows) {
      const cell = row * n + alt[row]!;
      if (solCells.has(cell)) continue;
      const k = alt[row]!;
      const nbs = [[row - 1, k], [row + 1, k], [row, k - 1], [row, k + 1]].filter(([a, b]) => a! >= 0 && b! >= 0 && a! < n && b! < n).map(([a, b]) => reg[a! * n + b!]!).filter((v) => v !== reg[cell]);
      for (const target of nbs.sort(() => r() - 0.5)) {
        const old = reg[cell]!;
        reg[cell] = target;
        if (connected(n, reg, old) && connected(n, reg, target)) { moved = true; break; }
        reg[cell] = old;
      }
      if (moved) break;
    }
    if (!moved) return false;
  }
  return countSolutions(n, reg) === 1;
}

export function generateRegions(n: number, seed: number): RegionPuzzle {
  const r = rng(seed);
  for (let attempt = 0; attempt < 400; attempt++) {
    // Non-adjacent permutation.
    const sol: number[] = [];
    const used = new Array(n).fill(false);
    const place = (row: number): boolean => {
      if (row === n) return true;
      const cols = [...Array(n).keys()].sort(() => r() - 0.5);
      for (const c of cols) {
        if (used[c] || (row > 0 && Math.abs(sol[row - 1]! - c) <= 1)) continue;
        used[c] = true; sol[row] = c;
        if (place(row + 1)) return true;
        used[c] = false;
      }
      return false;
    };
    if (!place(0)) continue;
    // Grow regions.
    const reg = new Array(n * n).fill(-1);
    const frontier: number[][] = [];
    for (let i = 0; i < n; i++) { reg[i * n + sol[i]!] = i; frontier.push([i * n + sol[i]!]); }
    let left = n * n - n;
    while (left > 0) {
      const id = Math.floor(r() * n);
      const f = frontier[id]!;
      if (!f.length) continue;
      const cell = f[Math.floor(r() * f.length)]!;
      const row = Math.floor(cell / n), col = cell % n;
      const nb = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].filter(([a, b]) => a! >= 0 && b! >= 0 && a! < n && b! < n && reg[a! * n + b!] === -1);
      if (!nb.length) { f.splice(f.indexOf(cell), 1); continue; }
      const [a, b] = nb[Math.floor(r() * nb.length)]!;
      reg[a! * n + b!] = id; f.push(a! * n + b!); left--;
    }
    if (repair(n, reg, sol, r)) return { n, regions: reg, solution: sol };
  }
  throw new Error("could_not_generate");
}

/** Rule violations of a (partial) placement: cells that break a rule. */
export function conflicts(n: number, regions: number[], tokens: Set<number>): Set<number> {
  const bad = new Set<number>();
  const list = [...tokens];
  for (const a of list) for (const b of list) {
    if (a >= b) continue;
    const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
    if (ra === rb || ca === cb || regions[a] === regions[b] || (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1)) { bad.add(a); bad.add(b); }
  }
  return bad;
}
