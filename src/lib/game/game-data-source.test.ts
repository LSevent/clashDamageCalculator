import { describe, expect, it } from "vitest";

import { buildings, equipment, objectIdMap, patches, spells } from "@/src/data/game";
import type { GameDataCatalog } from "@/src/types/game/game-data";

import {
  createDataSourceHealthResponse,
  resolveGameDataSource,
} from "./game-data-source";

const databaseCatalog: GameDataCatalog = {
  patches,
  buildings,
  equipment,
  spells,
  objectIdMap,
  currentPatchId: patches.find((patch) => patch.isCurrent)?.id,
};
const checkedAt = new Date("2026-06-11T00:00:00.000Z");
const now = () => checkedAt;

describe("game data source", () => {
  it("uses static fallback when DATABASE_URL is not configured", async () => {
    const result = await resolveGameDataSource({ databaseUrl: "", now });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseConfigured).toBe(false);
    expect(result.databaseReachable).toBeNull();
    expect(result.seeded).toBe(false);
    expect(result.checkedAt).toBe(checkedAt.toISOString());
    expect(result.buildings).toBe(buildings);
  });

  it("falls back safely when the database query fails", async () => {
    const result = await resolveGameDataSource({
      databaseUrl: "postgresql://configured",
      loadDatabaseData: async () => {
        throw new Error("Database unavailable");
      },
      now,
    });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseConfigured).toBe(true);
    expect(result.databaseReachable).toBe(false);
    expect(result.seeded).toBe(false);
    expect(result.fallbackReason).toBe(
      "Database unavailable. Static fallback is being used.",
    );
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
      now,
    });

    expect(result.source).toBe("static-fallback");
    expect(result.databaseReachable).toBe(true);
    expect(result.seeded).toBe(false);
    expect(result.databaseEmpty).toBe(true);
    expect(result.fallbackReason).toContain(
      "Database connected but no game data found.",
    );
  });

  it("returns database records when a complete dataset is available", async () => {
    const result = await resolveGameDataSource({
      databaseUrl: "postgresql://configured",
      loadDatabaseData: async () => databaseCatalog,
      now,
    });

    expect(result.source).toBe("database");
    expect(result.databaseConfigured).toBe(true);
    expect(result.databaseReachable).toBe(true);
    expect(result.seeded).toBe(true);
    expect(result.databaseEmpty).toBe(false);
    expect(result.currentPatchId).toBe(databaseCatalog.currentPatchId);
  });

  it("creates a non-sensitive health response with active data counts", async () => {
    const data = await resolveGameDataSource({ databaseUrl: "", now });
    const health = createDataSourceHealthResponse(data);
    const serialized = JSON.stringify(health);

    expect(health).toEqual({
      ok: true,
      dataSource: "static-fallback",
      databaseConfigured: false,
      databaseReachable: null,
      seeded: false,
      currentPatch: "June 2026 Anime Fury Event",
      counts: {
        patches: patches.length,
        buildings: buildings.length,
        equipment: equipment.length,
        spells: spells.length,
      },
      checkedAt: checkedAt.toISOString(),
    });
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("postgresql://");
  });
});
