import type { Prisma, PrismaClient } from "@/src/generated/prisma/client";
import type {
  BuildingDefinition,
  BuildingLevel,
  DataSourceType,
  DataVerificationStatus,
  EquipmentDefinition,
  EquipmentLevel,
  EquipmentTargetMultiplier,
  GameDataCatalog,
  ObjectIdMap,
  PatchChangedItem,
  PatchInfo,
  SpellDefinition,
  SpellLevel,
  SpellRepeatDamageRule,
} from "@/src/types/game/game-data";

export type DbPatch = Prisma.PatchGetPayload<Record<string, never>>;
export type DbBuilding = Prisma.BuildingGetPayload<{
  include: { levels: true };
}>;
export type DbEquipment = Prisma.EquipmentGetPayload<{
  include: { levels: true };
}>;
export type DbSpell = Prisma.SpellGetPayload<{
  include: { levels: true };
}>;
export type DbObjectIdMapping = Prisma.ObjectIdMappingGetPayload<
  Record<string, never>
>;

type StoredEquipmentRules = {
  descriptions: readonly string[];
  targetMultipliers: readonly EquipmentTargetMultiplier[];
};

export type DatabaseSeedSummary = {
  patches: number;
  buildings: number;
  buildingLevels: number;
  equipment: number;
  equipmentLevels: number;
  spells: number;
  spellLevels: number;
  objectMappings: number;
};

const objectIdCategories = [
  "buildings",
  "spells",
  "equipment",
  "heroes",
  "pets",
  "units",
  "traps",
] as const satisfies readonly (keyof ObjectIdMap)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getVerificationStatus(
  value: string | null | undefined,
): DataVerificationStatus | undefined {
  return value === "verified" ||
    value === "partial" ||
    value === "needs-review"
    ? value
    : undefined;
}

function getSourceType(
  value: string | null | undefined,
): DataSourceType | undefined {
  return value === "official" ||
    value === "manual-seed" ||
    value === "third-party"
    ? value
    : undefined;
}

function getChangedItems(value: unknown): readonly PatchChangedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is PatchChangedItem => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      (item.type === "building" ||
        item.type === "equipment" ||
        item.type === "spell" ||
        item.type === "other") &&
      typeof item.itemId === "string" &&
      typeof item.itemName === "string" &&
      typeof item.summary === "string"
    );
  });
}

function getStoredEquipmentRules(value: unknown): StoredEquipmentRules {
  if (Array.isArray(value)) {
    return {
      descriptions: getStringArray(value),
      targetMultipliers: [],
    };
  }

  if (!isRecord(value)) {
    return {
      descriptions: [],
      targetMultipliers: [],
    };
  }

  const targetMultipliers = Array.isArray(value.targetMultipliers)
    ? value.targetMultipliers.filter(
        (rule): rule is EquipmentTargetMultiplier =>
          isRecord(rule) &&
          typeof rule.targetBuildingId === "string" &&
          typeof rule.multiplier === "number" &&
          typeof rule.description === "string",
      )
    : [];

  return {
    descriptions: getStringArray(value.descriptions),
    targetMultipliers,
  };
}

export function serializeEquipmentRules(
  level: EquipmentLevel,
): StoredEquipmentRules | undefined {
  const descriptions = level.specialRules ?? [];
  const targetMultipliers = level.targetMultipliers ?? [];

  if (descriptions.length === 0 && targetMultipliers.length === 0) {
    return undefined;
  }

  return {
    descriptions,
    targetMultipliers,
  };
}

export function createBuildingLevelKey(
  buildingId: string,
  level: number,
  townHallLevel?: number,
  isSupercharged = false,
  superchargeLevel?: number,
) {
  return [
    buildingId,
    level,
    townHallLevel ?? "unknown-th",
    isSupercharged ? "supercharged" : "standard",
    superchargeLevel ?? 0,
  ].join(":");
}

export function getDatabaseSeedSummary(
  data: Pick<
    GameDataCatalog,
    "patches" | "buildings" | "equipment" | "spells" | "objectIdMap"
  >,
): DatabaseSeedSummary {
  return {
    patches: data.patches.length,
    buildings: data.buildings.length,
    buildingLevels: data.buildings.reduce(
      (total, building) => total + building.levels.length,
      0,
    ),
    equipment: data.equipment.length,
    equipmentLevels: data.equipment.reduce(
      (total, item) => total + item.levels.length,
      0,
    ),
    spells: data.spells.length,
    spellLevels: data.spells.reduce(
      (total, spell) => total + spell.levels.length,
      0,
    ),
    objectMappings: Object.values(data.objectIdMap).reduce(
      (total, mappings) => total + Object.keys(mappings).length,
      0,
    ),
  };
}

export function mapDbPatchToPatchInfo(row: DbPatch): PatchInfo {
  const sourceUrls = getStringArray(row.sourceUrls);
  const changedItems = getChangedItems(row.changedItems);

  return {
    id: row.id,
    name: row.name,
    releaseDate: row.releaseDate?.toISOString().slice(0, 10),
    sourceUrl: row.sourceUrl ?? undefined,
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : undefined,
    notes: row.notes ?? "No patch notes recorded.",
    isCurrent: row.isCurrent,
    verificationStatus: getVerificationStatus(row.verificationStatus) ?? "partial",
    verifiedAt: row.verifiedAt?.toISOString().slice(0, 10),
    changedItems: changedItems.length > 0 ? changedItems : undefined,
  };
}

function mapDbBuildingLevel(
  row: DbBuilding["levels"][number],
): BuildingLevel | undefined {
  if (
    row.townHallLevel === null ||
    row.hp === null
  ) {
    return undefined;
  }

  return {
    level: row.level,
    townHallLevel: row.townHallLevel,
    hp: row.hp,
    patchId: row.patchId ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    isSupercharged: row.isSupercharged || undefined,
    superchargeLevel: row.superchargeLevel ?? undefined,
  };
}

export function mapDbBuildingToBuildingDefinition(
  row: DbBuilding,
): BuildingDefinition {
  return {
    id: row.id,
    dataId: row.dataId ?? undefined,
    name: row.name,
    village: row.village as BuildingDefinition["village"],
    category: row.category as BuildingDefinition["category"],
    targetType: row.targetType as BuildingDefinition["targetType"],
    canBeSupercharged: row.canBeSupercharged,
    levels: row.levels
      .map(mapDbBuildingLevel)
      .filter((level): level is BuildingLevel => level !== undefined)
      .sort((first, second) => first.level - second.level),
  };
}

function mapDbEquipmentLevel(
  row: DbEquipment["levels"][number],
): EquipmentLevel {
  const rules = getStoredEquipmentRules(row.specialRules);

  return {
    level: row.level,
    damage: row.damage ?? undefined,
    damagePerSecond: row.damagePerSecond ?? undefined,
    regeneration: row.regeneration ?? undefined,
    healing: row.healing ?? undefined,
    hpIncrease: row.hpIncrease ?? undefined,
    abilityDescription: row.abilityDescription ?? undefined,
    specialRules:
      rules.descriptions.length > 0 ? rules.descriptions : undefined,
    targetMultipliers:
      rules.targetMultipliers.length > 0
        ? rules.targetMultipliers
        : undefined,
    patchId: row.patchId ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    sourceType: getSourceType(row.sourceType),
    verificationStatus: getVerificationStatus(row.verificationStatus),
    notes: row.notes ?? undefined,
  };
}

export function mapDbEquipmentToEquipmentDefinition(
  row: DbEquipment,
): EquipmentDefinition {
  const sourceUrls = getStringArray(row.sourceUrls);

  return {
    id: row.id,
    dataId: row.dataId ?? undefined,
    name: row.name,
    hero: row.hero as EquipmentDefinition["hero"],
    rarity: row.rarity as EquipmentDefinition["rarity"],
    category: (row.category ?? "active") as EquipmentDefinition["category"],
    patchId: row.patchId ?? undefined,
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : undefined,
    verificationStatus: getVerificationStatus(row.verificationStatus),
    notes: row.notes ?? undefined,
    calculatorEnabled: row.calculatorEnabled,
    defaultLevel: row.defaultLevel ?? undefined,
    levels: row.levels
      .map(mapDbEquipmentLevel)
      .sort((first, second) => first.level - second.level),
  };
}

function mapDbSpellLevel(
  row: DbSpell["levels"][number],
): SpellLevel {
  return {
    level: row.level,
    damage: row.damage ?? undefined,
    damagePercent: row.damagePercent ?? undefined,
    repeatDamageRule:
      row.repeatDamageRule === "diminishing-odd-denominator"
        ? (row.repeatDamageRule as SpellRepeatDamageRule)
        : undefined,
    patchId: row.patchId ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    sourceType: getSourceType(row.sourceType),
    verificationStatus: getVerificationStatus(row.verificationStatus),
    notes: row.notes ?? undefined,
  };
}

export function mapDbSpellToSpellDefinition(
  row: DbSpell,
): SpellDefinition {
  const sourceUrls = getStringArray(row.sourceUrls);

  return {
    id: row.id,
    dataId: row.dataId ?? undefined,
    name: row.name,
    village: row.village as SpellDefinition["village"],
    spellType: row.spellType as SpellDefinition["spellType"],
    housingSpace: row.housingSpace ?? undefined,
    patchId: row.patchId ?? undefined,
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : undefined,
    verificationStatus: getVerificationStatus(row.verificationStatus),
    notes: row.notes ?? undefined,
    calculatorEnabled: row.calculatorEnabled,
    defaultLevel: row.defaultLevel ?? undefined,
    levels: row.levels
      .map(mapDbSpellLevel)
      .sort((first, second) => first.level - second.level),
  };
}

export function mapDbObjectIdMappings(
  rows: readonly DbObjectIdMapping[],
): ObjectIdMap {
  const result = Object.fromEntries(
    objectIdCategories.map((category) => [category, {}]),
  ) as Record<keyof ObjectIdMap, Record<number, string>>;

  for (const row of rows) {
    if (objectIdCategories.includes(row.category as keyof ObjectIdMap)) {
      result[row.category as keyof ObjectIdMap][row.dataId] = row.appObjectId;
    }
  }

  return result;
}

export async function getDatabaseGameData(
  prisma: PrismaClient,
): Promise<GameDataCatalog> {
  const [patchRows, buildingRows, equipmentRows, spellRows, mappingRows] =
    await Promise.all([
      prisma.patch.findMany({ orderBy: { releaseDate: "desc" } }),
      prisma.building.findMany({
        include: { levels: true },
        orderBy: { name: "asc" },
      }),
      prisma.equipment.findMany({
        include: { levels: true },
        orderBy: { name: "asc" },
      }),
      prisma.spell.findMany({
        include: { levels: true },
        orderBy: { name: "asc" },
      }),
      prisma.objectIdMapping.findMany({
        orderBy: [{ category: "asc" }, { dataId: "asc" }],
      }),
    ]);
  const patches = patchRows.map(mapDbPatchToPatchInfo);

  return {
    patches,
    buildings: buildingRows.map(mapDbBuildingToBuildingDefinition),
    equipment: equipmentRows.map(mapDbEquipmentToEquipmentDefinition),
    spells: spellRows.map(mapDbSpellToSpellDefinition),
    objectIdMap: mapDbObjectIdMappings(mappingRows),
    currentPatchId: patches.find((patch) => patch.isCurrent)?.id,
  };
}
