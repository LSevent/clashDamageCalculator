import type { AdminVerificationStatus } from "./admin";

export const bulkImportTypes = [
  "building-levels",
  "equipment-levels",
  "spell-levels",
] as const;

export type BulkImportType = (typeof bulkImportTypes)[number];

export type CsvRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type CsvParseResult = {
  headers: readonly string[];
  rows: readonly CsvRow[];
  errors: readonly string[];
};

export type BuildingLevelBulkRow = {
  kind: "building-levels";
  buildingId: string;
  buildingName?: string;
  townHallLevel: number;
  level: number;
  hp: number;
  isSupercharged: boolean;
  superchargeLevel?: number;
  patchId?: string;
  sourceUrl?: string;
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type EquipmentLevelBulkRow = {
  kind: "equipment-levels";
  equipmentId: string;
  equipmentName?: string;
  level: number;
  damage?: number;
  healing?: number;
  hpIncrease?: number;
  abilityDescription?: string;
  specialRules?: unknown;
  patchId?: string;
  sourceUrl?: string;
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type SpellLevelBulkRow = {
  kind: "spell-levels";
  spellId: string;
  spellName?: string;
  level: number;
  damage?: number;
  damagePercent?: number;
  repeatDamageRule?: "diminishing-odd-denominator";
  patchId?: string;
  sourceUrl?: string;
  verificationStatus: AdminVerificationStatus;
  notes?: string;
};

export type BulkImportRow =
  | BuildingLevelBulkRow
  | EquipmentLevelBulkRow
  | SpellLevelBulkRow;

export type ExistingBuildingLevelRow = Omit<
  BuildingLevelBulkRow,
  "kind" | "buildingName"
>;
export type ExistingEquipmentLevelRow = Omit<
  EquipmentLevelBulkRow,
  "kind" | "equipmentName"
>;
export type ExistingSpellLevelRow = Omit<
  SpellLevelBulkRow,
  "kind" | "spellName"
>;

export type BulkImportContext = {
  buildingIds: ReadonlySet<string>;
  equipmentIds: ReadonlySet<string>;
  spellIds: ReadonlySet<string>;
  patchIds: ReadonlySet<string>;
  buildingLevels: readonly ExistingBuildingLevelRow[];
  equipmentLevels: readonly ExistingEquipmentLevelRow[];
  spellLevels: readonly ExistingSpellLevelRow[];
};

export type BulkImportAction =
  | "create"
  | "update"
  | "unchanged"
  | "invalid"
  | "skipped";

export type BulkImportPreviewRow = {
  rowNumber: number;
  action: BulkImportAction;
  itemId: string;
  itemName?: string;
  level?: number;
  oldValue?: string;
  newValue?: string;
  message?: string;
  sourceUrl?: string;
  verificationStatus?: AdminVerificationStatus;
  data?: BulkImportRow;
};

export type BulkImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newRows: number;
  updateRows: number;
  unchangedRows: number;
  skippedRows: number;
};

export type BulkImportPreview = {
  type: BulkImportType;
  headers: readonly string[];
  parseErrors: readonly string[];
  rows: readonly BulkImportPreviewRow[];
  summary: BulkImportSummary;
};

export type BulkImportActionState = {
  ok: boolean;
  error?: string;
  preview?: BulkImportPreview;
  result?: {
    created: number;
    updated: number;
    unchanged: number;
    invalid: number;
    skipped: number;
  };
};
