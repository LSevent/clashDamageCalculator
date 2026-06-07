import type { EquipmentDefinition } from "@/src/types/game/game-data";

import { PATCH_IDS } from "./patches";

const MAY_2026_BALANCE_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/state-of-gameplay-part-2";

export const equipment = [
  {
    id: "giant-arrow",
    dataId: 90000024,
    name: "Giant Arrow",
    hero: "archer-queen",
    rarity: "common",
    category: "active",
    levels: [
      {
        level: 18,
        damage: 1500,
        specialRules: ["Deals 2x damage to Air Defense."],
        patchId: PATCH_IDS.MAY_2026,
        sourceUrl: MAY_2026_BALANCE_SOURCE,
      },
    ],
  },
  {
    id: "rocket-backpack",
    dataId: 90000053,
    name: "Rocket Backpack",
    hero: "dragon-duke",
    rarity: "common",
    category: "active",
    levels: [
      {
        level: 24,
        damage: 2050,
        abilityDescription: "Penetrating damage.",
        patchId: PATCH_IDS.MAY_2026,
      },
    ],
  },
] as const satisfies readonly EquipmentDefinition[];

// TODO: Add the remaining verified levels without filling gaps with inferred values.

