import type {
  BuildingDefinition,
  DataVerificationStatus,
  EquipmentDefinition,
  PatchInfo,
  SpellDefinition,
} from "@/src/types/game/game-data";

export type DataAuditInput = {
  patches: readonly PatchInfo[];
  buildings: readonly BuildingDefinition[];
  equipment: readonly EquipmentDefinition[];
  spells: readonly SpellDefinition[];
  currentPatchId?: string;
};

export type DataCoverage = {
  withSourceUrl: number;
  missingSourceUrl: number;
  withPatchId: number;
  missingPatchId: number;
};

export type DataAuditSummary = {
  totalPatches: number;
  currentPatch?: PatchInfo;
  totalBuildings: number;
  totalBuildingLevels: number;
  totalEquipment: number;
  totalEquipmentLevels: number;
  totalSpells: number;
  totalSpellLevels: number;
  totalLevelEntries: number;
  coverage: DataCoverage;
  partialDataItems: number;
  needsReviewDataItems: number;
};

export type StaticDataRow = {
  id: string;
  name: string;
  levelCount: number;
  latestPatchId?: string;
  missingSourceCount: number;
  isPartial: boolean;
  verificationStatus: DataVerificationStatus;
  sourceUrls: readonly string[];
  notes?: string;
};
