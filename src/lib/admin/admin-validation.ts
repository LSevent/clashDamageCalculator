import {
  adminVerificationStatuses,
  type AdminVerificationStatus,
  type BuildingAdminInput,
  type BuildingLevelAdminInput,
  type EquipmentAdminInput,
  type EquipmentLevelAdminInput,
  type PatchAdminInput,
  type SpellAdminInput,
  type SpellLevelAdminInput,
  type ValidationResult,
} from "@/src/types/admin";

type InputRecord = Record<string, unknown>;

const buildingCategories = [
  "defense",
  "resource",
  "army",
  "trap",
  "hero",
  "other",
] as const;
const targetTypes = ["ground", "air", "ground-and-air", "none"] as const;
const villages = ["home", "builder"] as const;
const sourceTypes = ["official", "manual-seed", "third-party"] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || undefined;
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function optionalInteger(value: unknown) {
  const valueText = text(value);

  if (!valueText) {
    return undefined;
  }

  const number = Number(valueText);
  return Number.isInteger(number) ? number : Number.NaN;
}

function optionalNumber(value: unknown) {
  const valueText = text(value);

  if (!valueText) {
    return undefined;
  }

  const number = Number(valueText);
  return Number.isFinite(number) ? number : Number.NaN;
}

function isOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
): value is T {
  return allowed.includes(value as T);
}

function verificationStatus(
  value: unknown,
  errors: string[],
): AdminVerificationStatus {
  const status = text(value);

  if (!isOneOf(status, adminVerificationStatuses)) {
    errors.push("Verification status must be valid.");
    return "needs-review";
  }

  return status;
}

function validateOptionalDate(
  value: unknown,
  label: string,
  errors: string[],
) {
  const date = optionalText(value);

  if (date && Number.isNaN(Date.parse(date))) {
    errors.push(`${label} must be a valid date.`);
  }

  return date;
}

export function validateSourceUrl(value: unknown): string | undefined {
  const url = optionalText(value);

  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

function optionalSourceUrl(
  value: unknown,
  errors: string[],
): string | undefined {
  const raw = optionalText(value);

  if (!raw) {
    return undefined;
  }

  const url = validateSourceUrl(raw);

  if (!url) {
    errors.push("Invalid source URL.");
  }

  return url;
}

function sourceUrlList(value: unknown, errors: string[]) {
  const urls = text(value)
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);

  for (const url of urls) {
    if (!validateSourceUrl(url)) {
      errors.push(`Invalid source URL: ${url}`);
    }
  }

  return [...new Set(urls)];
}

function requiredId(value: unknown, label: string, errors: string[]) {
  const id = text(value);

  if (!id) {
    errors.push(`${label} is required.`);
  }

  return id;
}

function nonNegativeInteger(
  value: unknown,
  label: string,
  errors: string[],
) {
  const number = optionalInteger(value);

  if (
    number !== undefined &&
    (!Number.isInteger(number) || number < 0)
  ) {
    errors.push(`${label} must be a non-negative integer.`);
  }

  return number;
}

function positiveInteger(value: unknown, label: string, errors: string[]) {
  const number = optionalInteger(value);

  if (
    number === undefined ||
    !Number.isInteger(number) ||
    number <= 0
  ) {
    errors.push(`${label} must be a positive integer.`);
    return 1;
  }

  return number;
}

export function parseSpecialRulesJson(
  value: unknown,
): ValidationResult<unknown | undefined> {
  const json = optionalText(value);

  if (!json) {
    return { success: true, data: undefined };
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    return {
      success: true,
      data: parsed === null ? undefined : parsed,
    };
  } catch {
    return {
      success: false,
      errors: ["Special rules must contain valid JSON."],
    };
  }
}

export function validatePatchInput(
  input: InputRecord,
): ValidationResult<PatchAdminInput> {
  const errors: string[] = [];
  const id = requiredId(input.id, "Patch ID", errors);
  const name = text(input.name);

  if (!name) {
    errors.push("Patch name is required.");
  }

  const data: PatchAdminInput = {
    id,
    name,
    releaseDate: validateOptionalDate(
      input.releaseDate,
      "Release date",
      errors,
    ),
    sourceUrl: optionalSourceUrl(input.sourceUrl, errors),
    notes: optionalText(input.notes),
    isCurrent: booleanValue(input.isCurrent),
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    verifiedAt: validateOptionalDate(
      input.verifiedAt,
      "Verified date",
      errors,
    ),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateBuildingInput(
  input: InputRecord,
): ValidationResult<BuildingAdminInput> {
  const errors: string[] = [];
  const village = text(input.village);
  const category = text(input.category);
  const targetType = text(input.targetType);
  const name = text(input.name);

  if (!name) {
    errors.push("Building name is required.");
  }
  if (!isOneOf(village, villages)) {
    errors.push("Village must be valid.");
  }
  if (!isOneOf(category, buildingCategories)) {
    errors.push("Building category must be valid.");
  }
  if (!isOneOf(targetType, targetTypes)) {
    errors.push("Target type must be valid.");
  }

  const data: BuildingAdminInput = {
    id: requiredId(input.id, "Building ID", errors),
    dataId: nonNegativeInteger(input.dataId, "Data ID", errors),
    name,
    village: isOneOf(village, villages) ? village : "home",
    category: isOneOf(category, buildingCategories) ? category : "other",
    targetType: isOneOf(targetType, targetTypes) ? targetType : "none",
    canBeSupercharged: booleanValue(input.canBeSupercharged),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateBuildingLevelInput(
  input: InputRecord,
): ValidationResult<BuildingLevelAdminInput> {
  const errors: string[] = [];
  const townHallLevel = positiveInteger(
    input.townHallLevel,
    "Town Hall level",
    errors,
  );
  const hp = nonNegativeInteger(input.hp, "HP", errors);
  const isSupercharged = booleanValue(input.isSupercharged);
  const superchargeLevel = optionalInteger(input.superchargeLevel);

  if (townHallLevel > 18) {
    errors.push("Town Hall level must be between 1 and 18.");
  }
  if (hp !== undefined && hp <= 0) {
    errors.push("HP must be a positive integer when provided.");
  }
  if (
    isSupercharged &&
    (superchargeLevel === undefined ||
      !Number.isInteger(superchargeLevel) ||
      superchargeLevel <= 0)
  ) {
    errors.push(
      "Supercharge level is required when the row is supercharged.",
    );
  }

  const data: BuildingLevelAdminInput = {
    buildingId: requiredId(input.buildingId, "Building ID", errors),
    level: positiveInteger(input.level, "Building level", errors),
    townHallLevel,
    hp,
    patchId: optionalText(input.patchId),
    sourceUrl: optionalSourceUrl(input.sourceUrl, errors),
    isSupercharged,
    superchargeLevel: isSupercharged ? superchargeLevel : undefined,
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    notes: optionalText(input.notes),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateEquipmentInput(
  input: InputRecord,
): ValidationResult<EquipmentAdminInput> {
  const errors: string[] = [];
  const name = text(input.name);
  const hero = text(input.hero);
  const rarity = text(input.rarity);
  const category = optionalText(input.category);

  if (!name) {
    errors.push("Equipment name is required.");
  }
  if (!hero) {
    errors.push("Hero is required.");
  }
  if (rarity !== "common" && rarity !== "epic") {
    errors.push("Equipment rarity must be common or epic.");
  }
  if (category && category !== "active" && category !== "passive") {
    errors.push("Equipment category must be active or passive.");
  }

  const data: EquipmentAdminInput = {
    id: requiredId(input.id, "Equipment ID", errors),
    dataId: nonNegativeInteger(input.dataId, "Data ID", errors),
    name,
    hero,
    rarity: rarity === "epic" ? "epic" : "common",
    category:
      category === "active" || category === "passive" ? category : undefined,
    patchId: optionalText(input.patchId),
    sourceUrls: sourceUrlList(input.sourceUrls, errors),
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    notes: optionalText(input.notes),
    calculatorEnabled: booleanValue(input.calculatorEnabled),
    defaultLevel: nonNegativeInteger(
      input.defaultLevel,
      "Default level",
      errors,
    ),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateEquipmentLevelInput(
  input: InputRecord,
): ValidationResult<EquipmentLevelAdminInput> {
  const errors: string[] = [];
  const rules = parseSpecialRulesJson(input.specialRules);
  const sourceType = optionalText(input.sourceType);
  const validSourceType =
    sourceType && isOneOf(sourceType, sourceTypes) ? sourceType : undefined;

  if (!rules.success) {
    errors.push(...rules.errors);
  }
  if (sourceType && !isOneOf(sourceType, sourceTypes)) {
    errors.push("Source type must be valid.");
  }

  const data: EquipmentLevelAdminInput = {
    equipmentId: requiredId(input.equipmentId, "Equipment ID", errors),
    level: positiveInteger(input.level, "Equipment level", errors),
    damage: nonNegativeInteger(input.damage, "Damage", errors),
    damagePerSecond: nonNegativeInteger(
      input.damagePerSecond,
      "Damage per second",
      errors,
    ),
    regeneration: nonNegativeInteger(
      input.regeneration,
      "Regeneration",
      errors,
    ),
    healing: nonNegativeInteger(input.healing, "Healing", errors),
    hpIncrease: nonNegativeInteger(input.hpIncrease, "HP increase", errors),
    abilityDescription: optionalText(input.abilityDescription),
    specialRules: rules.success ? rules.data : undefined,
    patchId: optionalText(input.patchId),
    sourceUrl: optionalSourceUrl(input.sourceUrl, errors),
    sourceType: validSourceType,
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    notes: optionalText(input.notes),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateSpellInput(
  input: InputRecord,
): ValidationResult<SpellAdminInput> {
  const errors: string[] = [];
  const name = text(input.name);
  const village = text(input.village);
  const spellType = text(input.spellType);

  if (!name) {
    errors.push("Spell name is required.");
  }
  if (!isOneOf(village, villages)) {
    errors.push("Village must be valid.");
  }
  if (!isOneOf(spellType, ["elixir", "dark", "event"] as const)) {
    errors.push("Spell type must be valid.");
  }

  const data: SpellAdminInput = {
    id: requiredId(input.id, "Spell ID", errors),
    dataId: nonNegativeInteger(input.dataId, "Data ID", errors),
    name,
    village: isOneOf(village, villages) ? village : "home",
    spellType:
      spellType === "dark" || spellType === "event" ? spellType : "elixir",
    housingSpace: nonNegativeInteger(
      input.housingSpace,
      "Housing space",
      errors,
    ),
    patchId: optionalText(input.patchId),
    sourceUrls: sourceUrlList(input.sourceUrls, errors),
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    notes: optionalText(input.notes),
    calculatorEnabled: booleanValue(input.calculatorEnabled),
    defaultLevel: nonNegativeInteger(
      input.defaultLevel,
      "Default level",
      errors,
    ),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateSpellLevelInput(
  input: InputRecord,
): ValidationResult<SpellLevelAdminInput> {
  const errors: string[] = [];
  const damagePercent = optionalNumber(input.damagePercent);
  const repeatDamageRule = optionalText(input.repeatDamageRule);
  const sourceType = optionalText(input.sourceType);
  const validSourceType =
    sourceType && isOneOf(sourceType, sourceTypes) ? sourceType : undefined;

  if (
    damagePercent !== undefined &&
    (!Number.isFinite(damagePercent) ||
      damagePercent < 0 ||
      damagePercent > 1)
  ) {
    errors.push("Damage percent must be between 0 and 1.");
  }
  if (
    repeatDamageRule &&
    repeatDamageRule !== "diminishing-odd-denominator"
  ) {
    errors.push("Repeat damage rule must use a known value.");
  }
  if (sourceType && !isOneOf(sourceType, sourceTypes)) {
    errors.push("Source type must be valid.");
  }

  const data: SpellLevelAdminInput = {
    spellId: requiredId(input.spellId, "Spell ID", errors),
    level: positiveInteger(input.level, "Spell level", errors),
    damage: nonNegativeInteger(input.damage, "Damage", errors),
    damagePercent,
    repeatDamageRule:
      repeatDamageRule === "diminishing-odd-denominator"
        ? repeatDamageRule
        : undefined,
    patchId: optionalText(input.patchId),
    sourceUrl: optionalSourceUrl(input.sourceUrl, errors),
    sourceType: validSourceType,
    verificationStatus: verificationStatus(
      input.verificationStatus,
      errors,
    ),
    notes: optionalText(input.notes),
  };

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}
