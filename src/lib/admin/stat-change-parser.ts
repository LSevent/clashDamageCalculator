import { parseCsv } from "@/src/lib/admin/bulk-import";
import type {
  ParsedStatChangeCandidate,
  StatChangeFieldName,
  StatChangeTargetKind,
} from "@/src/types/admin-stat-change";

export const maxSourceExcerptCharacters = 20_000;

export type StatChangeParseResult = {
  candidates: readonly ParsedStatChangeCandidate[];
  needsHint: boolean;
  warnings: readonly string[];
};

const fieldAliases: readonly [RegExp, StatChangeFieldName][] = [
  [/^(?:hp|hitpoints?|hit points?)$/i, "hp"],
  [/^(?:damage percent|damage percentage|damagepercent)$/i, "damagePercent"],
  [/^(?:penetrating damage|damage)$/i, "damage"],
  [/^healing$/i, "healing"],
  [/^(?:hp increase|hpincrease|health increase)$/i, "hpIncrease"],
  [/^(?:repeat damage rule|repeatdamagerule)$/i, "repeatDamageRule"],
  [/^(?:special rules|specialrules)$/i, "specialRules"],
  [/^(?:ability description|abilitydescription)$/i, "abilityDescription"],
  [/^notes?$/i, "notes"],
];

function fieldName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return fieldAliases.find(([pattern]) => pattern.test(normalized))?.[1];
}

function targetKind(
  value: string | undefined,
): Exclude<StatChangeTargetKind, "patch-note-hint"> | undefined {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "building" ||
    normalized === "building-level" ||
    normalized === "defense"
  ) {
    return "building-level";
  }
  if (
    normalized === "equipment" ||
    normalized === "equipment-level" ||
    normalized === "gear"
  ) {
    return "equipment-level";
  }
  if (normalized === "spell" || normalized === "spell-level") {
    return "spell-level";
  }

  return undefined;
}

function inferredTargetKind(
  targetName: string,
  field: StatChangeFieldName,
) {
  if (
    field === "damagePercent" ||
    field === "repeatDamageRule" ||
    /\bspell\b/i.test(targetName)
  ) {
    return "spell-level" as const;
  }
  if (field === "hp") {
    return "building-level" as const;
  }
  if (
    field === "healing" ||
    field === "hpIncrease" ||
    field === "specialRules" ||
    field === "abilityDescription"
  ) {
    return "equipment-level" as const;
  }

  return undefined;
}

function numericValue(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) ? number : undefined;
}

function parsedValue(field: StatChangeFieldName, value: string) {
  const trimmed = value.trim();

  if (
    field === "repeatDamageRule" ||
    field === "abilityDescription" ||
    field === "notes"
  ) {
    return trimmed || undefined;
  }
  if (field === "specialRules") {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return undefined;
    }
  }

  return numericValue(trimmed);
}

function integer(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function candidateFromValues(
  values: Record<string, string>,
  sourceExcerpt: string,
): ParsedStatChangeCandidate | undefined {
  const targetName = (
    values.item ??
    values.targetName ??
    values.name ??
    ""
  ).trim();
  const level = integer(values.level);
  const field = fieldName(values.field ?? values.fieldName ?? "");

  if (!targetName || level === undefined || !field) {
    return undefined;
  }

  const value = parsedValue(
    field,
    values.newValue ?? values.value ?? values.suggestedValue ?? "",
  );

  if (value === undefined) {
    return undefined;
  }

  const explicitKind = targetKind(values.targetKind ?? values.kind);
  const townHallLevel = integer(
    values.townHallLevel ?? values.thLevel ?? values.th,
  );
  const superchargeLevel = integer(values.superchargeLevel);
  const isSupercharged =
    values.isSupercharged?.trim().toLowerCase() === "true" ||
    superchargeLevel !== undefined;

  return {
    targetName,
    targetKind: explicitKind ?? inferredTargetKind(targetName, field),
    level,
    townHallLevel,
    isSupercharged: isSupercharged || undefined,
    superchargeLevel,
    fieldName: field,
    suggestedValue: value,
    sourceExcerpt: sourceExcerpt.trim().slice(0, 1_000),
  };
}

function parseTable(text: string) {
  const parsed = parseCsv(text);

  if (
    parsed.errors.length > 0 ||
    !parsed.headers.some((header) =>
      ["item", "targetName", "name"].includes(header),
    ) ||
    !parsed.headers.includes("level") ||
    !parsed.headers.some((header) => ["field", "fieldName"].includes(header)) ||
    !parsed.headers.some((header) =>
      ["newValue", "value", "suggestedValue"].includes(header),
    )
  ) {
    return [];
  }

  return parsed.rows
    .map((row) =>
      candidateFromValues(
        row.values,
        parsed.headers.map((header) => row.values[header] ?? "").join(", "),
      ),
    )
    .filter(
      (candidate): candidate is ParsedStatChangeCandidate =>
        candidate !== undefined,
    );
}

function parseLine(line: string): ParsedStatChangeCandidate | undefined {
  const match = line.trim().match(
    /^(.+?)\s+(?:level|lv\.?)\s*(\d+)(?:\s+(?:town hall|th)\s*(\d+))?\s+(damage percentage|damage percent|penetrating damage|repeat damage rule|ability description|special rules|health increase|hp increase|damage|healing|hit points|hitpoint|hp|notes?)\s*(?:(?:=|:|\bto\b)\s*)?(.+)$/i,
  );

  if (!match) {
    return undefined;
  }

  const targetName = match[1]?.trim() ?? "";
  const level = integer(match[2]);
  const townHallLevel = integer(match[3]);
  const field = fieldName(match[4] ?? "");

  if (!targetName || level === undefined || !field) {
    return undefined;
  }

  const value = parsedValue(field, match[5] ?? "");

  if (value === undefined) {
    return undefined;
  }

  return {
    targetName,
    targetKind: inferredTargetKind(targetName, field),
    level,
    townHallLevel,
    fieldName: field,
    suggestedValue: value,
    sourceExcerpt: line.trim().slice(0, 1_000),
  };
}

export function parseStatChangeText(text: string): StatChangeParseResult {
  const trimmed = text.trim().slice(0, maxSourceExcerptCharacters);

  if (!trimmed) {
    return {
      candidates: [],
      needsHint: true,
      warnings: ["No calculator-ready stat lines were provided."],
    };
  }

  const tableCandidates = parseTable(trimmed);
  const candidates =
    tableCandidates.length > 0
      ? tableCandidates
      : trimmed
          .split(/\r?\n/)
          .map(parseLine)
          .filter(
            (candidate): candidate is ParsedStatChangeCandidate =>
              candidate !== undefined,
          );

  return {
    candidates,
    needsHint: candidates.length === 0,
    warnings:
      candidates.length === 0
        ? [
            "Exact calculator-ready values were not parsed. A review hint will be created instead.",
          ]
        : [],
  };
}
