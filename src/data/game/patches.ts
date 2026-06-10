import type { PatchInfo } from "@/src/types/game/game-data";

export const PATCH_IDS = {
  MAY_2026: "may-2026",
  JUNE_2026_ANIME_FURY: "june-2026-anime-fury",
} as const;

export const CURRENT_PATCH_ID = PATCH_IDS.JUNE_2026_ANIME_FURY;

const MAY_UPDATE_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/";
const MAY_BALANCE_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/state-of-gameplay-part-2/";
const JUNE_SEASON_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/anime-fury-returns-season-2-hits-different/";
const JUNE_MEDAL_EVENT_SOURCE =
  "https://supercell.com/en/games/clashofclans/blog/news/have-no-fear-because-the-anime-fury-medal-event-is-here/";

export const patches = [
  {
    id: PATCH_IDS.MAY_2026,
    name: "May 2026 Update",
    releaseDate: "2026-05-26",
    sourceUrl: MAY_UPDATE_SOURCE,
    sourceUrls: [MAY_UPDATE_SOURCE, MAY_BALANCE_SOURCE],
    notes:
      "Mandatory update released on May 26, 2026. Balance changes were detailed in State of Gameplay Part 2.",
    isCurrent: false,
    verificationStatus: "partial",
    verifiedAt: "2026-06-10",
    changedItems: [
      {
        type: "equipment",
        itemId: "giant-arrow",
        itemName: "Giant Arrow",
        summary:
          "Official checkpoint damage values changed and extra damage against Air Defense increased from 1x to 2x.",
      },
      {
        type: "equipment",
        itemId: "rocket-backpack",
        itemName: "Rocket Backpack",
        summary:
          "Penetrating damage changed at levels 21 and 27.",
      },
      {
        type: "equipment",
        itemId: "fire-heart",
        itemName: "Fire Heart",
        summary:
          "Regeneration at levels 15 and 18 and DPS at levels 1-18 were reduced.",
      },
      {
        type: "other",
        itemId: "dragon-duke",
        itemName: "Dragon Duke",
        summary:
          "Trap damage reduction changed from 50 to 40 at levels 15-18.",
      },
      {
        type: "other",
        itemId: "lava-launcher",
        itemName: "Lava Launcher",
        summary:
          "DPS, attack range, and pool damage changed across levels 1-10.",
      },
      {
        type: "other",
        itemId: "air-bombs",
        itemName: "Air Bombs",
        summary:
          "Attack range and attack speed were adjusted.",
      },
      {
        type: "other",
        itemId: "roaster",
        itemName: "Roaster",
        summary:
          "Attack speed, damage radius, damage, and burst count were adjusted.",
      },
      {
        type: "other",
        itemId: "sky-wagon",
        itemName: "Sky Wagon",
        summary:
          "Attack count, spawned troop levels, and troop quantities were reduced.",
      },
      {
        type: "other",
        itemId: "dragon-rider",
        itemName: "Dragon Rider",
        summary:
          "Level 6 HP changed from 6200 to 6000 and DPS from 520 to 510.",
      },
    ],
  },
  {
    id: PATCH_IDS.JUNE_2026_ANIME_FURY,
    name: "June 2026 Anime Fury Event",
    releaseDate: "2026-06-01",
    sourceUrl: JUNE_SEASON_SOURCE,
    sourceUrls: [JUNE_SEASON_SOURCE, JUNE_MEDAL_EVENT_SOURCE],
    notes:
      "June event content introduced Monolith Arrow through the Anime Fury Medal Event. Official posts confirm the content but do not provide full calculator-ready stat tables.",
    isCurrent: true,
    verificationStatus: "partial",
    verifiedAt: "2026-06-10",
    changedItems: [
      {
        type: "equipment",
        itemId: "monolith-arrow",
        itemName: "Monolith Arrow",
        summary:
          "New Archer Queen Epic Equipment confirmed; full level stats are not published in the official event posts.",
      },
      {
        type: "spell",
        itemId: "recall-revive-spell",
        itemName: "Recall + Revive Spell",
        summary:
          "Temporary June event spell confirmed without a calculator-ready stat table.",
      },
      {
        type: "spell",
        itemId: "yellow-card-spell",
        itemName: "Yellow Card Spell",
        summary:
          "Temporary Football Fury spell confirmed without a calculator-ready damage table.",
      },
    ],
  },
] as const satisfies readonly PatchInfo[];
