import type {
  DataAuditInput,
  DataAuditSummary,
  StaticDataRow,
} from "@/src/types/game/data-audit";
import type {
  BuildingDefinition,
  EquipmentDefinition,
  SpellDefinition,
} from "@/src/types/game/game-data";

type VersionedLevel = {
  patchId?: string;
  sourceUrl?: string;
};

function getLevelCoverage(levels: readonly VersionedLevel[]) {
  return levels.reduce(
    (coverage, level) => ({
      withSourceUrl:
        coverage.withSourceUrl + (level.sourceUrl?.trim() ? 1 : 0),
      missingSourceUrl:
        coverage.missingSourceUrl + (level.sourceUrl?.trim() ? 0 : 1),
      withPatchId: coverage.withPatchId + (level.patchId?.trim() ? 1 : 0),
      missingPatchId: coverage.missingPatchId + (level.patchId?.trim() ? 0 : 1),
    }),
    {
      withSourceUrl: 0,
      missingSourceUrl: 0,
      withPatchId: 0,
      missingPatchId: 0,
    },
  );
}

function isPartialDefinition(levels: readonly VersionedLevel[]) {
  return (
    levels.length === 0 ||
    levels.some((level) => !level.sourceUrl?.trim() || !level.patchId?.trim())
  );
}

export function getLatestPatchId(
  levels: readonly VersionedLevel[],
): string | undefined {
  return levels.at(-1)?.patchId;
}

export function getMissingSourceCount(levels: readonly VersionedLevel[]) {
  return levels.filter((level) => !level.sourceUrl?.trim()).length;
}

export function auditGameData(input: DataAuditInput): DataAuditSummary {
  const buildingLevels = input.buildings.flatMap((building) => building.levels);
  const equipmentLevels = input.equipment.flatMap((item) => item.levels);
  const spellLevels = input.spells.flatMap((spell) => spell.levels);
  const allLevels = [...buildingLevels, ...equipmentLevels, ...spellLevels];
  const coverage = getLevelCoverage(allLevels);
  const currentPatch =
    input.patches.find((patch) => patch.id === input.currentPatchId) ??
    input.patches.find((patch) => patch.isCurrent);

  return {
    totalPatches: input.patches.length,
    currentPatch,
    totalBuildings: input.buildings.length,
    totalBuildingLevels: buildingLevels.length,
    totalEquipment: input.equipment.length,
    totalEquipmentLevels: equipmentLevels.length,
    totalSpells: input.spells.length,
    totalSpellLevels: spellLevels.length,
    totalLevelEntries: allLevels.length,
    coverage,
    partialDataItems: [
      ...input.buildings,
      ...input.equipment,
      ...input.spells,
    ].filter((definition) => isPartialDefinition(definition.levels)).length,
  };
}

export function createBuildingAuditRows(
  buildings: readonly BuildingDefinition[],
): readonly StaticDataRow[] {
  return buildings.map((building) => ({
    id: building.id,
    name: building.name,
    levelCount: building.levels.length,
    latestPatchId: getLatestPatchId(building.levels),
    missingSourceCount: getMissingSourceCount(building.levels),
    isPartial: isPartialDefinition(building.levels),
  }));
}

export function createEquipmentAuditRows(
  equipment: readonly EquipmentDefinition[],
): readonly StaticDataRow[] {
  return equipment.map((item) => ({
    id: item.id,
    name: item.name,
    levelCount: item.levels.length,
    latestPatchId: getLatestPatchId(item.levels),
    missingSourceCount: getMissingSourceCount(item.levels),
    isPartial: isPartialDefinition(item.levels),
  }));
}

export function createSpellAuditRows(
  spells: readonly SpellDefinition[],
): readonly StaticDataRow[] {
  return spells.map((spell) => ({
    id: spell.id,
    name: spell.name,
    levelCount: spell.levels.length,
    latestPatchId: getLatestPatchId(spell.levels),
    missingSourceCount: getMissingSourceCount(spell.levels),
    isPartial: isPartialDefinition(spell.levels),
  }));
}
