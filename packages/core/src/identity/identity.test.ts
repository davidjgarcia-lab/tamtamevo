import { describe, expect, it } from "vitest";
import { applyEvolution, ageInDays, defaultName, graphemeLength, hatchTamtam, NameRejected, normalizeName, renameTamtam, validateName } from "../index";

const hatch = (requestedName: string, id = "t-1") =>
  hatchTamtam({
    id,
    speciesId: "fire",
    formId: "fire_baby_chispin",
    requestedName,
    bornAt: 1_000,
    personality: ["playful"],
    affinity: { primary: "fire", secondary: "fire" },
  });

describe("validateName", () => {
  it.each([
    ["Ñandú", "Ñandú"],
    ["  José   María ", "José María"],
    ["Zoë", "Zoë"],
    ["Ça va", "Ça va"],
    ["雪", null], // single grapheme → too short
    ["雪花", "雪花"],
    ["Brasa 2", "Brasa 2"],
    ["O'Neill", "O'Neill"],
    ["Fuego🔥", "Fuego🔥"],
  ])("accepts %j", (raw, expected) => {
    const r = validateName(raw);
    if (expected === null) expect(r).toEqual({ ok: false, error: "too_short" });
    else expect(r).toEqual({ ok: true, name: expected });
  });

  it("normalises decomposed accents to NFC", () => {
    const decomposed = "José"; // e + combining acute
    const r = validateName(decomposed);
    expect(r.ok && r.name).toBe("José");
    expect(r.ok && r.name.length).toBe(4);
  });

  it("counts graphemes, not UTF-16 units", () => {
    expect(graphemeLength("Ñandú")).toBe(5);
    expect(graphemeLength("👩‍🚀")).toBe(1);
    expect(graphemeLength("🔥🔥")).toBe(2);
  });

  it("enforces configurable lengths", () => {
    expect(validateName("A")).toEqual({ ok: false, error: "too_short" });
    expect(validateName("Abcdefghijklmnopq")).toEqual({ ok: false, error: "too_long" }); // 17
    expect(validateName("Abcdefghijklmnop").ok).toBe(true); // 16
    expect(validateName("Ab", { minLength: 3, maxLength: 5, blocklist: [] })).toEqual({ ok: false, error: "too_short" });
  });

  it("rejects empty, invisible, control and symbol-only names", () => {
    expect(validateName("   ")).toEqual({ ok: false, error: "empty" });
    expect(validateName("Ab\u0007c")).toEqual({ ok: false, error: "invalid_characters" });
    expect(validateName("Ab​c")).toEqual({ ok: false, error: "invalid_characters" });
    expect(validateName("<script>")).toEqual({ ok: false, error: "invalid_characters" });
    expect(validateName("🔥🔥")).toEqual({ ok: false, error: "no_letters" });
    expect(validateName("--")).toEqual({ ok: false, error: "no_letters" });
  });

  it("blocks offensive words regardless of accents and case", () => {
    expect(validateName("MIERDA")).toEqual({ ok: false, error: "blocked" });
    expect(validateName("Imbécil")).toEqual({ ok: false, error: "blocked" });
    expect(validateName("Gran Mierda")).toEqual({ ok: false, error: "blocked" });
    expect(validateName("Mierdasoft").ok).toBe(true); // whole-word match only
  });

  it("collapses whitespace", () => {
    expect(normalizeName("\tLa \n Brasa ")).toBe("La Brasa");
  });
});

describe("Tamtam identity", () => {
  it("uses the typed name, or a deterministic themed default", () => {
    expect(hatch("Pimpollo").name).toBe("Pimpollo");
    const a = hatch("", "abc");
    expect(a.name).toBe(defaultName("fire", "abc"));
    expect(hatch("", "abc").name).toBe(a.name);
  });

  it("rejects invalid names at birth", () => {
    expect(() => hatch("x")).toThrow(NameRejected);
  });

  it("keeps its name and identity through evolution", () => {
    const t = hatch("Pimpollo");
    const e1 = applyEvolution(t, { formId: "fire_child_fogarin", stage: "child" }, 2_000, 1);
    const e2 = applyEvolution(e1, { formId: "fire_juvenile_brasko", stage: "juvenile" }, 3_000, 1);
    expect(e2.name).toBe("Pimpollo");
    expect(e2.id).toBe(t.id);
    expect(e2.evolutionHistory.map((h) => h.to)).toEqual(["fire_child_fogarin", "fire_juvenile_brasko"]);
  });

  it("renames freely and records history; each Tamtam has its own name", () => {
    const a = hatch("Brasa", "a");
    const b = hatch("Brasa", "b");
    const a2 = renameTamtam(a, "Tizón", 5_000);
    expect(a2.name).toBe("Tizón");
    expect(a2.nameHistory.map((h) => h.name)).toEqual(["Brasa", "Tizón"]);
    expect(b.name).toBe("Brasa");
    expect(renameTamtam(a2, " Tizón ", 6_000)).toBe(a2); // no-op
    expect(() => renameTamtam(a2, "", 6_000)).toThrow(NameRejected);
  });

  it("computes age from birth time", () => {
    expect(ageInDays(hatch("Brasa"), 1_000 + 3 * 86_400_000 + 5)).toBe(3);
  });
});
