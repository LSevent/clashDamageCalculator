import type { AdminVerificationStatus } from "./admin";

export const statChangeTargetKinds = [
  "building-level",
  "equipment-level",
  "spell-level",
  "patch-note-hint",
] as const;

export type StatChangeTargetKind = (typeof statChangeTargetKinds)[number];

export const statChangeFieldNames = [
  "hp",
  "damage",
  "damagePercent",
  "healing",
  "hpIncrease",
  "repeatDamageRule",
  "specialRules",
  "abilityDescription",
  "notes",
] as const;

export type StatChangeFieldName = (typeof statChangeFieldNames)[number];

export const statChangeConfidences = [
  "high",
  "medium",
  "low",
  "hint",
] as const;

export type StatChangeConfidence = (typeof statChangeConfidences)[number];

export const statChangeStatuses = [
  "pending-review",
  "approved",
  "rejected",
  "needs-info",
  "applied",
] as const;

export type StatChangeStatus = (typeof statChangeStatuses)[number];

export const regenerateModes = ["append-new", "replace-pending"] as const;
export type StatChangeRegenerateMode = (typeof regenerateModes)[number];

export type ParsedStatChangeCandidate = {
  targetName: string;
  targetKind?: Exclude<StatChangeTargetKind, "patch-note-hint">;
  level: number;
  townHallLevel?: number;
  isSupercharged?: boolean;
  superchargeLevel?: number;
  fieldName: StatChangeFieldName;
  suggestedValue: unknown;
  sourceExcerpt: string;
};

export type StatChangeValidationInput = {
  targetKind: StatChangeTargetKind;
  targetId?: string;
  targetName?: string;
  level?: number;
  townHallLevel?: number;
  isSupercharged?: boolean;
  superchargeLevel?: number;
  fieldName?: StatChangeFieldName;
  finalValue?: unknown;
  verificationStatus?: AdminVerificationStatus;
  notes?: string;
};

export type StatChangeValidationResult =
  | {
      success: true;
      data: StatChangeValidationInput;
    }
  | {
      success: false;
      errors: readonly string[];
    };

export type StatChangeSuggestionView = {
  id: string;
  patchId: string;
  patchName: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceExcerpt: string | null;
  targetKind: StatChangeTargetKind;
  targetId: string | null;
  targetName: string | null;
  level: number | null;
  townHallLevel: number | null;
  isSupercharged: boolean | null;
  superchargeLevel: number | null;
  fieldName: StatChangeFieldName | null;
  oldValue: unknown;
  suggestedValue: unknown;
  finalValue: unknown;
  confidence: StatChangeConfidence;
  status: StatChangeStatus;
  verificationStatus: AdminVerificationStatus | null;
  notes: string | null;
  parserNotes: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  createdAt: string;
};

export type StatChangePatchView = {
  id: string;
  name: string;
  releaseDate: string | null;
  sourceUrl: string | null;
  notes: string | null;
  verificationStatus: string;
  detectedType: string | null;
};

export type StatChangeSummary = {
  pendingReview: number;
  approved: number;
  rejected: number;
  needsInfo: number;
  applied: number;
  hints: number;
  exact: number;
};

export type StatChangeDashboardData = {
  patch?: StatChangePatchView;
  suggestions: readonly StatChangeSuggestionView[];
  summary: StatChangeSummary;
};

export type StatChangeDashboardResult =
  | { available: true; data: StatChangeDashboardData }
  | { available: false; message: string };

export type StatChangeGenerationSummary = {
  created: number;
  hintsCreated: number;
  duplicatesSkipped: number;
  warnings: readonly string[];
};
