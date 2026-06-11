import {
  buildings,
  CURRENT_PATCH_ID,
  equipment,
  objectIdMap,
  patches,
  spells,
} from "@/src/data/game";
import type {
  GameDataBundle,
  GameDataCatalog,
} from "@/src/types/game/game-data";

import { auditGameData } from "./data-audit";

const staticCatalog: GameDataCatalog = {
  patches,
  buildings,
  equipment,
  spells,
  objectIdMap,
  currentPatchId: CURRENT_PATCH_ID,
};

type ResolveGameDataSourceOptions = {
  databaseUrl?: string;
  loadDatabaseData?: () => Promise<GameDataCatalog>;
  now?: () => Date;
};

function createStaticFallback(
  status: {
    databaseConfigured: boolean;
    databaseReachable: boolean | null;
    databaseEmpty: boolean;
    checkedAt: string;
    fallbackReason: string;
  },
): GameDataBundle {
  return {
    ...staticCatalog,
    source: "static-fallback",
    seeded: false,
    ...status,
  };
}

function hasUsableDatabaseData(data: GameDataCatalog) {
  return (
    data.patches.length > 0 &&
    data.buildings.length > 0 &&
    data.equipment.length > 0 &&
    data.spells.length > 0
  );
}

async function loadConfiguredDatabaseData(): Promise<GameDataCatalog> {
  const [{ getPrismaClient }, { getDatabaseGameData }] = await Promise.all([
    import("@/src/lib/db/prisma"),
    import("./db-game-data"),
  ]);
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database client is not configured.");
  }

  return getDatabaseGameData(prisma);
}

export async function resolveGameDataSource({
  databaseUrl = process.env.DATABASE_URL,
  loadDatabaseData = loadConfiguredDatabaseData,
  now = () => new Date(),
}: ResolveGameDataSourceOptions = {}): Promise<GameDataBundle> {
  const checkedAt = now().toISOString();

  if (!databaseUrl?.trim()) {
    return createStaticFallback({
      databaseConfigured: false,
      databaseReachable: null,
      databaseEmpty: false,
      checkedAt,
      fallbackReason:
        "DATABASE_URL is not configured. Static fallback is being used.",
    });
  }

  try {
    const databaseData = await loadDatabaseData();

    if (!hasUsableDatabaseData(databaseData)) {
      return createStaticFallback({
        databaseConfigured: true,
        databaseReachable: true,
        databaseEmpty: true,
        checkedAt,
        fallbackReason:
          "Database connected but no game data found. Run the seed command. Static fallback is being used.",
      });
    }

    return {
      ...databaseData,
      source: "database",
      databaseConfigured: true,
      databaseReachable: true,
      seeded: true,
      databaseEmpty: false,
      checkedAt,
    };
  } catch {
    return createStaticFallback({
      databaseConfigured: true,
      databaseReachable: false,
      databaseEmpty: false,
      checkedAt,
      fallbackReason:
        "Database unavailable. Static fallback is being used.",
    });
  }
}

export function getGameDataCounts(data: GameDataCatalog) {
  return {
    patches: data.patches.length,
    buildings: data.buildings.length,
    equipment: data.equipment.length,
    spells: data.spells.length,
  };
}

export function createDataSourceHealthResponse(data: GameDataBundle) {
  const currentPatch =
    data.patches.find((patch) => patch.id === data.currentPatchId) ??
    data.patches.find((patch) => patch.isCurrent);

  return {
    ok: true,
    dataSource: data.source,
    databaseConfigured: data.databaseConfigured,
    databaseReachable: data.databaseReachable,
    seeded: data.seeded,
    currentPatch: currentPatch?.name ?? null,
    counts: getGameDataCounts(data),
    checkedAt: data.checkedAt,
  };
}

export async function getGameDataSourceStatus() {
  const data = await resolveGameDataSource();

  return {
    source: data.source,
    databaseConfigured: data.databaseConfigured,
    databaseReachable: data.databaseReachable,
    seeded: data.seeded,
    databaseEmpty: data.databaseEmpty,
    checkedAt: data.checkedAt,
    fallbackReason: data.fallbackReason,
  };
}

export async function getPatchesData() {
  return (await resolveGameDataSource()).patches;
}

export async function getBuildingsData() {
  return (await resolveGameDataSource()).buildings;
}

export async function getEquipmentData() {
  return (await resolveGameDataSource()).equipment;
}

export async function getSpellsData() {
  return (await resolveGameDataSource()).spells;
}

export async function getObjectIdMapData() {
  return (await resolveGameDataSource()).objectIdMap;
}

export async function getCurrentPatchData() {
  const data = await resolveGameDataSource();

  return (
    data.patches.find((patch) => patch.id === data.currentPatchId) ??
    data.patches.find((patch) => patch.isCurrent)
  );
}

export async function getDataAuditData() {
  const data = await resolveGameDataSource();

  return {
    data,
    audit: auditGameData({
      patches: data.patches,
      buildings: data.buildings,
      equipment: data.equipment,
      spells: data.spells,
      currentPatchId: data.currentPatchId,
    }),
  };
}
