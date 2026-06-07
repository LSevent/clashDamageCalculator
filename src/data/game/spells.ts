import type { SpellDefinition } from "@/src/types/game/game-data";

import { PATCH_IDS } from "./patches";

export const spells = [
  {
    id: "earthquake-spell",
    dataId: 26000010,
    name: "Earthquake Spell",
    village: "home",
    spellType: "dark",
    housingSpace: 1,
    levels: [
      {
        level: 5,
        damagePercent: 0.29,
        repeatDamageRule: "diminishing-odd-denominator",
        patchId: PATCH_IDS.MAY_2026,
      },
    ],
  },
] as const satisfies readonly SpellDefinition[];

// TODO: Add other verified Earthquake Spell levels in a later data pass.

