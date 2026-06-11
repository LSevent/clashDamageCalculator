export const adminVerificationStatuses = [
  "draft",
  "pending-review",
  "partial",
  "verified",
  "needs-review",
  "rejected",
] as const;

export type AdminVerificationStatus =
  (typeof adminVerificationStatuses)[number];

export type AdminAuthState = {
  configured: boolean;
  authenticated: boolean;
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: readonly string[] };

export type PatchAdminInput = {
  id: string;
  name: string;
  releaseDate?: string;
  sourceUrl?: string;
  notes?: string;
  isCurrent: boolean;
  verificationStatus: AdminVerificationStatus;
  verifiedAt?: string;
};

export type BuildingAdminInput = {
  id: string;
  dataId?: number;
  name: string;
  village: "home" | "builder";
  category: "defense" | "resource" | "army" | "trap" | "hero" | "other";
  targetType: "ground" | "air" | "ground-and-air" | "none";
  canBeSupercharged: boolean;
};

export type BuildingLevelAdminInput = {
  buildingId: string;
  level: number;
  townHallLevel: number;
  hp?: number;
  patchId?: string;
  sourceUrl?: string;
  isSupercharged: boolean;
  superchargeLevel?: number;
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type EquipmentAdminInput = {
  id: string;
  dataId?: number;
  name: string;
  hero: string;
  rarity: "common" | "epic";
  category?: "active" | "passive";
  patchId?: string;
  sourceUrls: readonly string[];
  verificationStatus: AdminVerificationStatus;
  notes?: string;
  calculatorEnabled: boolean;
  defaultLevel?: number;
};

export type EquipmentLevelAdminInput = {
  equipmentId: string;
  level: number;
  damage?: number;
  damagePerSecond?: number;
  regeneration?: number;
  healing?: number;
  hpIncrease?: number;
  abilityDescription?: string;
  specialRules?: unknown;
  patchId?: string;
  sourceUrl?: string;
  sourceType?: "official" | "manual-seed" | "third-party";
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type SpellAdminInput = {
  id: string;
  dataId?: number;
  name: string;
  village: "home" | "builder";
  spellType: "elixir" | "dark" | "event";
  housingSpace?: number;
  patchId?: string;
  sourceUrls: readonly string[];
  verificationStatus: AdminVerificationStatus;
  notes?: string;
  calculatorEnabled: boolean;
  defaultLevel?: number;
};

export type SpellLevelAdminInput = {
  spellId: string;
  level: number;
  damage?: number;
  damagePercent?: number;
  repeatDamageRule?: "diminishing-odd-denominator";
  patchId?: string;
  sourceUrl?: string;
  sourceType?: "official" | "manual-seed" | "third-party";
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type AdminDataSummary = {
  patches: number;
  buildings: number;
  buildingLevels: number;
  equipment: number;
  equipmentLevels: number;
  spells: number;
  spellLevels: number;
  partialOrNeedsReview: number;
  missingSourceUrls: number;
};
