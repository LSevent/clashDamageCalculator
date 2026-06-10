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
};

function createStaticFallback(
  databaseConfigured: boolean,
  fallbackReason?: string,
  databaseEmpty = false,
): GameDataBundle {
  return {
    ...staticCatalog,
    source: "static-fallback",
    databaseConfigured,
    databaseEmpty,
    fallbackReason,
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
}: ResolveGameDataSourceOptions = {}): Promise<GameDataBundle> {
  if (!databaseUrl?.trim()) {
    return createStaticFallback(
      false,
      "DATABASE_URL is not configured. Static seed data is active.",
    );
  }

  try {
    const databaseData = await loadDatabaseData();

    if (!hasUsableDatabaseData(databaseData)) {
      return createStaticFallback(
        true,
        "Database has no complete game dataset yet. Run the seed command; static seed data is active.",
        true,
      );
    }

    return {
      ...databaseData,
      source: "database",
      databaseConfigured: true,
      databaseEmpty: false,
    };
  } catch {
    return createStaticFallback(
      true,
      "Database is unavailable. Static seed data is active.",
    );
  }
}

export async function getGameDataSourceStatus() {
  const data = await resolveGameDataSource();

  return {
    source: data.source,
    databaseConfigured: data.databaseConfigured,
    databaseEmpty: data.databaseEmpty,
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
