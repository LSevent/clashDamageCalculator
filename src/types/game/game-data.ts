export type Village = "home" | "builder";

export type PatchInfo = {
  id: string;
  name: string;
  releaseDate: string;
  sourceUrl: string;
  notes: string;
  isCurrent: boolean;
};

export type BuildingCategory =
  | "defense"
  | "resource"
  | "army"
  | "trap"
  | "hero"
  | "other";

export type TargetType = "ground" | "air" | "ground-and-air" | "none";

export type BuildingLevel = {
  level: number;
  townHallLevel: number;
  hp: number;
  patchId: string;
  sourceUrl?: string;
  isSupercharged?: boolean;
  superchargeLevel?: number;
};

export type BuildingDefinition = {
  id: string;
  name: string;
  village: Village;
  category: BuildingCategory;
  targetType: TargetType;
  canBeSupercharged: boolean;
  levels: readonly BuildingLevel[];
};

export type HeroId =
  | "barbarian-king"
  | "archer-queen"
  | "minion-prince"
  | "grand-warden"
  | "royal-champion"
  | "dragon-duke";

export type EquipmentRarity = "common" | "epic";
export type EquipmentCategory = "active" | "passive";

export type EquipmentLevel = {
  level: number;
  damage?: number;
  healing?: number;
  hpIncrease?: number;
  abilityDescription?: string;
  specialRules?: readonly string[];
  patchId: string;
  sourceUrl?: string;
};

export type EquipmentDefinition = {
  id: string;
  dataId?: number;
  name: string;
  hero: HeroId;
  rarity: EquipmentRarity;
  category: EquipmentCategory;
  levels: readonly EquipmentLevel[];
};

export type SpellType = "elixir" | "dark" | "event";
export type SpellRepeatDamageRule = "diminishing-odd-denominator";

export type SpellLevel = {
  level: number;
  damage?: number;
  damagePercent?: number;
  repeatDamageRule?: SpellRepeatDamageRule;
  patchId: string;
  sourceUrl?: string;
};

export type SpellDefinition = {
  id: string;
  dataId?: number;
  name: string;
  village: Village;
  spellType: SpellType;
  housingSpace: number;
  levels: readonly SpellLevel[];
};

export type ObjectIdMap = {
  buildings: Readonly<Record<number, string>>;
  spells: Readonly<Record<number, string>>;
  equipment: Readonly<Record<number, string>>;
  heroes: Readonly<Record<number, string>>;
  pets: Readonly<Record<number, string>>;
  units: Readonly<Record<number, string>>;
  traps: Readonly<Record<number, string>>;
};

