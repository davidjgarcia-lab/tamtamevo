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
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 1u, "radiant", "fire,reptile,crystal,plant,fire|1,0,0,0,0|slit|stripes|fire|1|fire|none|Ígnollo" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 42u, "plain", "plant,fire,reptile,reptile,fire|1,1,0,0,0|glow|veins|ghost|0|fire|none|Magmex" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 123456789u, "radiant", "reptile,water,gel,fire,crystal|0,0,1,0,1|round|rivets|fire|2|crystal|none|Magmino" },
            new object[] { new CareProfile { care = 0.7, affection = 0.4, hygiene = 0.5, training = 0.9, fighting = 1, study = 0, play = 0, neglect = 0.3 }, 3260935725u, "radiant", "fire,reptile,water,ether,reptile|1,1,1,0,1|round|spots|fire|0|crystal|none|Brasex" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 1u, "radiant", "fire,reptile,water,crystal,fire|1,0,0,0,0|slit|stripes|crystal|1|fire|none|Ígnino" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 42u, "plain", "crystal,crystal,reptile,ether,fire|1,1,0,0,0|twin|facets|water|0|fire|none|Prismardo" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 123456789u, "radiant", "reptile,ether,gel,fire,crystal|0,0,1,0,1|glow|rivets|fire|2|crystal|none|Magmino" },
            new object[] { new CareProfile { care = 0.9, affection = 0.5, hygiene = 1, training = 0, fighting = 0, study = 1, play = 0, neglect = 0.1 }, 3260935725u, "radiant", "crystal,ether,ether,ether,ether|1,1,1,0,1|ring|veins|fire|0|water|none|Aurardo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 1u, "radiant", "fire,reptile,ghost,ghost,fire|1,0,0,0,0|slit|stripes|ghost|1|fire|none|Nieblardo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 42u, "plain", "ghost,ghost,reptile,gel,fire|1,1,0,0,0|twin|rings|ghost|0|fire|none|Sombrardo" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 123456789u, "radiant", "reptile,ghost,gel,fire,crystal|0,0,1,0,1|glow|rivets|fire|2|crystal|none|Magmino" },
            new object[] { new CareProfile { care = 0.1, affection = 0.05, hygiene = 0.1, training = 0, fighting = 0, study = 0, play = 0, neglect = 0.9 }, 3260935725u, "radiant", "ghost,ghost,ether,ether,gel|1,1,1,0,1|twin|none|fire|0|ghost|none|Umbriel" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 1u, "radiant", "fire,reptile,gel,water,fire|1,0,0,0,0|slit|stripes|metal|1|fire|none|Ígnón" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 42u, "plain", "water,plant,reptile,ether,fire|1,1,0,0,0|ring|spots|gel|0|fire|none|Magmollo" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 123456789u, "radiant", "reptile,gel,gel,fire,ghost|0,0,1,0,1|round|rivets|fire|2|ghost|none|Magmuchi" },
            new object[] { new CareProfile { care = 0.75, affection = 0.6, hygiene = 0.8, training = 0.3, fighting = 0.2, study = 0.4, play = 0.9, neglect = 0.25 }, 3260935725u, "radiant", "crystal,gel,gel,ether,ether|1,1,1,0,1|twin|veins|fire|0|water|none|Geliel" },
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
