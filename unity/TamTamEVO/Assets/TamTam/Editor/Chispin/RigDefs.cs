using System.Collections.Generic;
using System.Linq;

namespace TamTam.EditorTools.Chispin
{
    /// Data model of a rig, 1:1 with packages/rig/src/types.ts (RigDef / PartDef / ClipDef).
    /// Units: rig units, y grows downwards, rotations in degrees clockwise (SVG convention).
    public enum Ease { Linear = 0, In = 1, Out = 2, InOut = 3, Step = 4 }

    public class BoneDef
    {
        public string id, parent;
        public float x, y, rot;
        public BoneDef(string id, string parent, float x, float y, float rot = 0) { this.id = id; this.parent = parent; this.x = x; this.y = y; this.rot = rot; }
    }

    public class SecondaryDef
    {
        public string bone, driver;
        public float lag, gain, velocityGain, swayAmp, swayFreq, flickerAmp, flickerFreq;
    }

    /// A paint: a palette token ("base", "accentLight", "ink", "glow"…) or a hex colour, with alpha.
    public class Paint
    {
        public string token; public string hex; public float alpha = 1;
        public string[] gradient; public float fx, fy, tx, ty;
        public static Paint T(string token, float a = 1) => new Paint { token = token, alpha = a };
        public static Paint H(string hex, float a = 1) => new Paint { hex = hex, alpha = a };
        public static Paint G(string[] stops, float fx, float fy, float tx, float ty) => new Paint { gradient = stops, fx = fx, fy = fy, tx = tx, ty = ty };
    }

    public class PartDef
    {
        public string id, bone, d;
        public float z;
        public Paint fill, stroke;
        public float strokeWidth, blur;
        public bool emissive, sheen;
        public string faceSlot; public string[] faceStates;
        public int[] tiers;

        public PartDef(string id, string bone, string d, float z) { this.id = id; this.bone = bone; this.d = d; this.z = z; }
        public PartDef Fill(Paint p) { fill = p; return this; }
        public PartDef Stroke(Paint p, float w) { stroke = p; strokeWidth = w; return this; }
        public PartDef Blur(float s) { blur = s; return this; }
        public PartDef Emissive() { emissive = true; return this; }
        public PartDef Sheen() { sheen = true; return this; }
        public PartDef Face(string slot, params string[] states) { faceSlot = slot; faceStates = states; return this; }
        public PartDef Tiers(int a, int b) { tiers = new[] { a, b }; return this; }
    }

    public struct Key
    {
        public float t, v; public Ease e;
        public Key(float t, float v, Ease e = Ease.InOut) { this.t = t; this.v = v; this.e = e; }
    }

    public struct FaceKey { public float t; public string v; public FaceKey(float t, string v) { this.t = t; this.v = v; } }

    public class ClipDef
    {
        public string id; public float duration; public bool loop;
        public float breath = 1, breathRate = 0.45f, flicker = 1; public bool blink = true;
        /// tracks[bone][channel] with channel in x, y, rot, sx, sy. x/y/rot add to the rest pose, sx/sy multiply it.
        public readonly Dictionary<string, Dictionary<string, Key[]>> tracks = new Dictionary<string, Dictionary<string, Key[]>>();
        public readonly Dictionary<string, FaceKey[]> face = new Dictionary<string, FaceKey[]>();

        public ClipDef(string id, float duration, bool loop) { this.id = id; this.duration = duration; this.loop = loop; }
        public ClipDef Track(string bone, string channel, params Key[] keys)
        {
            if (!tracks.TryGetValue(bone, out var ch)) tracks[bone] = ch = new Dictionary<string, Key[]>();
            ch[channel] = keys;
            return this;
        }
        public ClipDef Face(string slot, params FaceKey[] keys) { face[slot] = keys; return this; }
    }

    public class RigDef
    {
        public string id;
        public List<BoneDef> bones = new List<BoneDef>();
        public List<PartDef> parts = new List<PartDef>();
        public List<SecondaryDef> secondary = new List<SecondaryDef>();
        public string breathBone; public string[] eyeBones;
        public BoneDef Bone(string id) => bones.First(b => b.id == id);
    }

    public static class FaceDefaults
    {
        public static readonly Dictionary<string, string> Fallback = new Dictionary<string, string>
        {
            { "eyes", "open" }, { "mouth", "smile" }, { "brows", "neutral" }, { "prop", "none" },
        };
    }
}
