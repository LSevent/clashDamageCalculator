import type { SpellRepeatDamageRule } from "@/src/types/game/game-data";

export type DamageSourceType = "equipment" | "spell";

export type SpecialTargetRule = {
  targetBuildingId: string;
  multiplier: number;
  note: string;
};

export type DamageSource = {
  sourceType: DamageSourceType;
  sourceId: string;
  sourceName: string;
  level: number;
};

export type EquipmentDamageSource = DamageSource & {
  sourceType: "equipment";
  damage: number;
  specialTargetRules?: readonly SpecialTargetRule[];
};

export type SpellDamageSource = DamageSource & {
  sourceType: "spell";
  count: number;
  damage?: number;
  damagePercent?: number;
  repeatDamageRule?: SpellRepeatDamageRule;
};

export type BuildingTarget = {
  buildingId: string;
  buildingName: string;
  buildingLevel: number;
  townHallLevel: number;
  hp: number;
  superchargeLevel?: number;
};

export type DamageCalculationInput = {
  target: BuildingTarget;
  equipmentSources?: readonly EquipmentDamageSource[];
  spellSources?: readonly SpellDamageSource[];
  allowSpellOnlyFinish?: boolean;
};

export type DamageBreakdownItem = {
  sourceType: DamageSourceType;
  sourceId: string;
  sourceName: string;
  level: number;
  count?: number;
  baseDamage?: number;
  damagePercent?: number;
  effectivePercent?: number;
  finalDamage: number;
  notes: readonly string[];
};

export type DamageCalculationResult = {
  target: BuildingTarget;
  totalDamage: number;
  directDamage: number;
  spellDamage: number;
  buildingHp: number;
  destroyed: boolean;
  overkillDamage: number;
  remainingHp: number;
  breakdown: readonly DamageBreakdownItem[];
  notes: readonly string[];
};

export type CalculateEquipmentDamageParams = {
  source: EquipmentDamageSource;
  target: BuildingTarget;
};

export type CalculateEarthquakeDamageParams = {
  source: SpellDamageSource;
  target: BuildingTarget;
};

export type FindMinimumEarthquakesInput = {
  target: BuildingTarget;
  equipmentSources?: readonly EquipmentDamageSource[];
  earthquakeSource: SpellDamageSource;
  maxEarthquakes?: number;
};

export type MinimumEarthquakeResult =
  | {
      possible: true;
      earthquakeCount: number;
      maxEarthquakes: number;
      calculation: DamageCalculationResult;
    }
  | {
      possible: false;
      earthquakeCount: null;
      maxEarthquakes: number;
      calculation?: DamageCalculationResult;
      reason: string;
    };

export type FindMinimumEquipmentLevelInput = {
  target: BuildingTarget;
  fixedEquipmentSources?: readonly EquipmentDamageSource[];
  spellSources?: readonly SpellDamageSource[];
  equipmentId: string;
  equipmentName: string;
  possibleLevels: readonly EquipmentDamageSource[];
};

export type MinimumEquipmentLevelResult =
  | {
      possible: true;
      equipmentId: string;
      equipmentName: string;
      minimumLevel: number;
      destroyed: true;
      totalDamage: number;
      overkillDamage: number;
      calculation: DamageCalculationResult;
    }
  | {
      possible: false;
      equipmentId: string;
      equipmentName: string;
      minimumLevel: null;
      destroyed: false;
      totalDamage: number;
      overkillDamage: 0;
      calculation?: DamageCalculationResult;
    };

export type TargetBuildingOptions = {
  buildingLevel?: number;
  hp?: number;
  superchargeLevel?: number;
};

