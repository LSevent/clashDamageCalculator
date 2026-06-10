import { describe, expect, it } from "vitest";

import { buildings, equipment, objectIdMap, patches, spells } from "@/src/data/game";
import type { GameDataCatalog } from "@/src/types/game/game-data";

import { resolveGameDataSource } from "./game-data-source";

const databaseCatalog: GameDataCatalog = {
  patches,
  buildings,
  equipment,
  spells,
  objectIdMap,
  currentPatchId: patches.find((patch) => patch.isCurrent)?.id,
};

describe("game data source", () => {
  it("uses static fallback when DATABASE_URL is not configured", async () => {
    const result = await resolveGameDataSource({ databaseUrl: "" });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseConfigured).toBe(false);
    expect(result.buildings).toBe(buildings);
  });

  it("falls back safely when the database query fails", async () => {
    const result = await resolveGameDataSource({
      databaseUrl: "postgresql://configured",
      loadDatabaseData: async () => {
        throw new Error("Database unavailable");
      },
    });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseConfigured).toBe(true);
    expect(result.fallbackReason).toContain("unavailable");
  });

  it("uses static fallback and marks an empty database", async () => {
    const result = await resolveGameDataSource({
      databaseUrl: "postgresql://configured",
      loadDatabaseData: async () => ({
        patches: [],
        buildings: [],
        equipment: [],
        spells: [],
        objectIdMap: {
          buildings: {},
          spells: {},
          equipment: {},
          heroes: {},
          pets: {},
          units: {},
          traps: {},
        },
      }),
    });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseEmpty).toBe(true);
    expect(result.fallbackReason).toContain("seed");
  });

  it("returns database records when a complete dataset is available", async () => {
    const result = await resolveGameDataSource({
      databaseUrl: "postgresql://configured",
      loadDatabaseData: async () => databaseCatalog,
    });

    expect(result.source).toBe("database");
    expect(result.databaseConfigured).toBe(true);
    expect(result.databaseEmpty).toBe(false);
    expect(result.currentPatchId).toBe(databaseCatalog.currentPatchId);
  });
});
