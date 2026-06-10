import type { SpellDefinition } from "@/src/types/game/game-data";

import { PATCH_IDS } from "./patches";

const JUNE_ANIME_FURY_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/anime-fury-returns-season-2-hits-different/";

export const spells = [
  {
    id: "earthquake-spell",
    dataId: 26000010,
    name: "Earthquake Spell",
    village: "home",
    spellType: "dark",
    housingSpace: 1,
    patchId: PATCH_IDS.MAY_2026,
    verificationStatus: "needs-review",
    notes:
      "Level 5 remains an MVP seed. Its percentage value needs a stored official or clearly labeled third-party source.",
    calculatorEnabled: true,
    defaultLevel: 5,
    levels: [
      {
        level: 5,
        damagePercent: 0.29,
        repeatDamageRule: "diminishing-odd-denominator",
        patchId: PATCH_IDS.MAY_2026,
        sourceType: "manual-seed",
        verificationStatus: "needs-review",
        notes:
          "Existing calculator seed retained; source verification is still pending.",
      },
    ],
  },
  {
    id: "recall-revive-spell",
    name: "Recall + Revive Spell",
    village: "home",
    spellType: "event",
    patchId: PATCH_IDS.JUNE_2026_ANIME_FURY,
    sourceUrls: [JUNE_ANIME_FURY_SOURCE],
    verificationStatus: "partial",
    notes:
      "Official June event content. No complete calculator-ready stat table is stored.",
    calculatorEnabled: false,
    levels: [],
  },
  {
    id: "yellow-card-spell",
    name: "Yellow Card Spell",
    village: "home",
    spellType: "event",
    patchId: PATCH_IDS.JUNE_2026_ANIME_FURY,
    sourceUrls: [JUNE_ANIME_FURY_SOURCE],
    verificationStatus: "partial",
    notes:
      "Official Football Fury event content. It temporarily disables defenses and Heroes and is outside the MVP damage formula.",
    calculatorEnabled: false,
    levels: [],
  },
] as const satisfies readonly SpellDefinition[];

// TODO: Add event spell levels only when verified stat tables are published.
