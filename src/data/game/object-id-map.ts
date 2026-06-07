import type { ObjectIdMap } from "@/src/types/game/game-data";

/*
 * This is intentionally an allowlist. Future import code should ignore IDs that
 * do not have an explicit mapping instead of trying to infer their meaning.
 */
export const objectIdMap = {
  buildings: {
    1000001: "town-hall",
  },
  spells: {
    26000010: "earthquake-spell",
  },
  equipment: {
    90000024: "giant-arrow",
    90000053: "rocket-backpack",
  },
  heroes: {},
  pets: {},
  units: {},
  traps: {},
} as const satisfies ObjectIdMap;

