using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using static TamTam.EditorTools.Chispin.Paint;

namespace TamTam.EditorTools.Chispin
{
    /// CHISPÍN v3 — port of packages/art/src/fire/chispin.ts (bones, parts, the 14 clips, emitters, colour alleles).
    /// The web prototype stays the reference: if a value changes there, change it here too.
    public static class ChispinData
    {
        static string F(float v) => v.ToString(CultureInfo.InvariantCulture);
        static string Ell(float cx, float cy, float rx, float ry) =>
            $"M {F(cx - rx)} {F(cy)} A {F(rx)} {F(ry)} 0 1 0 {F(cx + rx)} {F(cy)} A {F(rx)} {F(ry)} 0 1 0 {F(cx - rx)} {F(cy)} Z";

        const string TORSO = "M -34 -6 C -36 -19 -22 -25 -4 -25 C 14 -25 30 -21 34 -8 C 37 4 28 14 10 15 L -18 15 C -30 14 -35 6 -34 -6 Z";
        const string BELLY = "M -26 7 C -12 15 12 15 27 6 L 28 11 C 12 19 -12 19 -27 12 Z";
        const string BELLY_LINES = "M -16 11 L -15 16 M -6 13 L -6 18 M 4 13 L 4 18 M 14 11 L 15 16";
        const string NECK = "M -8 -9 C 0 -17 14 -17 19 -10 L 21 7 C 11 11 0 11 -9 7 Z";
        const string NECK_BELLY = "M 1 4 C 8 8 15 8 21 4 L 20 9 C 13 13 6 13 -1 9 Z";
        const string SKULL = "M -16 -9 C -14 -22 1 -26 13 -21 C 23 -17 31 -11 34 -3 C 36 3 31 8 23 8 L -3 10 C -14 11 -20 3 -16 -9 Z";
        const string SNOUT_SHADE = "M 6 4 C 16 6 26 6 33 0 C 34 4 30 8 23 8 L -3 10 C -2 6 2 4 6 4 Z";
        const string JAW = "M -8 5 L 26 6 C 29 10 23 15 14 15 L -2 15 C -10 14 -12 9 -8 5 Z";
        const string MOUTH_IN = "M -4 7 L 24 7 C 22 11 17 13 12 13 L 0 13 C -4 12 -5 10 -4 7 Z";
        const string TONGUE = "M 4 10 C 9 8 15 9 18 11 C 14 13 8 13 4 10 Z";
        const string TEETH = "M 18 7 L 20 11 L 22 7 Z M 10 7 L 12 10 L 14 7 Z";
        const string HORN = "M 0 0 C -6 -6 -14 -9 -22 -9 C -15 -5 -9 -1 -6 4 Z";
        const string HORN2 = "M 0 0 C -4 -5 -10 -8 -16 -8 C -11 -4 -7 0 -5 4 Z";
        const string FLAME_A = "M 0 2 C -8 0 -12 -10 -6 -18 C -4 -24 -6 -28 -2 -34 C 2 -26 10 -22 9 -12 C 10 -4 6 2 0 2 Z";
        const string FLAME_A_IN = "M 0 0 C -4 -1 -6 -7 -3 -11 C -2 -14 -2 -17 0 -21 C 2 -16 5 -13 4 -7 C 5 -3 3 0 0 0 Z";
        const string FLAME_B = "M 0 2 C -7 1 -10 -7 -6 -13 C -4 -17 -5 -20 -2 -25 C 1 -19 7 -16 7 -9 C 7 -3 4 2 0 2 Z";
        const string EYE_WHITE = "M 3 -8 C 7 -14 17 -14 21 -8 C 17 -4 8 -3 3 -8 Z";
        const string LEG_NEAR = "M -10 -6 C -12 3 -7 9 -4 15 C -5 18 -7 21 -6 23.5 C -2 24.5 6 24.5 10 23.5 C 10 21 7 19 5 16 C 8 9 11 0 8 -7 C 3 -10 -6 -10 -10 -6 Z";
        const string LEG_FAR = "M -8 -6 C -10 3 -6 9 -3 15 C -4 18 -6 21 -5 23.5 C -1 24.5 5 24.5 8 23.5 C 8 21 6 19 4 16 C 7 9 9 0 7 -7 C 2 -9 -5 -9 -8 -6 Z";
        const string CLAWS = "M 2 24 L 5 26.5 L 6.5 23.8 Z M 6.5 23.6 L 10 26 L 10.5 22.8 Z M -2 24 L 1 26.5 L 2.5 24 Z";
        static string TailSeg(float l, float w0, float w1) =>
            $"M 4 {F(-w0)} L {F(-l)} {F(-w1)} C {F(-l - 3)} 0 {F(-l - 3)} 0 {F(-l)} {F(w1)} L 4 {F(w0)} C 7 0 7 0 4 {F(-w0)} Z";
        const string TAIL_TIP = "M 4 -4 L -14 -1.5 C -18 0 -18 0 -14 1.5 L 4 4 C 7 0 7 0 4 -4 Z";
        const string SEAM = "M -26 -8 Q -17 -13 -9 -7 Q -1 -1 7 -9 M 6 -17 Q 14 -13 23 -15";

        static Paint Glow(float a) => T("glow", a);
        static Paint Grad(string a, string b, float fx, float fy, float tx, float ty) => G(new[] { a, b }, fx, fy, tx, ty);

        public static RigDef Rig()
        {
            var r = new RigDef { id = "fire_baby_chispin", breathBone = "body", eyeBones = new[] { "eye" } };
            r.bones.AddRange(new[]
            {
                new BoneDef("root", null, 0, 0),
                new BoneDef("body", "root", 0, -36),
                new BoneDef("legBF", "body", -14, 14),
                new BoneDef("legFF", "body", 28, 12),
                new BoneDef("tail1", "body", -30, -2, 8),
                new BoneDef("tail2", "tail1", -18, 0, 6),
                new BoneDef("tail3", "tail2", -16, 0, -6),
                new BoneDef("tail4", "tail3", -14, 0, -10),
                new BoneDef("crest3", "body", 14, -21),
                new BoneDef("neck", "body", 26, -10),
                new BoneDef("crest2", "neck", 2, -13),
                new BoneDef("head", "neck", 16, -14),
                new BoneDef("jaw", "head", 0, 0),
                new BoneDef("crest1", "head", 0, -20),
                new BoneDef("horn", "head", -10, -14),
                new BoneDef("eye", "head", 0, 0),
                new BoneDef("brow", "head", 12, -15),
                new BoneDef("legBN", "body", -20, 14),
                new BoneDef("legFN", "body", 22, 14),
                new BoneDef("prop", "body", 30, -2),
            });
            SecondaryDef S(string bone, string driver, float lag, float gain, float vg, float sa, float sf, float fa = 0, float ff = 0) =>
                new SecondaryDef { bone = bone, driver = driver, lag = lag, gain = gain, velocityGain = vg, swayAmp = sa, swayFreq = sf, flickerAmp = fa, flickerFreq = ff };
            r.secondary.AddRange(new[]
            {
                S("tail1", "body", 0.08f, 0.8f, 0.05f, 3, 0.45f),
                S("tail2", "body", 0.14f, 1.1f, 0.06f, 4, 0.5f),
                S("tail3", "body", 0.2f, 1.3f, 0.08f, 5, 0.55f),
                S("tail4", "body", 0.26f, 1.6f, 0.1f, 7, 0.6f, 0.08f, 2.4f),
                S("crest1", "head", 0.12f, 0.9f, 0.08f, 3, 0.8f, 0.1f, 2.6f),
                S("crest2", "neck", 0.16f, 1.0f, 0.1f, 4, 0.9f, 0.12f, 3.0f),
                S("crest3", "body", 0.2f, 1.2f, 0.12f, 4, 1.0f, 0.12f, 2.8f),
            });

            PartDef P(string id, string bone, string d, float z) { var p = new PartDef(id, bone, d, z); r.parts.Add(p); return p; }
            var ink = T("ink");
            // Emissive glows (behind everything)
            P("crestGlow", "crest1", Ell(-2, -14, 20, 22), 0).Fill(Glow(0.42f)).Blur(12).Emissive();
            P("tailGlow", "tail4", Ell(-14, 0, 9, 9), 0).Fill(Glow(0.6f)).Blur(6).Emissive();
            // Far side
            P("legBF", "legBF", LEG_FAR, 1).Fill(T("baseShade")).Stroke(ink, 2.4f);
            P("legFF", "legFF", LEG_FAR, 1).Fill(T("baseShade")).Stroke(ink, 2.4f);
            // Tail
            P("tail1", "tail1", TailSeg(18, 10, 8.5f), 2).Fill(T("base")).Stroke(ink, 2.4f);
            P("tail2", "tail2", TailSeg(16, 8.5f, 6.5f), 2).Fill(T("base")).Stroke(ink, 2.4f);
            P("tail3", "tail3", TailSeg(14, 6.5f, 4.5f), 2).Fill(T("base")).Stroke(ink, 2.2f);
            P("tail4", "tail4", TAIL_TIP, 2).Fill(T("base")).Stroke(ink, 2f);
            P("band1", "tail1", "M -8 -9 L -11 -8.5 L -11 8.5 L -8 9 Z", 3).Fill(T("ink", 0.85f));
            P("band2", "tail2", "M -7 -7.5 L -10 -7 L -10 7 L -7 7.5 Z", 3).Fill(T("ink", 0.85f));
            P("band3", "tail3", "M -6 -5.5 L -9 -5 L -9 5 L -6 5.5 Z", 3).Fill(T("ink", 0.85f));
            P("tailEmber", "tail4", "M -9 -2.5 C -13 -6 -17 -3 -22 -6 C -19 -1 -18 3 -13 3 C -11 3 -9 1 -9 -2.5 Z", 3).Fill(T("accent")).Emissive();
            // Crest flames
            P("crest3", "crest3", FLAME_B, 3).Fill(Grad("accentLight", "accent", 0, -24, 0, 2)).Emissive();
            P("crest2", "crest2", FLAME_A, 4).Fill(Grad("accentLight", "accent", 0, -32, 0, 2)).Emissive();
            P("crest1", "crest1", FLAME_A, 5).Fill(Grad("accentLight", "accent", 0, -32, 0, 2)).Emissive();
            P("crest1In", "crest1", FLAME_A_IN, 5).Fill(H("#FFF1B8", 0.95f)).Emissive();
            P("crest2In", "crest2", FLAME_A_IN, 4).Fill(H("#FFF1B8", 0.9f)).Emissive();
            // Body
            P("torsoLine", "body", TORSO, 6).Stroke(ink, 5);
            P("torso", "body", TORSO, 7).Fill(G(new[] { "baseLight", "base", "baseShade" }, 0, -25, 0, 15)).Sheen();
            P("scalesTop", "body", "M -24 -18 Q -20 -22 -16 -18 Q -12 -22 -8 -18 Q -4 -22 0 -18 Q 4 -22 8 -18 Q 12 -22 16 -18", 8).Stroke(T("baseShade", 0.9f), 1.6f);
            P("belly", "body", BELLY, 8).Fill(G(new[] { "#F4DDB8", "#D9B48A" }, 0, 6, 0, 18)).Stroke(T("ink", 0.7f), 1.6f);
            P("bellyLines", "body", BELLY_LINES, 8).Stroke(H("#B48A62", 0.9f), 1.2f);
            P("seamGlow", "body", SEAM, 8).Stroke(Glow(0.8f), 4).Blur(3).Emissive();
            P("seam", "body", SEAM, 9).Stroke(T("accent"), 1.6f).Emissive();
            P("spotA", "body", Ell(18, -3, 4.2f, 3), 9).Fill(T("accent")).Emissive();
            P("spotB", "body", Ell(25, 2, 2.4f, 1.8f), 9).Fill(T("accent")).Emissive();
            P("spotC", "body", Ell(-21, -3, 4, 2.8f), 9).Fill(T("accent")).Emissive();
            P("spotD", "body", Ell(-14, 2, 2.2f, 1.6f), 9).Fill(T("accent")).Emissive();
            P("rim", "body", "M -30 -14 C -24 -22 -10 -25 4 -25 C -10 -23 -22 -20 -28 -11 Z", 9).Fill(T("baseLight", 0.9f));
            // Neck and head
            P("neck", "neck", NECK, 10).Fill(Grad("baseLight", "base", 0, -16, 0, 8)).Stroke(ink, 2.4f);
            P("neckBelly", "neck", NECK_BELLY, 10).Fill(H("#EFD3AC"));
            P("jaw", "jaw", JAW, 11).Fill(Grad("base", "baseShade", 0, 5, 0, 15)).Stroke(ink, 2.4f);
            P("jawBelly", "jaw", "M 0 12 C 8 14 16 14 22 11 L 21 14 C 15 16 7 16 1 15 Z", 11).Fill(H("#EFD3AC"));
            P("mouthIn", "head", MOUTH_IN, 11.5f).Fill(H("#3A0E18")).Face("mouth", "open", "grit", "drool", "content");
            P("tongue", "head", TONGUE, 11.6f).Fill(H("#E2566A")).Face("mouth", "open", "drool", "content");
            P("teeth", "head", TEETH, 11.7f).Fill(H("#FFF6E8")).Face("mouth", "open", "grit", "content", "drool");
            P("drool", "jaw", "M 20 13 C 21 18 22 22 20 24 C 18 25 17 21 18 17 Z", 12).Fill(H("#9FE6FF", 0.9f)).Face("mouth", "drool");
            P("horn", "horn", HORN, 11.8f).Fill(Grad("#2A1820", "#5A3A44", -20, -8, 0, 4)).Stroke(ink, 1.6f);
            P("horn2", "horn", HORN2, 11.8f).Fill(Grad("#2A1820", "#5A3A44", -16, -8, 0, 4)).Stroke(ink, 1.4f);
            P("skullLine", "head", SKULL, 12).Stroke(ink, 4.5f);
            P("skull", "head", SKULL, 13).Fill(Grad("baseLight", "base", 0, -24, 0, 10)).Sheen();
            P("snoutShade", "head", SNOUT_SHADE, 14).Fill(T("baseShade", 0.75f));
            P("headSeam", "head", "M -12 -6 Q -6 -12 2 -12", 14).Stroke(T("accent"), 1.4f).Emissive();
            P("headScales", "head", "M -10 -16 Q -6 -19 -2 -16 Q 2 -19 6 -17", 14).Stroke(T("baseShade"), 1.3f);
            P("nostril", "head", Ell(28, -5, 1.4f, 1), 14).Fill(ink);
            P("mouthLine", "head", "M 6 6 Q 16 7 30 3", 14).Stroke(ink, 1.8f).Face("mouth", "smile", "chew", "o", "sad", "angry");
            P("mouthSmile", "head", "M 4 5 Q 6 8 9 6", 14).Stroke(ink, 1.8f).Face("mouth", "smile", "chew");
            P("fang", "head", "M 22 5 L 23.5 9.5 L 25 5 Z", 14).Fill(H("#FFF6E8")).Stroke(ink, 0.8f).Face("mouth", "smile", "angry");
            // Eye: luminous almond, amber slit pupil
            P("eyeGlow", "eye", Ell(12, -8, 11, 7), 14.5f).Fill(H("#FFF0C8", 0.55f)).Blur(4).Emissive().Face("eyes", "open");
            P("eyeWhite", "eye", EYE_WHITE, 15).Fill(H("#FFF8EC")).Stroke(ink, 1.6f).Face("eyes", "open");
            P("iris", "eye", Ell(13, -8.6f, 3.4f, 4.2f), 16).Fill(Grad("accentLight", "eye", 0, -13, 0, -4)).Face("eyes", "open");
            P("pupil", "eye", "M 13 -12.2 C 14.2 -10 14.2 -7 13 -4.8 C 11.8 -7 11.8 -10 13 -12.2 Z", 17).Fill(H("#1A0C10")).Face("eyes", "open");
            P("eyeShine", "eye", Ell(15.2f, -10.4f, 1.2f, 1.2f), 18).Fill(H("#FFFFFF")).Face("eyes", "open");
            P("eyeClosed", "eye", "M 3 -8 Q 12 -4 21 -8", 15).Stroke(ink, 2.2f).Face("eyes", "closed");
            P("eyeHappy", "eye", "M 3 -7 Q 12 -14 21 -7", 15).Stroke(ink, 2.2f).Face("eyes", "happy");
            P("browN", "brow", "M -10 0 Q 0 -4 10 -1", 19).Stroke(ink, 2.6f).Face("brows", "neutral");
            P("browH", "brow", "M -10 0 Q 0 -6 10 -2", 19).Stroke(ink, 2.4f).Face("brows", "happy");
            P("browA", "brow", "M -10 -3 Q 0 -2 10 4", 19).Stroke(ink, 3).Face("brows", "angry", "determined");
            P("browS", "brow", "M -10 3 Q 0 -2 10 -4", 19).Stroke(ink, 2.4f).Face("brows", "sad");
            P("browU", "brow", "M -10 -3 Q 0 -9 10 -4", 19).Stroke(ink, 2.4f).Face("brows", "surprised");
            // Near legs
            P("legBN", "legBN", LEG_NEAR, 20).Fill(Grad("base", "baseShade", 0, -4, 0, 24)).Stroke(ink, 2.4f);
            P("legFN", "legFN", LEG_NEAR, 20).Fill(Grad("base", "baseShade", 0, -4, 0, 24)).Stroke(ink, 2.4f);
            P("kneeB", "legBN", "M -6 8 Q 0 12 6 8", 20.5f).Stroke(T("baseShade"), 1.4f);
            P("kneeF", "legFN", "M -6 8 Q 0 12 6 8", 20.5f).Stroke(T("baseShade"), 1.4f);
            P("clawsB", "legBN", CLAWS, 21).Fill(H("#F2E2C8")).Stroke(ink, 0.8f);
            P("clawsF", "legFN", CLAWS, 21).Fill(H("#F2E2C8")).Stroke(ink, 0.8f);
            P("legSpotB", "legBN", Ell(0, 6, 2.4f, 1.8f), 21).Fill(T("accent")).Emissive();
            P("legSpotF", "legFN", Ell(0, 7, 2.2f, 1.6f), 21).Fill(T("accent")).Emissive();
            // Form-quality ornaments (lustre tiers) — built as toggleable layers, hidden by default.
            P("sootA", "body", Ell(-12, -12, 8, 4), 9.5f).Fill(H("#2B2226", 0.55f)).Blur(2).Tiers(0, 1);
            P("sootB", "body", Ell(12, 4, 6, 3), 9.5f).Fill(H("#2B2226", 0.5f)).Blur(2).Tiers(0, 1);
            P("sootC", "head", Ell(4, -4, 5, 3), 14.2f).Fill(H("#2B2226", 0.45f)).Blur(1.5f).Tiers(0, 0);
            P("goldSeam", "body", "M -20 6 Q -8 2 4 6 Q 14 9 24 4", 9).Stroke(H("#FFE9A8"), 1.4f).Tiers(3, 4).Emissive();
            P("goldScaleA", "head", Ell(-6, -10, 1.6f, 1.2f), 14.3f).Fill(H("#FFE9A8")).Tiers(3, 4).Emissive();
            P("goldScaleB", "head", Ell(-2, -14, 1.3f, 1), 14.3f).Fill(H("#FFE9A8")).Tiers(3, 4).Emissive();
            P("rune", "body", "M -4 -6 C 2 -6 4 -11 0 -13 C -5 -15 -10 -10 -8 -4 C -6 2 4 3 8 -3", 9.6f).Stroke(Glow(0.95f), 1.8f).Tiers(4, 4).Emissive();
            P("runeGlow", "body", Ell(-1, -6, 11, 8), 8.5f).Fill(Glow(0.4f)).Blur(6).Tiers(4, 4).Emissive();
            var crown = new[] { (-6f, -30f), (6f, -36f), (16f, -30f) };
            for (int i = 0; i < crown.Length; i++)
                P($"crown{i}", "crest1", Ell(crown[i].Item1, crown[i].Item2, 2.2f, 2.2f), 5.5f).Fill(H("#FFF4C2")).Tiers(4, 4).Emissive();
            // Props
            P("dumbbellBar", "prop", "M -2 -16 L 2 -16 L 2 16 L -2 16 Z", 22).Fill(H("#6E6A78")).Stroke(H("#1C1530"), 1.6f).Face("prop", "dumbbell");
            P("dumbbellA", "prop", "M -7 -24 L 7 -24 L 7 -16 L -7 -16 Z", 22).Fill(Grad("#9A94B0", "#4A4558", -7, 0, 7, 0)).Stroke(H("#1C1530"), 1.6f).Face("prop", "dumbbell");
            P("dumbbellB", "prop", "M -7 16 L 7 16 L 7 24 L -7 24 Z", 22).Fill(Grad("#9A94B0", "#4A4558", -7, 0, 7, 0)).Stroke(H("#1C1530"), 1.6f).Face("prop", "dumbbell");
            return r;
        }

        // ── Clips ────────────────────────────────────────────────────────────
        static Key K(float t, float v, Ease e = Ease.InOut) => new Key(t, v, e);
        static Key[] LoopK(float[] vals, float dur) => vals.Select((v, i) => new Key(dur * i / (vals.Length - 1), v)).ToArray();
        static Key[] C(float v) => new[] { new Key(0, v) };
        static FaceKey FK(float t, string v) => new FaceKey(t, v);

        public static List<ClipDef> Clips()
        {
            var list = new List<ClipDef>();
            ClipDef Clip(string id, float dur, bool loop) { var c = new ClipDef(id, dur, loop); list.Add(c); return c; }

            Clip("idle", 2.8f, true)
                .Track("neck", "rot", LoopK(new[] { 0f, -3, 0, 2, 0 }, 2.8f))
                .Track("head", "rot", K(0, 0), K(1.0f, 0), K(1.2f, -6), K(1.9f, -6), K(2.1f, 0), K(2.8f, 0))
                .Track("tail1", "rot", LoopK(new[] { 8f, 14, 8, 2, 8 }, 2.8f));

            const float S = 0.3f;
            Key[] GaitRot(int ph) => ph == 0 ? new[] { K(0, -18), K(S, 18, Ease.Linear), K(2 * S, -18) } : new[] { K(0, 18, Ease.Linear), K(S, -18), K(2 * S, 18) };
            Key[] GaitY(int ph) => ph == 0 ? new[] { K(0, 0), K(S, 0), K(1.5f * S, -4), K(2 * S, 0) } : new[] { K(0, 0), K(0.5f * S, -4), K(S, 0), K(2 * S, 0) };
            var walk = Clip("walk", 2 * S, true); walk.breath = 0.3f;
            foreach (var (b, ph) in new[] { ("legFN", 0), ("legBF", 0), ("legFF", 1), ("legBN", 1) }) walk.Track(b, "rot", GaitRot(ph)).Track(b, "y", GaitY(ph));
            walk.Track("body", "y", LoopK(new[] { 0f, -2.5f, 0, -2.5f, 0 }, 2 * S)).Track("body", "rot", LoopK(new[] { -1.5f, 1.5f, -1.5f }, 2 * S))
                .Track("neck", "rot", LoopK(new[] { -2f, 2, -2, 2, -2 }, 2 * S)).Track("tail1", "rot", LoopK(new[] { 4f, 12, 4 }, 2 * S));

            const float R = 0.18f;
            var run = Clip("run", 2 * R, true); run.breath = 0.2f; run.flicker = 1.4f;
            run.Track("legFN", "rot", K(0, -35), K(R, 35), K(2 * R, -35)).Track("legFF", "rot", K(0, -25), K(R, 40), K(2 * R, -25))
               .Track("legBN", "rot", K(0, 35), K(R, -35), K(2 * R, 35)).Track("legBF", "rot", K(0, 40), K(R, -25), K(2 * R, 40))
               .Track("body", "y", LoopK(new[] { 0f, -7, 0 }, 2 * R)).Track("body", "rot", LoopK(new[] { -4f, 3, -4 }, 2 * R))
               .Track("neck", "rot", C(8)).Track("tail1", "rot", C(-6)).Face("brows", FK(0, "determined"));

            var eat = Clip("eat", 2.2f, true); eat.flicker = 1.2f;
            eat.Face("mouth", FK(0, "smile"), FK(0.25f, "open"), FK(0.5f, "chew"), FK(0.7f, "open"), FK(0.9f, "chew"), FK(1.1f, "open"), FK(1.3f, "chew"), FK(1.8f, "content"))
               .Face("eyes", FK(0, "open"), FK(0.5f, "happy"), FK(1.6f, "open"), FK(1.8f, "happy")).Face("brows", FK(0, "happy"))
               .Track("neck", "rot", K(0, 0), K(0.25f, 32, Ease.Out), K(1.4f, 30), K(1.7f, -4), K(2.2f, 0))
               .Track("head", "rot", K(0, 0), K(0.25f, 18), K(1.4f, 16), K(1.7f, -8), K(2.2f, 0))
               .Track("jaw", "rot", K(0, 0), K(0.25f, 22), K(0.5f, 2), K(0.7f, 18), K(0.9f, 2), K(1.1f, 18), K(1.3f, 2), K(1.8f, 8), K(2.2f, 0))
               .Track("body", "sy", K(0, 1), K(0.25f, 0.97f), K(1.6f, 1)).Track("tail1", "rot", LoopK(new[] { 8f, 18, 8, 18, 8 }, 2.2f));

            var pet = Clip("pet", 1.6f, true); pet.blink = false; pet.flicker = 1.4f;
            pet.Face("eyes", FK(0, "happy")).Face("mouth", FK(0, "content")).Face("brows", FK(0, "happy"))
               .Track("neck", "rot", C(-14)).Track("head", "rot", LoopK(new[] { -14f, -6, -14 }, 1.6f)).Track("jaw", "rot", C(8))
               .Track("body", "rot", LoopK(new[] { -2f, 2, -2 }, 1.6f)).Track("body", "sy", LoopK(new[] { 1f, 0.97f, 1, 0.97f, 1 }, 1.6f))
               .Track("tail1", "rot", LoopK(new[] { 0f, 26, 0, 26, 0 }, 1.6f)).Track("tail2", "rot", LoopK(new[] { 6f, -10, 6, -10, 6 }, 1.6f));

            var sleep = Clip("sleep", 3.6f, true); sleep.breath = 2.4f; sleep.breathRate = 0.28f; sleep.blink = false; sleep.flicker = 0.35f;
            sleep.Face("eyes", FK(0, "closed")).Face("mouth", FK(0, "smile")).Face("brows", FK(0, "happy"))
                 .Track("body", "y", C(11)).Track("body", "sy", C(0.94f))
                 .Track("legFN", "rot", C(-75)).Track("legFN", "sy", C(0.55f)).Track("legFF", "rot", C(-75)).Track("legFF", "sy", C(0.55f))
                 .Track("legBN", "rot", C(70)).Track("legBN", "sy", C(0.55f)).Track("legBF", "rot", C(70)).Track("legBF", "sy", C(0.55f))
                 .Track("neck", "rot", C(38)).Track("head", "rot", C(14))
                 .Track("tail1", "rot", C(20)).Track("tail2", "rot", C(26)).Track("tail3", "rot", C(30)).Track("tail4", "rot", C(30))
                 .Track("crest1", "sy", C(0.6f)).Track("crest2", "sy", C(0.6f)).Track("crest3", "sy", C(0.6f));

            var cel = Clip("celebrate", 1.1f, true); cel.blink = false; cel.flicker = 1.6f;
            cel.Face("eyes", FK(0, "happy")).Face("mouth", FK(0, "content")).Face("brows", FK(0, "happy"))
               .Track("body", "y", K(0, 0), K(0.15f, 3, Ease.Out), K(0.45f, -24, Ease.In), K(0.75f, 0), K(1.1f, 0))
               .Track("body", "rot", K(0, 0), K(0.15f, 4), K(0.45f, -10), K(0.75f, 2), K(1.1f, 0))
               .Track("body", "sy", K(0, 1), K(0.15f, 0.9f, Ease.Out), K(0.3f, 1.06f), K(0.75f, 0.92f), K(0.9f, 1.02f), K(1.1f, 1))
               .Track("legFN", "rot", K(0.2f, 0), K(0.45f, -40), K(0.75f, 0)).Track("legFF", "rot", K(0.2f, 0), K(0.45f, -35), K(0.75f, 0))
               .Track("legBN", "rot", K(0.2f, 0), K(0.45f, 40), K(0.75f, 0)).Track("legBF", "rot", K(0.2f, 0), K(0.45f, 35), K(0.75f, 0))
               .Track("neck", "rot", K(0, 0), K(0.45f, -18), K(0.9f, 0)).Track("jaw", "rot", K(0, 4), K(0.45f, 16), K(0.9f, 6))
               .Track("tail1", "rot", K(0, 8), K(0.45f, -20), K(0.9f, 8));

            var train = Clip("train", 1.4f, true); train.blink = false; train.flicker = 1.3f;
            train.Face("eyes", FK(0, "open"), FK(0.4f, "closed"), FK(0.95f, "open")).Face("mouth", FK(0, "smile"), FK(0.3f, "grit"), FK(1.0f, "smile"))
                 .Face("brows", FK(0, "determined")).Face("prop", FK(0, "dumbbell"))
                 .Track("body", "rot", C(-32)).Track("body", "y", C(-6)).Track("legBN", "rot", C(32)).Track("legBF", "rot", C(32))
                 .Track("legFN", "rot", K(0, -40), K(0.65f, -95, Ease.In), K(0.85f, -95), K(1.2f, -40), K(1.4f, -40))
                 .Track("legFF", "rot", K(0, -36), K(0.65f, -90, Ease.In), K(0.85f, -90), K(1.2f, -36), K(1.4f, -36))
                 .Track("prop", "x", K(0, 6), K(0.65f, 14), K(0.85f, 14), K(1.2f, 6), K(1.4f, 6))
                 .Track("prop", "y", K(0, 10), K(0.65f, -26, Ease.In), K(0.85f, -26), K(1.2f, 10), K(1.4f, 10)).Track("prop", "rot", C(32))
                 .Track("neck", "rot", C(26)).Track("head", "rot", C(8)).Track("tail1", "rot", C(30));

            var bathe = Clip("bathe", 1.4f, true); bathe.blink = false; bathe.flicker = 0.6f;
            bathe.Face("eyes", FK(0, "closed"), FK(0.7f, "happy")).Face("mouth", FK(0, "content")).Face("brows", FK(0, "happy"))
                 .Track("body", "rot", K(0, 0), K(0.7f, 0), K(0.8f, -7), K(0.9f, 7), K(1.0f, -7), K(1.1f, 7), K(1.2f, 0), K(1.4f, 0))
                 .Track("neck", "rot", K(0, -16), K(0.7f, -16), K(0.8f, 12), K(0.9f, -12), K(1.0f, 12), K(1.1f, -12), K(1.2f, -4), K(1.4f, -16))
                 .Track("jaw", "rot", C(10)).Track("tail1", "rot", K(0, 10), K(0.85f, 30), K(1.0f, -10), K(1.15f, 30), K(1.4f, 10));

            var sad = Clip("sad", 3.2f, true); sad.breath = 0.6f; sad.breathRate = 0.3f; sad.flicker = 0.45f;
            sad.Face("brows", FK(0, "sad")).Face("mouth", FK(0, "sad"))
               .Track("neck", "rot", C(22)).Track("head", "rot", LoopK(new[] { 12f, 16, 12 }, 3.2f)).Track("body", "y", C(3))
               .Track("tail1", "rot", C(22)).Track("tail2", "rot", C(14))
               .Track("crest1", "sy", C(0.7f)).Track("crest2", "sy", C(0.7f)).Track("crest3", "sy", C(0.7f));

            Clip("hungry", 2.4f, true).Face("brows", FK(0, "sad")).Face("mouth", FK(0, "drool"))
                .Track("neck", "rot", LoopK(new[] { 20f, 28, 20, 28, 20 }, 2.4f)).Track("head", "rot", C(10)).Track("jaw", "rot", C(12)).Track("tail1", "rot", C(16));

            var angry = Clip("angry", 1.0f, true); angry.blink = false; angry.flicker = 1.9f;
            angry.Face("brows", FK(0, "angry")).Face("mouth", FK(0, "grit"))
                 .Track("body", "y", C(3)).Track("body", "sy", C(0.95f))
                 .Track("body", "x", K(0, -1.5f, Ease.Linear), K(0.05f, 1.5f, Ease.Linear), K(0.1f, -1.5f, Ease.Linear), K(0.15f, 0), K(1, 0))
                 .Track("neck", "rot", C(10)).Track("head", "rot", C(-4)).Track("jaw", "rot", C(14))
                 .Track("crest1", "sx", C(1.25f)).Track("crest1", "sy", C(1.3f)).Track("crest2", "sy", C(1.3f)).Track("crest3", "sy", C(1.3f))
                 .Track("tail1", "rot", LoopK(new[] { -10f, 4, -10 }, 1.0f));

            var attack = Clip("attack", 0.8f, false); attack.blink = false; attack.flicker = 1.8f;
            attack.Face("brows", FK(0, "angry")).Face("mouth", FK(0, "grit"), FK(0.3f, "open"), FK(0.55f, "grit"))
                  .Track("body", "x", K(0, 0), K(0.25f, -8, Ease.Out), K(0.4f, 22, Ease.In), K(0.8f, 0))
                  .Track("body", "sy", K(0, 1), K(0.25f, 0.9f), K(0.4f, 1.05f), K(0.8f, 1))
                  .Track("neck", "rot", K(0, 0), K(0.25f, -12), K(0.4f, 14), K(0.8f, 0))
                  .Track("jaw", "rot", K(0, 4), K(0.3f, 28), K(0.42f, 0), K(0.8f, 4));

            var hit = Clip("hit", 0.5f, false); hit.blink = false;
            hit.Face("eyes", FK(0, "closed"), FK(0.3f, "open")).Face("brows", FK(0, "sad")).Face("mouth", FK(0, "grit"))
               .Track("body", "x", K(0, 0), K(0.08f, -10, Ease.Out), K(0.5f, 0)).Track("body", "rot", K(0, 0), K(0.08f, -6), K(0.5f, 0))
               .Track("neck", "rot", K(0, 0), K(0.08f, -18), K(0.5f, 0));
            return list;
        }

        public static readonly string[] ClipOrder = { "idle", "walk", "run", "eat", "pet", "sleep", "celebrate", "train", "bathe", "sad", "hungry", "angry", "attack", "hit" };

        /// Ember emission rate per clip (particles/s), from chispinEmitters.
        public static readonly Dictionary<string, float> EmberRate = new Dictionary<string, float>
        {
            { "idle", 2.4f }, { "walk", 4 }, { "run", 7 }, { "eat", 3 }, { "pet", 4 }, { "sleep", 0 }, { "celebrate", 6 }, { "train", 5 },
            { "bathe", 0 }, { "sad", 0.7f }, { "hungry", 1.4f }, { "angry", 9 }, { "attack", 10 }, { "hit", 0 },
        };

        /// Fire family colour alleles (base, accent, eye, glow).
        public static readonly (string id, string name, string bas, string accent, string eye, string glow)[] Alleles =
        {
            ("brasa", "Brasa", "#7D2430", "#FF7A24", "#FFC247", "#FFB347"),
            ("ceniza", "Ceniza", "#5E5866", "#FF7A24", "#FFC247", "#FFB347"),
            ("oro", "Oro Fundido", "#9A5A16", "#FFC247", "#FFE08A", "#FFE08A"),
            ("rubi", "Rubí Profundo", "#A3123A", "#FF9F59", "#FFD1A0", "#FFB38A"),
            ("azul", "Azul Llama", "#1F3E7A", "#4FE3FF", "#B8F6FF", "#8FF0FF"),
        };
    }
}
