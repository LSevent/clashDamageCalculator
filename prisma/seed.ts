import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  buildings,
  equipment,
  objectIdMap,
  patches,
  spells,
} from "../src/data/game/index";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import {
  createBuildingLevelKey,
  getDatabaseSeedSummary,
  serializeEquipmentRules,
} from "../src/lib/game/db-game-data";
import type {
  BuildingDefinition,
  EquipmentDefinition,
  PatchInfo,
  SpellDefinition,
} from "../src/types/game/game-data";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 10_000,
  }),
});
const patchDefinitions: readonly PatchInfo[] = patches;
const buildingDefinitions: readonly BuildingDefinition[] = buildings;
const equipmentDefinitions: readonly EquipmentDefinition[] = equipment;
const spellDefinitions: readonly SpellDefinition[] = spells;
const updateSources = [
  {
    id: "clash-official-news",
    name: "Clash of Clans Official Blog",
    url: "https://supercell.com/en/games/clashofclans/blog/",
    sourceType: "official",
    enabled: true,
  },
] as const;

function jsonValue(value: unknown) {
  return value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

async function seedPatches() {
  for (const patch of patchDefinitions) {
    const data = {
      name: patch.name,
      releaseDate: patch.releaseDate
        ? new Date(`${patch.releaseDate}T00:00:00.000Z`)
        : null,
      sourceUrl: patch.sourceUrl ?? null,
      sourceUrls: jsonValue(patch.sourceUrls),
      notes: patch.notes,
      isCurrent: patch.isCurrent,
      verificationStatus: patch.verificationStatus,
      verifiedAt: patch.verifiedAt
        ? new Date(`${patch.verifiedAt}T00:00:00.000Z`)
        : null,
      changedItems: jsonValue(patch.changedItems),
    };

    await prisma.patch.upsert({
      where: { id: patch.id },
      update: data,
      create: { id: patch.id, ...data },
    });
  }
}

async function seedBuildings() {
  for (const building of buildingDefinitions) {
    await prisma.building.upsert({
      where: { id: building.id },
      update: {
        dataId: building.dataId ?? null,
        name: building.name,
        village: building.village,
        category: building.category,
        targetType: building.targetType,
        canBeSupercharged: building.canBeSupercharged,
      },
      create: {
        id: building.id,
        dataId: building.dataId ?? null,
        name: building.name,
        village: building.village,
        category: building.category,
        targetType: building.targetType,
        canBeSupercharged: building.canBeSupercharged,
      },
    });

    for (const level of building.levels) {
      const levelKey = createBuildingLevelKey(
        building.id,
        level.level,
        level.townHallLevel,
        level.isSupercharged,
        level.superchargeLevel,
      );
      const data = {
        buildingId: building.id,
        level: level.level,
        townHallLevel: level.townHallLevel,
        hp: level.hp,
        patchId: level.patchId ?? null,
        sourceUrl: level.sourceUrl ?? null,
        isSupercharged: level.isSupercharged ?? false,
        superchargeLevel: level.superchargeLevel ?? null,
      };

      await prisma.buildingLevel.upsert({
        where: { levelKey },
        update: data,
        create: { levelKey, ...data },
      });
    }
  }
}

async function seedEquipment() {
  for (const item of equipmentDefinitions) {
    const definition = {
      dataId: item.dataId ?? null,
      name: item.name,
      hero: item.hero,
      rarity: item.rarity,
      category: item.category,
      patchId: item.patchId ?? null,
      sourceUrls: jsonValue(item.sourceUrls),
      verificationStatus: item.verificationStatus ?? null,
      notes: item.notes ?? null,
      calculatorEnabled: item.calculatorEnabled ?? false,
      defaultLevel: item.defaultLevel ?? null,
    };

    await prisma.equipment.upsert({
      where: { id: item.id },
      update: definition,
      create: { id: item.id, ...definition },
    });

    for (const level of item.levels) {
      const data = {
        damage: level.damage ?? null,
        damagePerSecond: level.damagePerSecond ?? null,
        regeneration: level.regeneration ?? null,
        healing: level.healing ?? null,
        hpIncrease: level.hpIncrease ?? null,
        abilityDescription: level.abilityDescription ?? null,
        specialRules: jsonValue(serializeEquipmentRules(level)),
        patchId: level.patchId ?? null,
        sourceUrl: level.sourceUrl ?? null,
        sourceType: level.sourceType ?? null,
        verificationStatus: level.verificationStatus ?? null,
        notes: level.notes ?? null,
      };

      await prisma.equipmentLevel.upsert({
        where: {
          equipmentId_level: {
            equipmentId: item.id,
            level: level.level,
          },
        },
        update: data,
        create: {
          equipmentId: item.id,
          level: level.level,
          ...data,
        },
      });
    }
  }
}

async function seedSpells() {
  for (const spell of spellDefinitions) {
    const definition = {
      dataId: spell.dataId ?? null,
      name: spell.name,
      village: spell.village,
      spellType: spell.spellType,
      housingSpace: spell.housingSpace ?? null,
      patchId: spell.patchId ?? null,
      sourceUrls: jsonValue(spell.sourceUrls),
      verificationStatus: spell.verificationStatus ?? null,
      notes: spell.notes ?? null,
      calculatorEnabled: spell.calculatorEnabled ?? false,
      defaultLevel: spell.defaultLevel ?? null,
    };

    await prisma.spell.upsert({
      where: { id: spell.id },
      update: definition,
      create: { id: spell.id, ...definition },
    });

    for (const level of spell.levels) {
      const data = {
        damage: level.damage ?? null,
        damagePercent: level.damagePercent ?? null,
        repeatDamageRule: level.repeatDamageRule ?? null,
        patchId: level.patchId ?? null,
        sourceUrl: level.sourceUrl ?? null,
        sourceType: level.sourceType ?? null,
        verificationStatus: level.verificationStatus ?? null,
        notes: level.notes ?? null,
      };

      await prisma.spellLevel.upsert({
        where: {
          spellId_level: {
            spellId: spell.id,
            level: level.level,
          },
        },
        update: data,
        create: {
          spellId: spell.id,
          level: level.level,
          ...data,
        },
      });
    }
  }
}

async function seedObjectIdMappings() {
  for (const [category, mappings] of Object.entries(objectIdMap)) {
    for (const [dataId, appObjectId] of Object.entries(mappings)) {
      const numericDataId = Number(dataId);

      await prisma.objectIdMapping.upsert({
        where: {
          category_dataId: {
            category,
            dataId: numericDataId,
          },
        },
        update: { appObjectId },
        create: {
          category,
          dataId: numericDataId,
          appObjectId,
        },
      });
    }
  }
}

async function seedUpdateSources() {
  for (const source of updateSources) {
    await prisma.updateSource.upsert({
      where: { id: source.id },
      update: {
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        enabled: source.enabled,
      },
      create: source,
    });
  }

  return updateSources.length;
}

async function main() {
  await seedPatches();
  await seedBuildings();
  await seedEquipment();
  await seedSpells();
  await seedObjectIdMappings();
  const updateSourceCount = await seedUpdateSources();

  return {
    ...getDatabaseSeedSummary({
      patches: patchDefinitions,
      buildings: buildingDefinitions,
      equipment: equipmentDefinitions,
      spells: spellDefinitions,
      objectIdMap,
    }),
    updateSources: updateSourceCount,
  };
}

function printSeedSummary(summary: Awaited<ReturnType<typeof main>>) {
  console.log("Database seed completed successfully.");
  console.log(`Patches upserted: ${summary.patches}`);
  console.log(`Buildings upserted: ${summary.buildings}`);
  console.log(`Building levels upserted: ${summary.buildingLevels}`);
  console.log(`Equipment upserted: ${summary.equipment}`);
  console.log(`Equipment levels upserted: ${summary.equipmentLevels}`);
  console.log(`Spells upserted: ${summary.spells}`);
  console.log(`Spell levels upserted: ${summary.spellLevels}`);
  console.log(`Object mappings upserted: ${summary.objectMappings}`);
  console.log(`Update sources upserted: ${summary.updateSources}`);
}

function getSafeErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return ` (${error.code})`;
  }

  return "";
}

main()
  .then(async (summary) => {
    printSeedSummary(summary);
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(
      `Database seed failed${getSafeErrorCode(error)}. Verify DATABASE_URL, connectivity, and applied migrations.`,
    );
    await prisma.$disconnect();
    process.exitCode = 1;
  });
