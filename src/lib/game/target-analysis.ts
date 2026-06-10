import { buildings } from "@/src/data/game";
import type {
  AnalyzeComboAgainstTargetsInput,
  CalculatedOtherTargetAnalysisResult,
  EquipmentDamageSource,
  MissingOtherTargetAnalysisResult,
  OtherTargetAnalysisSummary,
} from "@/src/types/game/calculator";
import type {
  BuildingDefinition,
  BuildingLevel,
} from "@/src/types/game/game-data";

import {
  calculateTotalDamage,
  createEquipmentDamageSource,
} from "./damage-calculator";

const MISSING_HP_NOTE = "No HP data available for this Town Hall level.";

function getHighestAvailableLevel(
  building: BuildingDefinition,
  townHallLevel: number,
): BuildingLevel | undefined {
  return [...building.levels]
    .filter((level) => level.townHallLevel === townHallLevel)
    .sort(
      (first, second) =>
        second.level - first.level ||
        (second.superchargeLevel ?? 0) - (first.superchargeLevel ?? 0),
    )[0];
}

function createEquipmentSourcesForTarget(
  sources: readonly EquipmentDamageSource[],
  targetBuildingId: string,
): readonly EquipmentDamageSource[] {
  return sources.map((source) => {
    const dataSource = createEquipmentDamageSource(
      source.sourceId,
      source.level,
      targetBuildingId,
    );

    if (dataSource) {
      return dataSource;
    }

    return {
      ...source,
      specialTargetRules: source.specialTargetRules?.filter(
        (rule) => rule.targetBuildingId === targetBuildingId,
      ),
    };
  });
}

function compareNames(
  first: { buildingName: string },
  second: { buildingName: string },
) {
  return first.buildingName.localeCompare(second.buildingName);
}

export function analyzeComboAgainstTargets({
  townHallLevel,
  equipmentSources = [],
  spellSources = [],
  selectedTargetBuildingId,
  excludeSelectedTarget = true,
  buildingDefinitions = buildings,
}: AnalyzeComboAgainstTargetsInput): OtherTargetAnalysisSummary {
  const calculatedResults: CalculatedOtherTargetAnalysisResult[] = [];
  const missingResults: MissingOtherTargetAnalysisResult[] = [];

  for (const building of buildingDefinitions) {
    if (building.village !== "home") {
      continue;
    }

    if (
      excludeSelectedTarget &&
      selectedTargetBuildingId &&
      building.id === selectedTargetBuildingId
    ) {
      continue;
    }

    const buildingLevel = getHighestAvailableLevel(building, townHallLevel);

    if (!buildingLevel) {
      missingResults.push({
        status: "missing-data",
        buildingId: building.id,
        buildingName: building.name,
        townHallLevel,
        destroyed: false,
        notes: [MISSING_HP_NOTE],
      });
      continue;
    }

    const target = {
      buildingId: building.id,
      buildingName: building.name,
      buildingLevel: buildingLevel.level,
      townHallLevel,
      hp: buildingLevel.hp,
      superchargeLevel: buildingLevel.superchargeLevel,
    };
    const calculationResult = calculateTotalDamage({
      target,
      equipmentSources: createEquipmentSourcesForTarget(
        equipmentSources,
        building.id,
      ),
      spellSources,
    });
    const notes = [
      ...new Set([
        ...calculationResult.notes,
        ...calculationResult.breakdown.flatMap((item) => item.notes),
      ]),
    ];

    calculatedResults.push({
      status: calculationResult.destroyed ? "destroyed" : "not-destroyed",
      buildingId: building.id,
      buildingName: building.name,
      townHallLevel,
      buildingLevel: buildingLevel.level,
      hp: buildingLevel.hp,
      destroyed: calculationResult.destroyed,
      totalDamage: calculationResult.totalDamage,
      directDamage: calculationResult.directDamage,
      spellDamage: calculationResult.spellDamage,
      remainingHp: calculationResult.remainingHp,
      overkillDamage: calculationResult.overkillDamage,
      notes,
      calculationResult,
    });
  }

  const destroyedResults = calculatedResults
    .filter((result) => result.destroyed)
    .sort(
      (first, second) =>
        second.overkillDamage - first.overkillDamage ||
        second.hp - first.hp ||
        compareNames(first, second),
    );
  const notDestroyedResults = calculatedResults
    .filter((result) => !result.destroyed)
    .sort(
      (first, second) =>
        first.remainingHp - second.remainingHp ||
        compareNames(first, second),
    );
  missingResults.sort(compareNames);

  return {
    totalTargetsChecked:
      destroyedResults.length + notDestroyedResults.length + missingResults.length,
    destroyedCount: destroyedResults.length,
    notDestroyedCount: notDestroyedResults.length,
    missingDataCount: missingResults.length,
    results: [
      ...destroyedResults,
      ...notDestroyedResults,
      ...missingResults,
    ],
  };
}
