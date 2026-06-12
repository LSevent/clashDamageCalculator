import type {
  ParsedStatChangeCandidate,
  StatChangeFieldName,
  StatChangeTargetKind,
} from "@/src/types/admin-stat-change";

type ExistingLevel = {
  level: number;
  townHallLevel?: number;
  isSupercharged?: boolean;
  superchargeLevel?: number;
  values: Partial<Record<StatChangeFieldName, unknown>>;
};

type MatchableItem = {
  id: string;
  name: string;
  kind: Exclude<StatChangeTargetKind, "patch-note-hint">;
  levels: readonly ExistingLevel[];
};

export type StatChangeMatchContext = {
  items: readonly MatchableItem[];
};

export type MatchedStatChangeCandidate = {
  targetKind: Exclude<StatChangeTargetKind, "patch-note-hint">;
  targetId?: string;
  targetName: string;
  level: number;
  townHallLevel?: number;
  isSupercharged?: boolean;
  superchargeLevel?: number;
  fieldName: StatChangeFieldName;
  oldValue: unknown;
  suggestedValue: unknown;
  confidence: "high" | "low";
  parserNotes?: string;
  sourceExcerpt: string;
};

function normalizedName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function stableStatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStatValue).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStatValue(item)}`)
    .join(",")}}`;
}

export function suggestionDuplicateKey(input: {
  patchId: string;
  targetKind: string;
  targetId?: string | null;
  targetName?: string | null;
  level?: number | null;
  townHallLevel?: number | null;
  isSupercharged?: boolean | null;
  superchargeLevel?: number | null;
  fieldName?: string | null;
  suggestedValue: unknown;
}) {
  return [
    input.patchId,
    input.targetKind,
    input.targetId ?? normalizedName(input.targetName ?? ""),
    input.level ?? "",
    input.townHallLevel ?? "",
    input.isSupercharged ?? false,
    input.superchargeLevel ?? "",
    input.fieldName ?? "",
    stableStatValue(input.suggestedValue),
  ].join("|");
}

export function matchParsedStatChange(
  candidate: ParsedStatChangeCandidate,
  context: StatChangeMatchContext,
): MatchedStatChangeCandidate {
  const candidateName = normalizedName(candidate.targetName);
  const matches = context.items.filter(
    (item) =>
      normalizedName(item.name) === candidateName ||
      normalizedName(item.id) === candidateName,
  );
  const kindMatches = candidate.targetKind
    ? matches.filter((item) => item.kind === candidate.targetKind)
    : matches;
  const item = kindMatches.length === 1 ? kindMatches[0] : undefined;
  const level = item?.levels.find(
    (entry) =>
      entry.level === candidate.level &&
      (candidate.townHallLevel === undefined ||
        entry.townHallLevel === candidate.townHallLevel) &&
      (candidate.isSupercharged === undefined ||
        Boolean(entry.isSupercharged) === candidate.isSupercharged) &&
      (candidate.superchargeLevel === undefined ||
        entry.superchargeLevel === candidate.superchargeLevel),
  );
  const targetKind =
    item?.kind ??
    candidate.targetKind ??
    (candidate.fieldName === "hp"
      ? "building-level"
      : candidate.fieldName === "damagePercent" ||
          candidate.fieldName === "repeatDamageRule"
        ? "spell-level"
        : "equipment-level");
  const oldValue = level?.values[candidate.fieldName] ?? null;
  const notes = [
    ...(!item
      ? ["Target could not be matched to existing database item."]
      : []),
    ...(item && !level
      ? ["Existing level row could not be matched; applying may create it."]
      : []),
    ...(item && level && stableStatValue(oldValue) ===
      stableStatValue(candidate.suggestedValue)
      ? ["Suggested value matches current database value."]
      : []),
  ];

  return {
    targetKind,
    targetId: item?.id,
    targetName: item?.name ?? candidate.targetName,
    level: candidate.level,
    townHallLevel: candidate.townHallLevel,
    isSupercharged: candidate.isSupercharged,
    superchargeLevel: candidate.superchargeLevel,
    fieldName: candidate.fieldName,
    oldValue,
    suggestedValue: candidate.suggestedValue,
    confidence: item ? "high" : "low",
    parserNotes: notes.length > 0 ? notes.join(" ") : undefined,
    sourceExcerpt: candidate.sourceExcerpt,
  };
}
