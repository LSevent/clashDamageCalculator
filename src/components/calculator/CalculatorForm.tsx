"use client";

import { useMemo, useState } from "react";

import {
  analyzeComboAgainstTargets,
  calculateTotalDamage,
  createEarthquakeDamageSource,
  createEquipmentDamageSource,
  findMinimumEarthquakes,
  getTargetBuildingFromData,
} from "@/src/lib/game";
import { useUserProgress } from "@/src/lib/game/use-user-progress";
import { Badge } from "@/src/components/ui/Badge";
import type {
  BuildingTarget,
  EquipmentDamageSource,
  SpellDamageSource,
} from "@/src/types/game/calculator";
import type {
  BuildingDefinition,
  EquipmentDefinition,
  GameDataBundle,
  SpellDefinition,
} from "@/src/types/game/game-data";
import type { UserProgress } from "@/src/types/game/user-progress";

import { CalculatorResult } from "./CalculatorResult";
import { OtherTargetResultsCard } from "./OtherTargetResultsCard";
import {
  EquipmentSelector,
  type EquipmentSelection,
} from "./EquipmentSelector";
import { SpellSelector, type SpellSelection } from "./SpellSelector";
import { TargetBuildingSelector } from "./TargetBuildingSelector";
import { Card } from "../ui/Card";

function getDefaultEquipmentLevel(item: EquipmentDefinition | undefined) {
  return item?.defaultLevel ?? item?.levels.at(-1)?.level;
}

function buildInitialEquipmentSelections(
  equipmentDefinitions: readonly EquipmentDefinition[],
  savedProgress?: UserProgress,
) {
  return Object.fromEntries(
    equipmentDefinitions.map((item) => {
      const savedLevel = savedProgress?.equipmentLevels[item.id];
      const selectedLevel = item.levels.some(
        (level) => level.level === savedLevel,
      )
        ? savedLevel
        : getDefaultEquipmentLevel(item);

      return [
        item.id,
        {
          enabled: item.levels.length > 0,
          level: selectedLevel,
        },
      ];
    }),
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

type CalculatorFormProps = {
  gameData: Pick<
    GameDataBundle,
    "source" | "buildings" | "equipment" | "spells"
  >;
};

export function CalculatorForm({ gameData }: CalculatorFormProps) {
  const { savedProgress, hasSavedProgress } = useUserProgress();
  const equipmentDefinitions = gameData.equipment.filter(
    (item) => item.calculatorEnabled,
  );
  const spellDefinitions = gameData.spells.filter(
    (spell) => spell.calculatorEnabled,
  );

  return (
    <CalculatorEditor
      key={`${gameData.source}-${savedProgress?.updatedAt ?? "default-calculator"}`}
      savedProgress={savedProgress}
      hasSavedProgress={hasSavedProgress}
      dataSource={gameData.source}
      buildingDefinitions={gameData.buildings}
      equipmentDefinitions={equipmentDefinitions}
      spellDefinitions={spellDefinitions}
    />
  );
}

type CalculatorEditorProps = {
  savedProgress: UserProgress | undefined;
  hasSavedProgress: boolean;
  dataSource: GameDataBundle["source"];
  buildingDefinitions: readonly BuildingDefinition[];
  equipmentDefinitions: readonly EquipmentDefinition[];
  spellDefinitions: readonly SpellDefinition[];
};

function CalculatorEditor({
  savedProgress,
  hasSavedProgress,
  dataSource,
  buildingDefinitions,
  equipmentDefinitions,
  spellDefinitions,
}: CalculatorEditorProps) {
  const defaultBuilding =
    buildingDefinitions.find((building) => building.id === "scattershot") ??
    buildingDefinitions[0];
  const defaultBuildingLevel = defaultBuilding?.levels[0];
  const earthquakeSpell = spellDefinitions.find(
    (spell) => spell.id === "earthquake-spell",
  );
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
  >(() =>
    buildInitialEquipmentSelections(equipmentDefinitions, savedProgress),
  );
  const savedEarthquakeLevel =
    savedProgress?.spellLevels["earthquake-spell"];
  const defaultEarthquakeLevel = earthquakeSpell?.levels.some(
    (level) => level.level === savedEarthquakeLevel,
  )
    ? savedEarthquakeLevel
    : earthquakeSpell?.levels.at(-1)?.level;
  const [earthquakeSelection, setEarthquakeSelection] = useState<SpellSelection>({
    enabled: Boolean(earthquakeSpell?.levels.length),
    level: defaultEarthquakeLevel,
    count: 3,
  });

  const selectedBuilding = useMemo(
    () =>
      buildingDefinitions.find(
        (building) => building.id === selectedBuildingId,
      ),
    [buildingDefinitions, selectedBuildingId],
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
          }, buildingDefinitions)
        : undefined,
    [
      buildingDefinitions,
      selectedBuildingId,
      effectiveBuildingLevel,
      effectiveSuperchargeLevel,
      selectedTownHallLevel,
    ],
  );

  const equipmentSources = useMemo(() => {
    if (!selectedBuildingId) {
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
          selectedBuildingId,
          equipmentDefinitions,
        );
      })
      .filter(isEquipmentSource);
  }, [equipmentDefinitions, equipmentSelections, selectedBuildingId]);

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
        spellDefinitions,
      ),
    ].filter(isSpellSource);
  }, [earthquakeSelection, spellDefinitions]);

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
      spellDefinitions,
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
  }, [
    earthquakeSelection.level,
    equipmentSources,
    spellDefinitions,
    target,
  ]);
  const otherTargetAnalysis = useMemo(
    () =>
      analyzeComboAgainstTargets({
        townHallLevel: selectedTownHallLevel,
        equipmentSources,
        spellSources,
        selectedTargetBuildingId: selectedBuildingId,
        buildingDefinitions,
        equipmentDefinitions,
      }),
    [
      buildingDefinitions,
      equipmentSources,
      equipmentDefinitions,
      selectedBuildingId,
      selectedTownHallLevel,
      spellSources,
    ],
  );

  const missingReason = getMissingReason(
    target,
    selectedBuilding,
    selectedTownHallLevel,
  );

  return (
    <div className="mt-12">
      <div className="mb-4 flex justify-end">
        <Badge tone={dataSource === "database" ? "success" : "neutral"}>
          Data source:{" "}
          {dataSource === "database" ? "Database" : "Static fallback"}
        </Badge>
      </div>
      {hasSavedProgress && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="info">Using saved progress</Badge>
            <p className="mt-2 text-sm text-slate-400">
              Equipment and spell levels started from your locally saved profile
              ({savedProgress?.source === "json-import"
                ? "JSON import"
                : "manual"}).
            </p>
          </div>
          <p className="text-xs font-bold text-slate-500">
            Calculator changes are not saved automatically.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
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
                      getDefaultEquipmentLevel(
                        equipmentDefinitions.find(
                          (item) => item.id === equipmentId,
                        ),
                      ),
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

      <OtherTargetResultsCard
        analysis={otherTargetAnalysis}
        equipmentSources={equipmentSources}
        spellSources={spellSources}
      />
    </div>
  );
}
