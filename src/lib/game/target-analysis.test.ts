import { describe, expect, it } from "vitest";

import type {
  EquipmentDamageSource,
  SpellDamageSource,
} from "@/src/types/game/calculator";
import type { BuildingDefinition } from "@/src/types/game/game-data";

import {
  createEarthquakeDamageSource,
  createEquipmentDamageSource,
} from "./damage-calculator";
import { analyzeComboAgainstTargets } from "./target-analysis";

const testBuildings = [
  {
    id: "selected-target",
    name: "Selected Target",
    village: "home",
    category: "defense",
    targetType: "ground-and-air",
    canBeSupercharged: false,
    levels: [
      {
        level: 1,
        townHallLevel: 18,
        hp: 4000,
        patchId: "test-patch",
      },
    ],
  },
  {
    id: "x-bow",
    name: "X-Bow",
    village: "home",
    category: "defense",
    targetType: "ground-and-air",
    canBeSupercharged: false,
    levels: [
      {
        level: 12,
        townHallLevel: 18,
        hp: 4000,
        patchId: "test-patch",
      },
    ],
  },
  {
    id: "air-defense",
    name: "Air Defense",
    village: "home",
    category: "defense",
    targetType: "air",
    canBeSupercharged: false,
    levels: [
      {
        level: 14,
        townHallLevel: 18,
        hp: 4000,
        patchId: "test-patch",
      },
    ],
  },
  {
    id: "missing-building",
    name: "Missing Building",
    village: "home",
    category: "defense",
    targetType: "ground",
    canBeSupercharged: false,
    levels: [],
  },
] as const satisfies readonly BuildingDefinition[];

function requiredEquipmentSource(
  equipmentId: string,
  level: number,
  targetBuildingId = "selected-target",
): EquipmentDamageSource {
  const source = createEquipmentDamageSource(
    equipmentId,
    level,
    targetBuildingId,
  );

  if (!source) {
    throw new Error(`Missing test equipment source: ${equipmentId} Lv${level}`);
  }

  return source;
}

function requiredEarthquakeSource(count: number): SpellDamageSource {
  const source = createEarthquakeDamageSource("earthquake-spell", 5, count);

  if (!source) {
    throw new Error("Missing test Earthquake source.");
  }

  return source;
}

describe("other target analysis", () => {
  it("excludes the selected target by default", () => {
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      selectedTargetBuildingId: "selected-target",
      buildingDefinitions: testBuildings,
    });

    expect(
      summary.results.some((result) => result.buildingId === "selected-target"),
    ).toBe(false);
    expect(summary.totalTargetsChecked).toBe(3);
  });

  it("calculates percentage spell damage separately for each target HP", () => {
    const fixtures = [
      {
        ...testBuildings[1],
        levels: [{ ...testBuildings[1].levels[0], hp: 1000 }],
      },
      {
        ...testBuildings[2],
        levels: [{ ...testBuildings[2].levels[0], hp: 2000 }],
      },
    ] satisfies readonly BuildingDefinition[];
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      equipmentSources: [requiredEquipmentSource("giant-arrow", 18)],
      spellSources: [requiredEarthquakeSource(1)],
      buildingDefinitions: fixtures,
    });
    const xBow = summary.results.find((result) => result.buildingId === "x-bow");
    const airDefense = summary.results.find(
      (result) => result.buildingId === "air-defense",
    );

    expect(xBow?.calculationResult?.spellDamage).toBe(290);
    expect(airDefense?.calculationResult?.spellDamage).toBe(580);
  });

  it("rebuilds Giant Arrow damage so Air Defense receives the 2x rule", () => {
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      equipmentSources: [requiredEquipmentSource("giant-arrow", 18)],
      selectedTargetBuildingId: "selected-target",
      buildingDefinitions: testBuildings,
    });
    const xBow = summary.results.find((result) => result.buildingId === "x-bow");
    const airDefense = summary.results.find(
      (result) => result.buildingId === "air-defense",
    );

    expect(xBow?.calculationResult?.directDamage).toBe(1500);
    expect(airDefense?.calculationResult?.directDamage).toBe(3000);
    expect(airDefense?.calculationResult?.breakdown[0]?.notes).toContain(
      "2x damage applied against Air Defense",
    );
  });

  it("counts destroyed and surviving targets correctly", () => {
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      equipmentSources: [
        requiredEquipmentSource("giant-arrow", 18),
        requiredEquipmentSource("rocket-backpack", 24),
      ],
      selectedTargetBuildingId: "selected-target",
      buildingDefinitions: testBuildings,
    });

    expect(summary.destroyedCount).toBe(1);
    expect(summary.notDestroyedCount).toBe(1);
    expect(
      summary.results.find((result) => result.buildingId === "air-defense")
        ?.status,
    ).toBe("destroyed");
    expect(
      summary.results.find((result) => result.buildingId === "x-bow")?.status,
    ).toBe("not-destroyed");
  });

  it("returns missing-data rows when Town Hall HP is unavailable", () => {
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      buildingDefinitions: testBuildings,
    });
    const missing = summary.results.find(
      (result) => result.buildingId === "missing-building",
    );

    expect(summary.missingDataCount).toBe(1);
    expect(missing?.status).toBe("missing-data");
    expect(missing?.notes).toContain(
      "No HP data available for this Town Hall level.",
    );
  });

  it("does not mark Earthquake-only targets as destroyed", () => {
    const summary = analyzeComboAgainstTargets({
      townHallLevel: 18,
      spellSources: [requiredEarthquakeSource(11)],
      selectedTargetBuildingId: "selected-target",
      buildingDefinitions: testBuildings,
    });
    const calculated = summary.results.filter(
      (result) => result.status !== "missing-data",
    );

    expect(calculated).toHaveLength(2);
    expect(calculated.every((result) => !result.destroyed)).toBe(true);
    expect(
      calculated.every((result) =>
        result.notes.includes("Earthquake cannot finish a building by itself."),
      ),
    ).toBe(true);
  });

  it("does not mutate supplied building data", () => {
    const before = JSON.stringify(testBuildings);

    analyzeComboAgainstTargets({
      townHallLevel: 18,
      equipmentSources: [requiredEquipmentSource("giant-arrow", 18)],
      spellSources: [requiredEarthquakeSource(2)],
      buildingDefinitions: testBuildings,
    });

    expect(JSON.stringify(testBuildings)).toBe(before);
  });
});
