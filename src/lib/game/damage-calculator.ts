import {
  getBuildingById,
  getBuildingLevelsByTownHall,
  getEquipmentById,
  getEquipmentLevel,
  getSpellById,
  getSpellLevel,
} from "@/src/lib/game/data-helpers";
import type {
  BuildingTarget,
  CalculateEarthquakeDamageParams,
  CalculateEquipmentDamageParams,
  DamageBreakdownItem,
  DamageCalculationInput,
  DamageCalculationResult,
  EquipmentDamageSource,
  FindMinimumEarthquakesInput,
  FindMinimumEquipmentLevelInput,
  MinimumEarthquakeResult,
  MinimumEquipmentLevelResult,
  SpellDamageSource,
  SpecialTargetRule,
  TargetBuildingOptions,
} from "@/src/types/game/calculator";
import type { SpellRepeatDamageRule } from "@/src/types/game/game-data";

const EARTHQUAKE_CANNOT_FINISH_NOTE =
  "Earthquake cannot finish a building by itself.";

const DEFAULT_MAX_EARTHQUAKES = 11;

function floorDamage(value: number): number {
  /*
   * Clash damage values are integer-like at the UI level. Phase 3 floors each
   * source after multipliers or percentages are applied, then sums the results.
   * The tiny epsilon avoids binary floating-point artifacts such as
   * 5800 * 0.29 becoming 1681.9999999999998 before flooring.
   */
  return Math.max(0, Math.floor(value + 1e-9));
}

function getPositiveCount(count: number): number {
  return Math.max(0, Math.floor(count));
}

function getSpecialTargetRules(
  equipmentId: string,
  targetBuildingId: string,
): readonly SpecialTargetRule[] {
  if (equipmentId === "giant-arrow" && targetBuildingId === "air-defense") {
    return [
      {
        targetBuildingId: "air-defense",
        multiplier: 2,
        note: "2x damage applied against Air Defense",
      },
    ];
  }

  return [];
}

function getMatchingSpecialRule(
  source: EquipmentDamageSource,
  target: BuildingTarget,
): SpecialTargetRule | undefined {
  return source.specialTargetRules?.find(
    (rule) => rule.targetBuildingId === target.buildingId,
  );
}

function getEarthquakeEffectivePercent(
  damagePercent: number,
  count: number,
  repeatDamageRule?: SpellRepeatDamageRule,
): number {
  const spellCount = getPositiveCount(count);

  if (spellCount === 0 || damagePercent <= 0) {
    return 0;
  }

  if (repeatDamageRule !== "diminishing-odd-denominator") {
    return damagePercent * spellCount;
  }

  let multiplier = 0;

  for (let earthquakeIndex = 1; earthquakeIndex <= spellCount; earthquakeIndex += 1) {
    multiplier += 1 / (2 * earthquakeIndex - 1);
  }

  return damagePercent * multiplier;
}

export function calculateEquipmentDamage({
  source,
  target,
}: CalculateEquipmentDamageParams): DamageBreakdownItem {
  const specialRule = getMatchingSpecialRule(source, target);
  const multiplier = specialRule?.multiplier ?? 1;
  const finalDamage = floorDamage(source.damage * multiplier);

  return {
    sourceType: "equipment",
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    level: source.level,
    baseDamage: source.damage,
    finalDamage,
    notes: specialRule ? [specialRule.note] : [],
  };
}

export function calculateEarthquakeDamage({
  source,
  target,
}: CalculateEarthquakeDamageParams): DamageBreakdownItem {
  const count = getPositiveCount(source.count);
  const damagePercent = source.damagePercent ?? 0;
  const effectivePercent = getEarthquakeEffectivePercent(
    damagePercent,
    count,
    source.repeatDamageRule,
  );
  const percentDamage = floorDamage(target.hp * effectivePercent);
  const flatDamage = floorDamage((source.damage ?? 0) * count);
  const notes =
    source.repeatDamageRule === "diminishing-odd-denominator"
      ? ["Repeated Earthquake uses the diminishing odd-denominator rule."]
      : [];

  // TODO: Add building-specific spell immunity rules once building data supports them.
  return {
    sourceType: "spell",
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    level: source.level,
    count,
    baseDamage: source.damage,
    damagePercent,
    effectivePercent,
    finalDamage: percentDamage + flatDamage,
    notes,
  };
}

export function calculateTotalDamage(
  input: DamageCalculationInput,
): DamageCalculationResult {
  const equipmentBreakdown = (input.equipmentSources ?? []).map((source) =>
    calculateEquipmentDamage({ source, target: input.target }),
  );
  const spellBreakdown = (input.spellSources ?? []).map((source) =>
    calculateEarthquakeDamage({ source, target: input.target }),
  );
  const breakdown = [...equipmentBreakdown, ...spellBreakdown];
  const directDamage = equipmentBreakdown.reduce(
    (total, item) => total + item.finalDamage,
    0,
  );
  const spellDamage = spellBreakdown.reduce(
    (total, item) => total + item.finalDamage,
    0,
  );
  const totalDamage = directDamage + spellDamage;
  const canFinish = directDamage > 0 || input.allowSpellOnlyFinish === true;
  const destroyed = canFinish && totalDamage >= input.target.hp;
  const notes: string[] = [];

  if (directDamage === 0 && spellDamage > 0 && !input.allowSpellOnlyFinish) {
    notes.push(EARTHQUAKE_CANNOT_FINISH_NOTE);
  }

  return {
    target: input.target,
    totalDamage,
    directDamage,
    spellDamage,
    buildingHp: input.target.hp,
    destroyed,
    overkillDamage: destroyed ? Math.max(0, totalDamage - input.target.hp) : 0,
    remainingHp: destroyed ? 0 : Math.max(0, input.target.hp - totalDamage),
    breakdown,
    notes,
  };
}

export function findMinimumEarthquakes(
  input: FindMinimumEarthquakesInput,
): MinimumEarthquakeResult {
  const maxEarthquakes = input.maxEarthquakes ?? DEFAULT_MAX_EARTHQUAKES;
  let lastCalculation: DamageCalculationResult | undefined;

  for (
    let earthquakeCount = 0;
    earthquakeCount <= maxEarthquakes;
    earthquakeCount += 1
  ) {
    const spellSources =
      earthquakeCount > 0
        ? [{ ...input.earthquakeSource, count: earthquakeCount }]
        : [];
    const calculation = calculateTotalDamage({
      target: input.target,
      equipmentSources: input.equipmentSources,
      spellSources,
    });

    lastCalculation = calculation;

    if (calculation.destroyed) {
      return {
        possible: true,
        earthquakeCount,
        maxEarthquakes,
        calculation,
      };
    }
  }

  return {
    possible: false,
    earthquakeCount: null,
    maxEarthquakes,
    calculation: lastCalculation,
    reason: `Target cannot be destroyed within ${maxEarthquakes} Earthquake spells.`,
  };
}

export function findMinimumEquipmentLevel(
  input: FindMinimumEquipmentLevelInput,
): MinimumEquipmentLevelResult {
  const sortedLevels = [...input.possibleLevels].sort(
    (first, second) => first.level - second.level,
  );
  let lastCalculation: DamageCalculationResult | undefined;

  for (const variableSource of sortedLevels) {
    const calculation = calculateTotalDamage({
      target: input.target,
      equipmentSources: [
        ...(input.fixedEquipmentSources ?? []),
        variableSource,
      ],
      spellSources: input.spellSources,
    });

    lastCalculation = calculation;

    if (calculation.destroyed) {
      return {
        possible: true,
        equipmentId: input.equipmentId,
        equipmentName: input.equipmentName,
        minimumLevel: variableSource.level,
        destroyed: true,
        totalDamage: calculation.totalDamage,
        overkillDamage: calculation.overkillDamage,
        calculation,
      };
    }
  }

  return {
    possible: false,
    equipmentId: input.equipmentId,
    equipmentName: input.equipmentName,
    minimumLevel: null,
    destroyed: false,
    totalDamage: lastCalculation?.totalDamage ?? 0,
    overkillDamage: 0,
    calculation: lastCalculation,
  };
}

export function createEquipmentDamageSource(
  equipmentId: string,
  level: number,
  targetBuildingId: string,
): EquipmentDamageSource | undefined {
  const equipment = getEquipmentById(equipmentId);
  const equipmentLevel = getEquipmentLevel(equipmentId, level);

  if (!equipment || !equipmentLevel?.damage) {
    return undefined;
  }

  return {
    sourceType: "equipment",
    sourceId: equipment.id,
    sourceName: equipment.name,
    level: equipmentLevel.level,
    damage: equipmentLevel.damage,
    specialTargetRules: getSpecialTargetRules(equipment.id, targetBuildingId),
  };
}

export function createEarthquakeDamageSource(
  spellId: string,
  level: number,
  count: number,
): SpellDamageSource | undefined {
  const spell = getSpellById(spellId);
  const spellLevel = getSpellLevel(spellId, level);

  if (!spell || (!spellLevel?.damagePercent && !spellLevel?.damage)) {
    return undefined;
  }

  return {
    sourceType: "spell",
    sourceId: spell.id,
    sourceName: spell.name,
    level: spellLevel.level,
    count: getPositiveCount(count),
    damage: spellLevel.damage,
    damagePercent: spellLevel.damagePercent,
    repeatDamageRule: spellLevel.repeatDamageRule,
  };
}

export function getTargetBuildingFromData(
  buildingId: string,
  townHallLevel: number,
  options: TargetBuildingOptions = {},
): BuildingTarget | undefined {
  const building = getBuildingById(buildingId);

  if (!building) {
    return undefined;
  }

  const levels = getBuildingLevelsByTownHall(buildingId, townHallLevel);
  const selectedLevel =
    options.buildingLevel !== undefined
      ? levels.find((level) => level.level === options.buildingLevel)
      : levels.at(-1);
  const hp = options.hp ?? selectedLevel?.hp;
  const buildingLevel = options.buildingLevel ?? selectedLevel?.level;

  if (hp === undefined || buildingLevel === undefined) {
    return undefined;
  }

  return {
    buildingId: building.id,
    buildingName: building.name,
    buildingLevel,
    townHallLevel,
    hp,
    superchargeLevel: options.superchargeLevel ?? selectedLevel?.superchargeLevel,
  };
}
