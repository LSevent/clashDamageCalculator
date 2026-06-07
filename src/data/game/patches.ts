import type { PatchInfo } from "@/src/types/game/game-data";

export const PATCH_IDS = {
  MAY_2026: "may-2026",
} as const;

export const CURRENT_PATCH_ID = PATCH_IDS.MAY_2026;

export const patches = [
  {
    id: PATCH_IDS.MAY_2026,
    name: "May 2026 Update",
    releaseDate: "2026-05-26",
    sourceUrl:
      "https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/",
    notes:
      "Giant Arrow balance change, equipment and defense balance changes.",
    isCurrent: true,
  },
] as const satisfies readonly PatchInfo[];

