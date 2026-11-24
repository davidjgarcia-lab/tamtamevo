// Golden vectors produced by the TypeScript implementation (packages/core). If these pass in Unity's
// Test Runner, the C# port evolves Tamtams exactly like the web prototype and the future server.
using System.Linq;
using NUnit.Framework;
using TamTam.Core;

namespace TamTam.Tests
{
    public class GeneticsParityTests
    {
        static readonly object[][] Cases =
        {
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 1u, "radiant", "fire,rock,crystal,fire,fire|1,0,0,0,0|slit|stripes|fire|1|fire|none|Tizor" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 42u, "plain", "fire,fire,fire,rock,fire|1,1,0,0,0|glow|seams|water|0|fire|none|Ígnalin" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 123456789u, "radiant", "fire,light,light,fire,shadow|0,0,1,0,1|glow|rivets|fire|2|shadow|none|Ígnina" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 3260935725u, "radiant", "fire,light,light,rock,rock|1,1,1,0,1|ring|spots|fire|0|crystal|none|Brasina" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 1u, "radiant", "fire,mystic,light,crystal,fire|1,0,0,0,0|glow|stripes|crystal|1|fire|none|Tizor" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 42u, "plain", "crystal,crystal,fire,mystic,fire|1,1,0,0,0|twin|facets|light|0|fire|none|Ígnor" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 123456789u, "radiant", "fire,light,light,fire,crystal|0,0,1,0,1|glow|rivets|fire|2|crystal|none|Ígnina" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 3260935725u, "radiant", "crystal,mystic,light,rock,mystic|1,1,1,0,1|twin|veins|fire|0|light|none|Mistildo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 1u, "radiant", "fire,plasma,shadow,shadow,fire|1,0,0,0,0|round|stripes|shadow|1|fire|none|Nieblildo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 42u, "plain", "shadow,shadow,fire,shadow,fire|1,1,0,0,0|twin|rings|shadow|0|fire|none|Sombrildo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 123456789u, "radiant", "fire,shadow,light,fire,shadow|0,0,1,0,1|glow|rivets|fire|2|shadow|none|Ígnrin" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 3260935725u, "radiant", "shadow,shadow,light,rock,shadow|1,1,1,0,1|twin|none|fire|0|shadow|none|Umbrildo" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 1u, "radiant", "fire,mystic,plasma,crystal,fire|1,0,0,0,0|glow|stripes|electric|1|fire|none|Tizix" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 42u, "plain", "crystal,plant,fire,light,fire|1,1,0,0,0|ring|facets|plasma|0|fire|none|Ígnaris" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 123456789u, "radiant", "fire,plasma,light,fire,crystal|0,0,1,0,1|round|rivets|fire|2|crystal|none|Ígnor" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 3260935725u, "radiant", "crystal,light,plasma,rock,light|1,1,1,0,1|ring|veins|fire|0|water|none|Lumildo" },
        };

        static string Describe(EvolutionRoll r)
        {
            var g = r.genome;
            return string.Join(",", g.parts.Select(p => p.ToString())) + "|" + string.Join(",", g.variant) + "|" + g.eyes + "|" + g.pattern + "|" +
                   g.paletteBase + "|" + g.shade + "|" + g.paletteAccent + "|" + g.mutation + "|" + r.name;
        }

        [Test]
        public void HashSeedMatchesTypeScript() => Assert.AreEqual(3260935725u, Genetics.HashSeed("tt-1", "baby", 0));

        [Test, TestCaseSource(nameof(Cases))]
        public void RollMatchesTypeScript(CareProfile p, uint seed, string tier, string expected) =>
            Assert.AreEqual(expected, Describe(Genetics.Roll(Genetics.Chispin, p, seed, tier)));

        [Test]
        public void CareSteersFamilies()
        {
            var warrior = new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, neglect = 0.3 };
            var odds = Genetics.Odds(warrior, Genetics.Chispin);
            Assert.AreEqual(Family.fire, odds.OrderByDescending(kv => kv.Value).First().Key);
        }
    }
}
