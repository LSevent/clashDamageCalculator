"use client";

import { useMemo, useState } from "react";

import { buildings, equipment, spells } from "@/src/data/game";
import {
  calculateTotalDamage,
  createEarthquakeDamageSource,
  createEquipmentDamageSource,
  findMinimumEarthquakes,
  getTargetBuildingFromData,
} from "@/src/lib/game";
import type {
  BuildingTarget,
  EquipmentDamageSource,
  SpellDamageSource,
} from "@/src/types/game/calculator";
import type {
  BuildingDefinition,
  EquipmentDefinition,
  SpellDefinition,
} from "@/src/types/game/game-data";

import { CalculatorResult } from "./CalculatorResult";
import {
  EquipmentSelector,
  type EquipmentSelection,
} from "./EquipmentSelector";
import { SpellSelector, type SpellSelection } from "./SpellSelector";
import { TargetBuildingSelector } from "./TargetBuildingSelector";
import { Card } from "../ui/Card";

const buildingDefinitions: readonly BuildingDefinition[] = buildings;
const equipmentDefinitions: readonly EquipmentDefinition[] = equipment;
const spellDefinitions: readonly SpellDefinition[] = spells;
const defaultBuilding =
  buildingDefinitions.find((building) => building.id === "scattershot") ??
  buildingDefinitions[0];
const defaultBuildingLevel = defaultBuilding?.levels[0];
const earthquakeSpell = spellDefinitions.find(
  (spell) => spell.id === "earthquake-spell",
);

function buildInitialEquipmentSelections() {
  return Object.fromEntries(
    equipmentDefinitions.map((item) => [
      item.id,
      {
        enabled: item.levels.length > 0,
        level: item.levels.at(-1)?.level,
      },
    ]),
  );
}

function getMissingReason(
  target: BuildingTarget | undefined,
  selectedBuilding: BuildingDefinition | undefined,
  selectedTownHallLevel: number,
) {
  if (target) {
    return undefined;
  }

  if (!selectedBuilding) {
    return "Select a target building to begin.";
  }

  return `${selectedBuilding.name} does not have HP data for TH${selectedTownHallLevel} yet. Pick a target with loaded HP data or add that level to the static data file.`;
}

function isEquipmentSource(
  source: EquipmentDamageSource | undefined,
): source is EquipmentDamageSource {
  return source !== undefined;
}

function isSpellSource(
  source: SpellDamageSource | undefined,
): source is SpellDamageSource {
  return source !== undefined;
}

export function CalculatorForm() {
  const [selectedTownHallLevel, setSelectedTownHallLevel] = useState(
    defaultBuildingLevel?.townHallLevel ?? 18,
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState(
    defaultBuilding?.id ?? "",
  );
  const [selectedBuildingLevel, setSelectedBuildingLevel] = useState<
    number | undefined
  >(defaultBuildingLevel?.level);
  const [selectedSuperchargeLevel, setSelectedSuperchargeLevel] = useState<
    number | undefined
  >(undefined);
  const [equipmentSelections, setEquipmentSelections] = useState<
    Record<string, EquipmentSelection>
  >(buildInitialEquipmentSelections);
  const [earthquakeSelection, setEarthquakeSelection] = useState<SpellSelection>({
    enabled: Boolean(earthquakeSpell?.levels.length),
    level: earthquakeSpell?.levels.at(-1)?.level,
    count: 3,
  });

  const selectedBuilding = useMemo(
    () =>
      buildingDefinitions.find(
        (building) => building.id === selectedBuildingId,
      ),
    [selectedBuildingId],
  );
  const availableLevels = useMemo(
    () =>
      [...(selectedBuilding?.levels ?? [])]
        .filter((level) => level.townHallLevel === selectedTownHallLevel)
        .sort((first, second) => first.level - second.level),
    [selectedBuilding, selectedTownHallLevel],
  );

  const effectiveBuildingLevel =
    selectedBuildingLevel !== undefined &&
    availableLevels.some((level) => level.level === selectedBuildingLevel)
      ? selectedBuildingLevel
      : availableLevels[0]?.level;
  const availableSuperchargeLevels = availableLevels
    .filter((level) => level.isSupercharged && level.superchargeLevel)
    .map((level) => level.superchargeLevel)
    .filter((level): level is number => level !== undefined);
  const effectiveSuperchargeLevel =
    selectedSuperchargeLevel !== undefined &&
    availableSuperchargeLevels.includes(selectedSuperchargeLevel)
      ? selectedSuperchargeLevel
      : undefined;

  const target = useMemo(
    () =>
      selectedBuildingId
        ? getTargetBuildingFromData(selectedBuildingId, selectedTownHallLevel, {
            buildingLevel: effectiveBuildingLevel,
            superchargeLevel: effectiveSuperchargeLevel,
          })
        : undefined,
    [
      selectedBuildingId,
      effectiveBuildingLevel,
      effectiveSuperchargeLevel,
      selectedTownHallLevel,
    ],
  );

  const equipmentSources = useMemo(() => {
    if (!target) {
      return [];
    }

    return Object.entries(equipmentSelections)
      .map(([equipmentId, selection]) => {
        if (!selection.enabled || selection.level === undefined) {
          return undefined;
        }

        return createEquipmentDamageSource(
          equipmentId,
          selection.level,
          target.buildingId,
        );
      })
      .filter(isEquipmentSource);
  }, [equipmentSelections, target]);

  const spellSources = useMemo(() => {
    if (
      !earthquakeSelection.enabled ||
      earthquakeSelection.level === undefined ||
      earthquakeSelection.count === 0
    ) {
      return [];
    }

    return [
      createEarthquakeDamageSource(
        "earthquake-spell",
        earthquakeSelection.level,
        earthquakeSelection.count,
      ),
    ].filter(isSpellSource);
  }, [earthquakeSelection]);

  const result = useMemo(
    () =>
      target
        ? calculateTotalDamage({
            target,
            equipmentSources,
            spellSources,
          })
        : undefined,
    [equipmentSources, spellSources, target],
  );

  const minimumEarthquakes = useMemo(() => {
    if (!target || earthquakeSelection.level === undefined) {
      return undefined;
    }

    const earthquakeSource = createEarthquakeDamageSource(
      "earthquake-spell",
      earthquakeSelection.level,
      1,
    );

    if (!earthquakeSource) {
      return undefined;
    }

    return findMinimumEarthquakes({
      target,
      equipmentSources,
      earthquakeSource,
      maxEarthquakes: 11,
    });
  }, [earthquakeSelection.level, equipmentSources, target]);

  const missingReason = getMissingReason(
    target,
    selectedBuilding,
    selectedTownHallLevel,
  );

  return (
    <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <Card className="p-5 sm:p-7">
        <div className="space-y-8">
          <TargetBuildingSelector
            buildings={buildingDefinitions}
            selectedTownHallLevel={selectedTownHallLevel}
            selectedBuildingId={selectedBuildingId}
            selectedBuildingLevel={effectiveBuildingLevel}
            selectedSuperchargeLevel={effectiveSuperchargeLevel}
            availableLevels={availableLevels}
            onTownHallChange={(townHallLevel) => {
              setSelectedTownHallLevel(townHallLevel);
              setSelectedBuildingLevel(undefined);
              setSelectedSuperchargeLevel(undefined);
            }}
            onBuildingChange={(buildingId) => {
              setSelectedBuildingId(buildingId);
              setSelectedBuildingLevel(undefined);
              setSelectedSuperchargeLevel(undefined);
            }}
            onBuildingLevelChange={setSelectedBuildingLevel}
            onSuperchargeLevelChange={setSelectedSuperchargeLevel}
          />

          <EquipmentSelector
            equipmentItems={equipmentDefinitions}
            selections={equipmentSelections}
            onToggle={(equipmentId, enabled) =>
              setEquipmentSelections((current) => ({
                ...current,
                [equipmentId]: {
                  ...current[equipmentId],
                  enabled,
                  level:
                    current[equipmentId]?.level ??
                    equipmentDefinitions
                      .find((item) => item.id === equipmentId)
                      ?.levels.at(-1)?.level,
                },
              }))
            }
            onLevelChange={(equipmentId, level) =>
              setEquipmentSelections((current) => ({
                ...current,
                [equipmentId]: {
                  enabled: current[equipmentId]?.enabled ?? true,
                  level,
                },
              }))
            }
          />

          <SpellSelector
            spell={earthquakeSpell}
            selection={earthquakeSelection}
            onToggle={(enabled) =>
              setEarthquakeSelection((current) => ({ ...current, enabled }))
            }
            onLevelChange={(level) =>
              setEarthquakeSelection((current) => ({ ...current, level }))
            }
            onCountChange={(count) =>
              setEarthquakeSelection((current) => ({ ...current, count }))
            }
          />
        </div>
      </Card>

      <Card className="p-5 sm:p-7">
        <CalculatorResult
          target={target}
          result={result}
          minimumEarthquakes={minimumEarthquakes}
          missingReason={missingReason}
        />
      </Card>
    </div>
  );
}
