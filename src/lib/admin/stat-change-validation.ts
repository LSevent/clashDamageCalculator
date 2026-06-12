import { adminVerificationStatuses } from "@/src/types/admin";
import {
  statChangeFieldNames,
  statChangeTargetKinds,
  type StatChangeFieldName,
  type StatChangeStatus,
  type StatChangeValidationInput,
  type StatChangeValidationResult,
} from "@/src/types/admin-stat-change";

const exactKinds = new Set([
  "building-level",
  "equipment-level",
  "spell-level",
]);

const allowedFields: Record<
  Exclude<StatChangeValidationInput["targetKind"], "patch-note-hint">,
  readonly StatChangeFieldName[]
> = {
  "building-level": ["hp", "notes"],
  "equipment-level": [
    "damage",
    "healing",
    "hpIncrease",
    "specialRules",
    "abilityDescription",
    "notes",
  ],
  "spell-level": [
    "damage",
    "damagePercent",
    "repeatDamageRule",
    "notes",
  ],
};

export function parseFinalValueInput(
  fieldName: StatChangeFieldName | undefined,
  value: string,
) {
  const trimmed = value.trim();

  if (!fieldName || !trimmed) {
    return undefined;
  }
  if (fieldName === "specialRules") {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return Symbol.for("invalid-json");
    }
  }
  if (
    fieldName === "repeatDamageRule" ||
    fieldName === "abilityDescription" ||
    fieldName === "notes"
  ) {
    return trimmed;
  }

  const number = Number(trimmed);
  return Number.isFinite(number) ? number : Number.NaN;
}

function validateFinalValue(
  fieldName: StatChangeFieldName,
  value: unknown,
  errors: string[],
) {
  if (fieldName === "specialRules") {
    if (
      value === Symbol.for("invalid-json") ||
      typeof value !== "object" ||
      value === null
    ) {
      errors.push("Special rules must contain valid JSON.");
    }
    return;
  }

  if (
    fieldName === "repeatDamageRule" ||
    fieldName === "abilityDescription" ||
    fieldName === "notes"
  ) {
    if (typeof value !== "string" || !value.trim()) {
      errors.push("Final value is required.");
    } else if (
      fieldName === "repeatDamageRule" &&
      value !== "diminishing-odd-denominator"
    ) {
      errors.push("Repeat damage rule must use a known value.");
    }
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push("Final value must be a number.");
    return;
  }

  if (fieldName === "damagePercent") {
    if (value < 0 || value > 1) {
      errors.push("Damage percent must be between 0 and 1.");
    }
    return;
  }

  if (!Number.isInteger(value)) {
    errors.push("Final value must be an integer.");
  } else if (fieldName === "hp" ? value <= 0 : value < 0) {
    errors.push(
      fieldName === "hp"
        ? "HP must be a positive integer."
        : "Final value must be a non-negative integer.",
    );
  }
}

export function validateStatChangeSuggestion(
  input: StatChangeValidationInput,
): StatChangeValidationResult {
  const errors: string[] = [];

  if (!statChangeTargetKinds.includes(input.targetKind)) {
    errors.push("Target kind is required.");
  }

  if (input.targetKind === "patch-note-hint") {
    return errors.length > 0
      ? { success: false, errors }
      : { success: true, data: input };
  }

  if (!exactKinds.has(input.targetKind)) {
    errors.push("Target kind must be valid.");
  }
  if (!input.targetId?.trim()) {
    errors.push("Target ID is required for exact stat changes.");
  }
  if (!input.level || !Number.isInteger(input.level) || input.level <= 0) {
    errors.push("Level must be a positive integer.");
  }
  if (!input.fieldName || !statChangeFieldNames.includes(input.fieldName)) {
    errors.push("Field is required for exact stat changes.");
  } else {
    const fields = allowedFields[
      input.targetKind as keyof typeof allowedFields
    ];
    if (!fields?.includes(input.fieldName)) {
      errors.push("Field is not supported for this target kind.");
    }
    validateFinalValue(input.fieldName, input.finalValue, errors);
  }
  if (
    input.targetKind === "building-level" &&
    (!input.townHallLevel ||
      !Number.isInteger(input.townHallLevel) ||
      input.townHallLevel <= 0)
  ) {
    errors.push("Town Hall level is required for building changes.");
  }
  if (
    input.isSupercharged &&
    (!input.superchargeLevel ||
      !Number.isInteger(input.superchargeLevel) ||
      input.superchargeLevel <= 0)
  ) {
    errors.push(
      "Supercharge level is required for supercharged building changes.",
    );
  }
  if (
    input.verificationStatus &&
    !adminVerificationStatuses.includes(input.verificationStatus)
  ) {
    errors.push("Verification status must be valid.");
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data: input };
}

export function canTransitionStatChangeStatus(
  from: StatChangeStatus,
  to: StatChangeStatus,
) {
  if (from === "applied") {
    return false;
  }

  const transitions: Record<StatChangeStatus, readonly StatChangeStatus[]> = {
    "pending-review": ["approved", "rejected", "needs-info"],
    "needs-info": ["pending-review", "rejected"],
    approved: ["rejected", "applied"],
    rejected: [],
    applied: [],
  };

  return transitions[from].includes(to);
}

export function canApplyStatChange(
  status: StatChangeStatus,
  targetKind: string,
) {
  return status === "approved" && targetKind !== "patch-note-hint";
}
