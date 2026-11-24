import { describe, expect, it } from "vitest";
import { countSolutions, generateRegions } from "./regions";
describe("region puzzle", () => {
  it("generates boards with exactly one solution for sizes 5–8", () => {
    for (const n of [5, 6, 7, 8]) {
      const p = generateRegions(n, 100 + n);
      expect(countSolutions(n, p.regions, 3)).toBe(1);
      expect(new Set(p.regions).size).toBe(n);
    }
  });
});
