import { equipment, spells } from "@/src/data/game";
import type {
  UserProgress,
  UserProgressValidationErrors,
  UserProgressValidationResult,
} from "@/src/types/game/user-progress";

export const USER_PROGRESS_STORAGE_KEY =
  "clash-damage-calculator:user-progress:v1";
export const USER_PROGRESS_CHANGED_EVENT =
  "clash-damage-calculator:user-progress-changed";

export const MIN_TOWN_HALL_LEVEL = 1;
export const MAX_TOWN_HALL_LEVEL = 18;

function getLatestKnownLevel(
  definitions: readonly {
    id: string;
    levels: readonly { level: number }[];
  }[],
) {
  return Object.fromEntries(
    definitions.flatMap((definition) => {
      const latestLevel = definition.levels.reduce<number | undefined>(
        (highestLevel, level) =>
          highestLevel === undefined || level.level > highestLevel
            ? level.level
            : highestLevel,
        undefined,
      );
      return latestLevel === undefined ? [] : [[definition.id, latestLevel]];
    }),
  );
}

export function getDefaultUserProgress(): UserProgress {
  return {
    townHallLevel: MAX_TOWN_HALL_LEVEL,
    equipmentLevels: getLatestKnownLevel(equipment),
    spellLevels: getLatestKnownLevel(spells),
    updatedAt: "",
    source: "manual",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLevelRecord(
  value: unknown,
  definitions: readonly {
    id: string;
    name: string;
    levels: readonly { level: number }[];
  }[],
  label: string,
) {
  const errors: Record<string, string> = {};
  const normalized: Record<string, number> = {};

  if (!isRecord(value)) {
    return {
      errors: { _form: `${label} levels must be a valid object.` },
      normalized,
    };
  }

  for (const definition of definitions) {
    const selectedLevel = value[definition.id];

    if (selectedLevel === undefined) {
      continue;
    }

    const isAvailable =
      typeof selectedLevel === "number" &&
      Number.isInteger(selectedLevel) &&
      definition.levels.some((level) => level.level === selectedLevel);

    if (!isAvailable) {
      errors[definition.id] =
        `Selected ${definition.name} level is not available in the current data.`;
      continue;
    }

    normalized[definition.id] = selectedLevel;
  }

  return { errors, normalized };
}

export function validateUserProgress(
  value: unknown,
): UserProgressValidationResult {
  const errors: UserProgressValidationErrors = {};

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: {
        townHallLevel: "Please select a valid Town Hall level.",
      },
    };
  }

  const townHallLevel = value.townHallLevel;
  if (
    typeof townHallLevel !== "number" ||
    !Number.isInteger(townHallLevel) ||
    townHallLevel < MIN_TOWN_HALL_LEVEL ||
    townHallLevel > MAX_TOWN_HALL_LEVEL
  ) {
    errors.townHallLevel = "Please select a valid Town Hall level.";
  }

  const playerTag = value.playerTag;
  if (playerTag !== undefined && typeof playerTag !== "string") {
    errors.playerTag = "Player tag must be text.";
  }

  const equipmentResult = validateLevelRecord(
    value.equipmentLevels,
    equipment,
    "Equipment",
  );
  if (Object.keys(equipmentResult.errors).length > 0) {
    errors.equipmentLevels = equipmentResult.errors;
  }

  const spellResult = validateLevelRecord(value.spellLevels, spells, "Spell");
  if (Object.keys(spellResult.errors).length > 0) {
    errors.spellLevels = spellResult.errors;
  }

  if (value.source !== "manual") {
    errors.source = "Progress source must be manual.";
  }

  if (
    typeof value.updatedAt !== "string" ||
    (value.updatedAt !== "" && Number.isNaN(Date.parse(value.updatedAt)))
  ) {
    errors.updatedAt = "Progress update time is invalid.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  const trimmedPlayerTag =
    typeof playerTag === "string" ? playerTag.trim() : undefined;

  return {
    valid: true,
    errors,
    progress: {
      ...(trimmedPlayerTag ? { playerTag: trimmedPlayerTag } : {}),
      townHallLevel: townHallLevel as number,
      equipmentLevels: equipmentResult.normalized,
      spellLevels: spellResult.normalized,
      updatedAt: value.updatedAt as string,
      source: "manual",
    },
  };
}

export function parseUserProgress(value: unknown): UserProgress | undefined {
  const validation = validateUserProgress(value);
  return validation.valid ? validation.progress : undefined;
}

function getStorage(): Storage | undefined {
  try {
    return typeof globalThis.localStorage === "undefined"
      ? undefined
      : globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function getRawUserProgress(): string {
  try {
    return getStorage()?.getItem(USER_PROGRESS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getUserProgress(): UserProgress {
  const rawProgress = getRawUserProgress();

  if (!rawProgress) {
    return getDefaultUserProgress();
  }

  try {
    return parseUserProgress(JSON.parse(rawProgress)) ?? getDefaultUserProgress();
  } catch {
    return getDefaultUserProgress();
  }
}

export function hasUserProgress(): boolean {
  const rawProgress = getRawUserProgress();

  if (!rawProgress) {
    return false;
  }

  try {
    return parseUserProgress(JSON.parse(rawProgress)) !== undefined;
  } catch {
    return false;
  }
}

function notifyProgressChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_PROGRESS_CHANGED_EVENT));
  }
}

export function saveUserProgress(progress: UserProgress): boolean {
  const validation = validateUserProgress(progress);
  const storage = getStorage();

  if (!validation.valid || !storage) {
    return false;
  }

  try {
    storage.setItem(
      USER_PROGRESS_STORAGE_KEY,
      JSON.stringify(validation.progress),
    );
    notifyProgressChanged();
    return true;
  } catch {
    return false;
  }
}

export function clearUserProgress(): void {
  try {
    getStorage()?.removeItem(USER_PROGRESS_STORAGE_KEY);
  } catch {
    // Local storage can be unavailable in private or restricted browser modes.
  }

  notifyProgressChanged();
}
