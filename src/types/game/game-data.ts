export type Village = "home" | "builder";

export type PatchVerificationStatus = "verified" | "partial" | "needs-review";
export type DataVerificationStatus = PatchVerificationStatus;
export type DataSourceType = "official" | "manual-seed" | "third-party";

export type PatchChangedItem = {
  type: "building" | "equipment" | "spell" | "other";
  itemId: string;
  itemName: string;
  summary: string;
};

export type PatchInfo = {
  id: string;
  name: string;
  releaseDate?: string;
  sourceUrl?: string;
  sourceUrls?: readonly string[];
  notes: string;
  isCurrent: boolean;
  changedItems?: readonly PatchChangedItem[];
  verifiedAt?: string;
  verificationStatus: PatchVerificationStatus;
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
  patchId?: string;
  sourceUrl?: string;
  isSupercharged?: boolean;
  superchargeLevel?: number;
};

export type BuildingDefinition = {
  id: string;
  dataId?: number;
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
  damagePerSecond?: number;
  regeneration?: number;
  healing?: number;
  hpIncrease?: number;
  abilityDescription?: string;
  specialRules?: readonly string[];
  targetMultipliers?: readonly EquipmentTargetMultiplier[];
  patchId?: string;
  sourceUrl?: string;
  sourceType?: DataSourceType;
  verificationStatus?: DataVerificationStatus;
  notes?: string;
};

export type EquipmentTargetMultiplier = {
  targetBuildingId: string;
  multiplier: number;
  description: string;
};

export type EquipmentDefinition = {
  id: string;
  dataId?: number;
  name: string;
  hero: HeroId;
  rarity: EquipmentRarity;
  category: EquipmentCategory;
  patchId?: string;
  sourceUrls?: readonly string[];
  verificationStatus?: DataVerificationStatus;
  notes?: string;
  calculatorEnabled?: boolean;
  defaultLevel?: number;
  levels: readonly EquipmentLevel[];
};

export type SpellType = "elixir" | "dark" | "event";
export type SpellRepeatDamageRule = "diminishing-odd-denominator";

export type SpellLevel = {
  level: number;
  damage?: number;
  damagePercent?: number;
  repeatDamageRule?: SpellRepeatDamageRule;
  patchId?: string;
  sourceUrl?: string;
  sourceType?: DataSourceType;
  verificationStatus?: DataVerificationStatus;
  notes?: string;
};

export type SpellDefinition = {
  id: string;
  dataId?: number;
  name: string;
  village: Village;
  spellType: SpellType;
  housingSpace?: number;
  patchId?: string;
  sourceUrls?: readonly string[];
  verificationStatus?: DataVerificationStatus;
  notes?: string;
  calculatorEnabled?: boolean;
  defaultLevel?: number;
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

export type GameDataSourceKind = "database" | "static-fallback";

export type GameDataCatalog = {
  patches: readonly PatchInfo[];
  buildings: readonly BuildingDefinition[];
  equipment: readonly EquipmentDefinition[];
  spells: readonly SpellDefinition[];
  objectIdMap: ObjectIdMap;
  currentPatchId?: string;
};

export type GameDataBundle = GameDataCatalog & {
  source: GameDataSourceKind;
  databaseConfigured: boolean;
  databaseReachable: boolean | null;
  seeded: boolean;
  databaseEmpty: boolean;
  checkedAt: string;
  fallbackReason?: string;
};
