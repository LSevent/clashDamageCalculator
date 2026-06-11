import { describe, expect, it } from "vitest";

import { equipment, spells } from "@/src/data/game";

import {
  getDatabaseSeedSummary,
  mapDbBuildingToBuildingDefinition,
  mapDbEquipmentToEquipmentDefinition,
  mapDbSpellToSpellDefinition,
  serializeEquipmentRules,
  type DbBuilding,
  type DbEquipment,
  type DbSpell,
} from "./db-game-data";

const timestamp = new Date("2026-06-10T00:00:00.000Z");

describe("database game data mapping", () => {
  it("summarizes every static seed category without exposing raw data", () => {
    const summary = getDatabaseSeedSummary({
      patches: [],
      buildings: [
        {
          id: "test-building",
          name: "Test Building",
          village: "home",
          category: "defense",
          targetType: "ground",
          canBeSupercharged: false,
          levels: [
            {
              level: 1,
              townHallLevel: 1,
              hp: 100,
            },
          ],
        },
      ],
      equipment,
      spells,
      objectIdMap: {
        buildings: { 1: "test-building" },
        spells: {},
        equipment: {},
        heroes: {},
        pets: {},
        units: {},
        traps: {},
      },
    });

    expect(summary.buildings).toBe(1);
    expect(summary.buildingLevels).toBe(1);
    expect(summary.equipmentLevels).toBeGreaterThan(0);
    expect(summary.spellLevels).toBeGreaterThan(0);
    expect(summary.objectMappings).toBe(1);
  });

  it("serializes static Giant Arrow rules for database seeding", () => {
    const giantArrow = equipment.find((item) => item.id === "giant-arrow");
    const level = giantArrow?.levels.find((item) => item.level === 18);

    expect(level).toBeDefined();
    expect(level && serializeEquipmentRules(level)).toEqual({
      descriptions: ["Deals 2x damage to Air Defense."],
      targetMultipliers: [
        {
          targetBuildingId: "air-defense",
          multiplier: 2,
          description: "Deals 2x damage to Air Defense.",
        },
      ],
    });
  });

  it("preserves building-level verification metadata for the Data Manager", () => {
    const row: DbBuilding = {
      id: "x-bow",
      dataId: null,
      name: "X-Bow",
      village: "home",
      category: "defense",
      targetType: "ground-and-air",
      canBeSupercharged: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      levels: [
        {
          id: "building-level-1",
          levelKey: "x-bow:1:9:standard:0",
          buildingId: "x-bow",
          level: 1,
          townHallLevel: 9,
          hp: 1500,
          patchId: "may-2026",
          sourceUrl: "https://example.com/x-bow",
          isSupercharged: false,
          superchargeLevel: null,
          verificationStatus: "needs-review",
          notes: "Check after the next balance patch.",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };

    const mapped = mapDbBuildingToBuildingDefinition(row);

    expect(mapped.levels[0]?.verificationStatus).toBe("needs-review");
    expect(mapped.levels[0]?.notes).toBe(
      "Check after the next balance patch.",
    );
  });

  it("maps Giant Arrow special rules back into calculator data", () => {
    const row: DbEquipment = {
      id: "giant-arrow",
      dataId: 90000024,
      name: "Giant Arrow",
      hero: "archer-queen",
      rarity: "common",
      category: "active",
      patchId: "may-2026",
      sourceUrls: ["https://example.com/giant-arrow"],
      verificationStatus: "partial",
      notes: "Checkpoint values.",
      calculatorEnabled: true,
      defaultLevel: 18,
      createdAt: timestamp,
      updatedAt: timestamp,
      levels: [
        {
          id: "equipment-level-1",
          equipmentId: "giant-arrow",
          level: 18,
          damage: 1500,
          damagePerSecond: null,
          regeneration: null,
          healing: null,
          hpIncrease: null,
          abilityDescription: null,
          specialRules: {
            descriptions: ["Deals 2x damage to Air Defense."],
            targetMultipliers: [
              {
                targetBuildingId: "air-defense",
                multiplier: 2,
                description: "Deals 2x damage to Air Defense.",
              },
            ],
          },
          patchId: "may-2026",
          sourceUrl: "https://example.com/giant-arrow",
          sourceType: "official",
          verificationStatus: "verified",
          notes: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };

    const mapped = mapDbEquipmentToEquipmentDefinition(row);

    expect(mapped.levels[0]?.damage).toBe(1500);
    expect(mapped.levels[0]?.specialRules).toEqual([
      "Deals 2x damage to Air Defense.",
    ]);
    expect(mapped.levels[0]?.targetMultipliers).toEqual([
      {
        targetBuildingId: "air-defense",
        multiplier: 2,
        description: "Deals 2x damage to Air Defense.",
      },
    ]);
  });

  it("maps Earthquake repeat rules back into calculator data", () => {
    const earthquake = spells.find(
      (spell) => spell.id === "earthquake-spell",
    );
    const row: DbSpell = {
      id: "earthquake-spell",
      dataId: 26000010,
      name: "Earthquake Spell",
      village: "home",
      spellType: "dark",
      housingSpace: 1,
      patchId: "may-2026",
      sourceUrls: null,
      verificationStatus: "needs-review",
      notes: earthquake?.notes ?? null,
      calculatorEnabled: true,
      defaultLevel: 5,
      createdAt: timestamp,
      updatedAt: timestamp,
      levels: [
        {
          id: "spell-level-1",
          spellId: "earthquake-spell",
          level: 5,
          damage: null,
          damagePercent: 0.29,
          repeatDamageRule: "diminishing-odd-denominator",
          patchId: "may-2026",
          sourceUrl: null,
          sourceType: "manual-seed",
          verificationStatus: "needs-review",
          notes: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };

    const mapped = mapDbSpellToSpellDefinition(row);

    expect(mapped.levels[0]?.damagePercent).toBe(0.29);
    expect(mapped.levels[0]?.repeatDamageRule).toBe(
      "diminishing-odd-denominator",
    );
  });
});
