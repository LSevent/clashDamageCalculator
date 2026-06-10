import type {
  DataAuditInput,
  DataAuditSummary,
  StaticDataRow,
} from "@/src/types/game/data-audit";
import type {
  BuildingDefinition,
  DataVerificationStatus,
  EquipmentDefinition,
  SpellDefinition,
} from "@/src/types/game/game-data";

type VersionedLevel = {
  patchId?: string;
  sourceUrl?: string;
  verificationStatus?: DataVerificationStatus;
};

type VersionedDefinition = {
  patchId?: string;
  sourceUrls?: readonly string[];
  verificationStatus?: DataVerificationStatus;
  notes?: string;
  levels: readonly VersionedLevel[];
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

function getDefinitionStatus(
  definition: VersionedDefinition,
): DataVerificationStatus {
  if (definition.verificationStatus) {
    return definition.verificationStatus;
  }

  return (
    definition.levels.length === 0 ||
    definition.levels.some(
      (level) => !level.sourceUrl?.trim() || !level.patchId?.trim(),
    )
  )
    ? "partial"
    : "verified";
}

function getDefinitionSourceUrls(definition: VersionedDefinition) {
  return [
    ...new Set([
      ...(definition.sourceUrls ?? []),
      ...definition.levels.flatMap((level) =>
        level.sourceUrl ? [level.sourceUrl] : [],
      ),
    ]),
  ];
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
    ].filter((definition) => getDefinitionStatus(definition) === "partial")
      .length,
    needsReviewDataItems: [
      ...input.buildings,
      ...input.equipment,
      ...input.spells,
    ].filter(
      (definition) => getDefinitionStatus(definition) === "needs-review",
    ).length,
  };
}

export function createBuildingAuditRows(
  buildings: readonly BuildingDefinition[],
): readonly StaticDataRow[] {
  return buildings.map((building) => {
    const verificationStatus = getDefinitionStatus(building);

    return {
      id: building.id,
      name: building.name,
      levelCount: building.levels.length,
      latestPatchId: getLatestPatchId(building.levels),
      missingSourceCount: getMissingSourceCount(building.levels),
      isPartial: verificationStatus !== "verified",
      verificationStatus,
      sourceUrls: getDefinitionSourceUrls(building),
    };
  });
}

export function createEquipmentAuditRows(
  equipment: readonly EquipmentDefinition[],
): readonly StaticDataRow[] {
  return equipment.map((item) => {
    const verificationStatus = getDefinitionStatus(item);

    return {
      id: item.id,
      name: item.name,
      levelCount: item.levels.length,
      latestPatchId: getLatestPatchId(item.levels) ?? item.patchId,
      missingSourceCount: getMissingSourceCount(item.levels),
      isPartial: verificationStatus !== "verified",
      verificationStatus,
      sourceUrls: getDefinitionSourceUrls(item),
      notes: item.notes,
    };
  });
}

export function createSpellAuditRows(
  spells: readonly SpellDefinition[],
): readonly StaticDataRow[] {
  return spells.map((spell) => {
    const verificationStatus = getDefinitionStatus(spell);

    return {
      id: spell.id,
      name: spell.name,
      levelCount: spell.levels.length,
      latestPatchId: getLatestPatchId(spell.levels) ?? spell.patchId,
      missingSourceCount: getMissingSourceCount(spell.levels),
      isPartial: verificationStatus !== "verified",
      verificationStatus,
      sourceUrls: getDefinitionSourceUrls(spell),
      notes: spell.notes,
    };
  });
}
