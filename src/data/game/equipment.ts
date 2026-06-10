import type { EquipmentDefinition } from "@/src/types/game/game-data";

import { PATCH_IDS } from "./patches";

const MAY_2026_BALANCE_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/state-of-gameplay-part-2/";
const JUNE_ANIME_FURY_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/anime-fury-returns-season-2-hits-different/";
const JUNE_MEDAL_EVENT_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/have-no-fear-because-the-anime-fury-medal-event-is-here/";

const GIANT_ARROW_AIR_DEFENSE_RULE = {
  targetBuildingId: "air-defense",
  multiplier: 2,
  description: "Deals 2x damage to Air Defense.",
} as const;

const giantArrowLevel = (level: number, damage: number) => ({
  level,
  damage,
  specialRules: [GIANT_ARROW_AIR_DEFENSE_RULE.description],
  targetMultipliers: [GIANT_ARROW_AIR_DEFENSE_RULE],
  patchId: PATCH_IDS.MAY_2026,
  sourceUrl: MAY_2026_BALANCE_SOURCE,
  sourceType: "official" as const,
  verificationStatus: "verified" as const,
  notes:
    "Official May 2026 balance checkpoint. This is not a complete Giant Arrow level table.",
});

const fireHeartDps = [
  10, 10, 12, 12, 12, 14, 14, 14, 16, 16, 16, 18, 18, 18, 20, 20, 20, 23,
] as const;

export const equipment = [
  {
    id: "giant-arrow",
    dataId: 90000024,
    name: "Giant Arrow",
    hero: "archer-queen",
    rarity: "common",
    category: "active",
    patchId: PATCH_IDS.MAY_2026,
    sourceUrls: [MAY_2026_BALANCE_SOURCE],
    verificationStatus: "partial",
    notes:
      "Official balance checkpoints are stored for levels 9, 12, 15, and 18. Missing levels are intentionally not inferred.",
    calculatorEnabled: true,
    defaultLevel: 18,
    levels: [
      giantArrowLevel(9, 1100),
      giantArrowLevel(12, 1200),
      giantArrowLevel(15, 1350),
      giantArrowLevel(18, 1500),
    ],
  },
  {
    id: "rocket-backpack",
    dataId: 90000053,
    name: "Rocket Backpack",
    hero: "dragon-duke",
    rarity: "common",
    category: "active",
    patchId: PATCH_IDS.MAY_2026,
    sourceUrls: [MAY_2026_BALANCE_SOURCE],
    verificationStatus: "partial",
    notes:
      "The official May table verifies changed values at levels 21 and 27 only. Level 24 remains the original MVP seed and needs review.",
    calculatorEnabled: true,
    defaultLevel: 24,
    levels: [
      {
        level: 21,
        damage: 1875,
        abilityDescription: "Penetrating damage.",
        patchId: PATCH_IDS.MAY_2026,
        sourceUrl: MAY_2026_BALANCE_SOURCE,
        sourceType: "official",
        verificationStatus: "verified",
        notes: "Official May 2026 changed-value checkpoint.",
      },
      {
        level: 24,
        damage: 2050,
        abilityDescription: "Penetrating damage.",
        patchId: PATCH_IDS.MAY_2026,
        sourceType: "manual-seed",
        verificationStatus: "needs-review",
        notes:
          "Existing MVP seed retained for compatibility; it is not listed in the official May balance checkpoint table.",
      },
      {
        level: 27,
        damage: 2150,
        abilityDescription: "Penetrating damage.",
        patchId: PATCH_IDS.MAY_2026,
        sourceUrl: MAY_2026_BALANCE_SOURCE,
        sourceType: "official",
        verificationStatus: "verified",
        notes: "Official May 2026 changed-value checkpoint.",
      },
    ],
  },
  {
    id: "fire-heart",
    name: "Fire Heart",
    hero: "dragon-duke",
    rarity: "common",
    category: "passive",
    patchId: PATCH_IDS.MAY_2026,
    sourceUrls: [MAY_2026_BALANCE_SOURCE],
    verificationStatus: "partial",
    notes:
      "Official May balance rows cover DPS at levels 1-18 and regeneration at levels 15 and 18. The effect is not modeled by the one-shot damage calculator.",
    calculatorEnabled: false,
    levels: fireHeartDps.map((damagePerSecond, index) => {
      const level = index + 1;
      const regeneration = level === 15 ? 140 : level === 18 ? 150 : undefined;

      return {
        level,
        damagePerSecond,
        ...(regeneration !== undefined ? { regeneration } : {}),
        patchId: PATCH_IDS.MAY_2026,
        sourceUrl: MAY_2026_BALANCE_SOURCE,
        sourceType: "official" as const,
        verificationStatus: "verified" as const,
        notes:
          "Official May 2026 balance value. Other Fire Heart fields are not represented here.",
      };
    }),
  },
  {
    id: "monolith-arrow",
    name: "Monolith Arrow",
    hero: "archer-queen",
    rarity: "epic",
    category: "active",
    patchId: PATCH_IDS.JUNE_2026_ANIME_FURY,
    sourceUrls: [JUNE_ANIME_FURY_SOURCE, JUNE_MEDAL_EVENT_SOURCE],
    verificationStatus: "partial",
    notes:
      "Official June 2026 Anime Fury posts confirm this Archer Queen Epic Equipment, but do not provide a full level-by-level stat table.",
    calculatorEnabled: false,
    levels: [],
  },
] as const satisfies readonly EquipmentDefinition[];

// TODO: Add missing levels only when a verified level table is available.
