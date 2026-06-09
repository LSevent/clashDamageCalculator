import { equipment, objectIdMap, spells } from "@/src/data/game";
import {
  getDefaultUserProgress,
  MAX_TOWN_HALL_LEVEL,
  MIN_TOWN_HALL_LEVEL,
  validateUserProgress,
} from "@/src/lib/game/user-progress";
import type {
  ImportedProgressItem,
  ImportedProgressPreview,
  ImportSection,
  ImportUnknownCounts,
  JsonImportResult,
  RawVillageObject,
  RawVillageSnapshot,
} from "@/src/types/game/imported-progress";
import type { UserProgress } from "@/src/types/game/user-progress";

export const MAX_JSON_IMPORT_LENGTH = 500_000;

const importSections = [
  "buildings",
  "equipment",
  "spells",
  "heroes",
  "pets",
] as const satisfies readonly ImportSection[];

const definitionNames = new Map<string, string>([
  ...equipment.map((item) => [item.id, item.name] as const),
  ...spells.map((spell) => [spell.id, spell.name] as const),
  ["town-hall", "Town Hall"],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMappedObjectId(
  section: ImportSection,
  dataId: number,
): string | undefined {
  return objectIdMap[section][
    dataId as keyof (typeof objectIdMap)[typeof section]
  ] as string | undefined;
}

function getAvailableLevels(
  section: ImportSection,
  appObjectId: string,
): readonly number[] {
  if (section === "equipment") {
    return (
      equipment.find((item) => item.id === appObjectId)?.levels.map(
        (level) => level.level,
      ) ?? []
    );
  }

  if (section === "spells") {
    return (
      spells.find((spell) => spell.id === appObjectId)?.levels.map(
        (level) => level.level,
      ) ?? []
    );
  }

  return [];
}

function getRawItems(
  snapshot: RawVillageSnapshot,
  section: ImportSection,
  warnings: string[],
): readonly unknown[] {
  const sectionValue = snapshot[section];

  if (sectionValue === undefined) {
    return [];
  }

  if (!Array.isArray(sectionValue)) {
    warnings.push(`The "${section}" section was ignored because it is not an array.`);
    return [];
  }

  return sectionValue;
}

function createUnknownCounts(): ImportUnknownCounts {
  return {
    buildings: 0,
    equipment: 0,
    spells: 0,
    heroes: 0,
    pets: 0,
  };
}

function addHighestValidLevel(
  levels: Record<string, number>,
  appObjectId: string,
  level: number,
  displayName: string,
  warnings: string[],
) {
  const currentLevel = levels[appObjectId];

  if (currentLevel === undefined) {
    levels[appObjectId] = level;
    return;
  }

  const highestLevel = Math.max(currentLevel, level);
  levels[appObjectId] = highestLevel;
  warnings.push(
    `Duplicate ${displayName} entries detected; Lv${highestLevel} was selected.`,
  );
}

export function parseVillageSnapshotJson(jsonText: string): JsonImportResult {
  const trimmedJson = jsonText.trim();

  if (!trimmedJson) {
    return {
      success: false,
      error: "Paste village snapshot JSON before previewing the import.",
    };
  }

  if (trimmedJson.length > MAX_JSON_IMPORT_LENGTH) {
    return {
      success: false,
      error: `JSON is too large. The maximum supported size is ${MAX_JSON_IMPORT_LENGTH.toLocaleString()} characters.`,
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmedJson);
  } catch {
    return {
      success: false,
      error: "Invalid JSON syntax. Check the pasted text and try again.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      success: false,
      error: "Village snapshot JSON must contain an object at the top level.",
    };
  }

  return {
    success: true,
    preview: parseVillageSnapshot(parsed as RawVillageSnapshot),
  };
}

export function parseVillageSnapshot(
  snapshot: RawVillageSnapshot,
): ImportedProgressPreview {
  const warnings: string[] = [];
  const knownItems: ImportedProgressItem[] = [];
  const unknownItems: ImportedProgressItem[] = [];
  const unknownCounts = createUnknownCounts();
  const equipmentLevels: Record<string, number> = {};
  const spellLevels: Record<string, number> = {};
  let detectedTownHallLevel: number | undefined;
  const rawPlayerTag =
    typeof snapshot.playerTag === "string"
      ? snapshot.playerTag
      : typeof snapshot.tag === "string"
        ? snapshot.tag
        : undefined;
  const playerTag = rawPlayerTag?.trim() || undefined;

  for (const section of importSections) {
    const rawItems = getRawItems(snapshot, section, warnings);

    for (const rawItem of rawItems) {
      if (!isRecord(rawItem)) {
        unknownCounts[section] += 1;
        unknownItems.push({
          section,
          dataId: 0,
          validLevel: false,
        });
        continue;
      }

      const item = rawItem as RawVillageObject;
      const dataId =
        typeof item.data === "number" && Number.isInteger(item.data)
          ? item.data
          : undefined;
      const level =
        typeof item.lvl === "number" && Number.isInteger(item.lvl)
          ? item.lvl
          : undefined;

      if (dataId === undefined) {
        unknownCounts[section] += 1;
        unknownItems.push({
          section,
          dataId: 0,
          level,
          validLevel: false,
        });
        continue;
      }

      const appObjectId = getMappedObjectId(section, dataId);

      if (!appObjectId) {
        unknownCounts[section] += 1;
        unknownItems.push({
          section,
          dataId,
          level,
          validLevel: false,
        });
        continue;
      }

      const displayName = definitionNames.get(appObjectId) ?? appObjectId;

      if (section === "buildings" && appObjectId === "town-hall") {
        const validTownHallLevel =
          level !== undefined &&
          level >= MIN_TOWN_HALL_LEVEL &&
          level <= MAX_TOWN_HALL_LEVEL;

        knownItems.push({
          section,
          dataId,
          appObjectId,
          name: displayName,
          level,
          validLevel: validTownHallLevel,
        });

        if (validTownHallLevel) {
          detectedTownHallLevel = Math.max(
            detectedTownHallLevel ?? MIN_TOWN_HALL_LEVEL,
            level,
          );
        } else {
          warnings.push(
            `Detected Town Hall Lv${level ?? "unknown"}, but this level is outside the supported app range.`,
          );
        }

        continue;
      }

      if (section !== "equipment" && section !== "spells") {
        knownItems.push({
          section,
          dataId,
          appObjectId,
          name: displayName,
          level,
          validLevel: false,
        });
        continue;
      }

      const availableLevels = getAvailableLevels(section, appObjectId);
      const validLevel =
        level !== undefined && availableLevels.includes(level);

      knownItems.push({
        section,
        dataId,
        appObjectId,
        name: displayName,
        level,
        validLevel,
      });

      if (!validLevel) {
        warnings.push(
          `Detected ${displayName} Lv${level ?? "unknown"}, but this level is not available in the current app data.`,
        );
        continue;
      }

      addHighestValidLevel(
        section === "equipment" ? equipmentLevels : spellLevels,
        appObjectId,
        level,
        displayName,
        warnings,
      );
    }
  }

  if (detectedTownHallLevel === undefined) {
    warnings.push("Town Hall level could not be detected from this JSON.");
  }

  const totalUnknownItems = Object.values(unknownCounts).reduce(
    (total, count) => total + count,
    0,
  );
  if (totalUnknownItems > 0) {
    warnings.push(
      `${totalUnknownItems} unknown item${totalUnknownItems === 1 ? " was" : "s were"} ignored safely.`,
    );
  }

  // TODO: Add hero and pet level saving when those static datasets are introduced.
  return {
    ...(playerTag ? { playerTag } : {}),
    ...(detectedTownHallLevel !== undefined
      ? { detectedTownHallLevel }
      : {}),
    equipmentLevels,
    spellLevels,
    knownItems,
    unknownItems,
    unknownCounts,
    warnings,
    source: "json-import",
  };
}

export function importedPreviewToUserProgress(
  preview: ImportedProgressPreview,
  baseProgress: UserProgress = getDefaultUserProgress(),
): UserProgress | undefined {
  const candidate: UserProgress = {
    ...(preview.playerTag
      ? { playerTag: preview.playerTag }
      : baseProgress.playerTag
        ? { playerTag: baseProgress.playerTag }
        : {}),
    townHallLevel:
      preview.detectedTownHallLevel ?? baseProgress.townHallLevel,
    equipmentLevels: {
      ...baseProgress.equipmentLevels,
      ...preview.equipmentLevels,
    },
    spellLevels: {
      ...baseProgress.spellLevels,
      ...preview.spellLevels,
    },
    ...(baseProgress.heroLevels
      ? { heroLevels: { ...baseProgress.heroLevels } }
      : {}),
    updatedAt: new Date().toISOString(),
    source: "json-import",
  };
  const validation = validateUserProgress(candidate);

  return validation.valid ? validation.progress : undefined;
}
