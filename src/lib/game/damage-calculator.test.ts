import { describe, expect, it } from "vitest";

import type { BuildingTarget } from "@/src/types/game/calculator";

import {
  calculateEarthquakeDamage,
  calculateEquipmentDamage,
  calculateTotalDamage,
  createEarthquakeDamageSource,
  createEquipmentDamageSource,
  findMinimumEarthquakes,
} from "./damage-calculator";

const normalTarget: BuildingTarget = {
  buildingId: "x-bow",
  buildingName: "X-Bow",
  buildingLevel: 12,
  townHallLevel: 17,
  hp: 10000,
};

const airDefenseTarget: BuildingTarget = {
  buildingId: "air-defense",
  buildingName: "Air Defense",
  buildingLevel: 14,
  townHallLevel: 16,
  hp: 10000,
};

function requiredEquipmentSource(
  equipmentId: string,
  level: number,
  targetBuildingId = normalTarget.buildingId,
) {
  const source = createEquipmentDamageSource(
    equipmentId,
    level,
    targetBuildingId,
  );

  if (!source) {
    throw new Error(`Missing test equipment source: ${equipmentId} level ${level}`);
  }

  return source;
}

function requiredEarthquakeSource(count: number) {
  const source = createEarthquakeDamageSource("earthquake-spell", 5, count);

  if (!source) {
    throw new Error("Missing test Earthquake Spell source.");
  }

  return source;
}

describe("damage calculator", () => {
  it("applies Giant Arrow special target damage only against Air Defense", () => {
    const normalDamage = calculateEquipmentDamage({
      source: requiredEquipmentSource("giant-arrow", 18),
      target: normalTarget,
    });
    const airDefenseDamage = calculateEquipmentDamage({
      source: requiredEquipmentSource("giant-arrow", 18, "air-defense"),
      target: airDefenseTarget,
    });

    expect(normalDamage.finalDamage).toBe(1500);
    expect(airDefenseDamage.finalDamage).toBe(3000);
    expect(airDefenseDamage.notes).toContain(
      "2x damage applied against Air Defense",
    );
  });

  it("calculates Rocket Backpack level 24 damage", () => {
    const damage = calculateEquipmentDamage({
      source: requiredEquipmentSource("rocket-backpack", 24),
      target: normalTarget,
    });

    expect(damage.finalDamage).toBe(2050);
  });

  it("calculates Earthquake level 5 diminishing odd-denominator percentages", () => {
    const oneEarthquake = calculateEarthquakeDamage({
      source: requiredEarthquakeSource(1),
      target: normalTarget,
    });
    const twoEarthquakes = calculateEarthquakeDamage({
      source: requiredEarthquakeSource(2),
      target: normalTarget,
    });
    const threeEarthquakes = calculateEarthquakeDamage({
      source: requiredEarthquakeSource(3),
      target: normalTarget,
    });

    expect(oneEarthquake.effectivePercent).toBeCloseTo(0.29);
    expect(twoEarthquakes.effectivePercent).toBeCloseTo(0.29 * (1 + 1 / 3));
    expect(threeEarthquakes.effectivePercent).toBeCloseTo(
      0.29 * (1 + 1 / 3 + 1 / 5),
    );
  });

  it("combines Rocket Backpack and Giant Arrow damage", () => {
    const normalResult = calculateTotalDamage({
      target: normalTarget,
      equipmentSources: [
        requiredEquipmentSource("giant-arrow", 18),
        requiredEquipmentSource("rocket-backpack", 24),
      ],
    });
    const airDefenseResult = calculateTotalDamage({
      target: airDefenseTarget,
      equipmentSources: [
        requiredEquipmentSource("giant-arrow", 18, "air-defense"),
        requiredEquipmentSource("rocket-backpack", 24, "air-defense"),
      ],
    });

    expect(normalResult.totalDamage).toBe(3550);
    expect(airDefenseResult.totalDamage).toBe(5050);
  });

  it("reports destroyed, remaining HP, and overkill consistently", () => {
    const equipmentSources = [
      requiredEquipmentSource("giant-arrow", 18),
      requiredEquipmentSource("rocket-backpack", 24),
    ];
    const survives = calculateTotalDamage({
      target: { ...normalTarget, hp: 4000 },
      equipmentSources,
    });
    const destroyed = calculateTotalDamage({
      target: { ...normalTarget, hp: 3500 },
      equipmentSources,
    });

    expect(survives.destroyed).toBe(false);
    expect(survives.remainingHp).toBe(450);
    expect(survives.overkillDamage).toBe(0);
    expect(destroyed.destroyed).toBe(true);
    expect(destroyed.remainingHp).toBe(0);
    expect(destroyed.overkillDamage).toBe(50);
  });

  it("finds the minimum Earthquake count when 0 fails and 1 succeeds", () => {
    const result = findMinimumEarthquakes({
      target: { ...normalTarget, hp: 5000 },
      equipmentSources: [
        requiredEquipmentSource("giant-arrow", 18),
        requiredEquipmentSource("rocket-backpack", 24),
      ],
      earthquakeSource: requiredEarthquakeSource(1),
    });

    expect(result.possible).toBe(true);
    expect(result.earthquakeCount).toBe(1);
  });

  it("finds the minimum Earthquake count when 1 fails and 2 succeeds", () => {
    const result = findMinimumEarthquakes({
      target: { ...normalTarget, hp: 5788 },
      equipmentSources: [
        requiredEquipmentSource("giant-arrow", 18),
        requiredEquipmentSource("rocket-backpack", 24),
      ],
      earthquakeSource: requiredEarthquakeSource(1),
    });

    expect(result.possible).toBe(true);
    expect(result.earthquakeCount).toBe(2);
  });

  it("does not allow Earthquake damage to finish a building by itself", () => {
    const result = calculateTotalDamage({
      target: { ...normalTarget, hp: 500 },
      spellSources: [requiredEarthquakeSource(1000)],
    });

    expect(result.totalDamage).toBeGreaterThanOrEqual(500);
    expect(result.destroyed).toBe(false);
    expect(result.notes).toContain(
      "Earthquake cannot finish a building by itself.",
    );
  });
});
