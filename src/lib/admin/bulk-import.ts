import {
  validateBuildingLevelInput,
  validateEquipmentLevelInput,
  validateSpellLevelInput,
} from "@/src/lib/admin/admin-validation";
import {
  bulkImportTypes,
  type BulkImportContext,
  type BulkImportPreview,
  type BulkImportPreviewRow,
  type BulkImportRow,
  type BulkImportSummary,
  type BulkImportType,
  type CsvParseResult,
  type CsvRow,
  type ExistingBuildingLevelRow,
  type ExistingEquipmentLevelRow,
  type ExistingSpellLevelRow,
} from "@/src/types/admin-bulk-import";

export const maxCsvBytes = 1024 * 1024;
export const maxCsvRows = 5000;

const requiredHeaders: Record<BulkImportType, readonly string[]> = {
  "building-levels": [
    "buildingId",
    "buildingName",
    "townHallLevel",
    "level",
    "hp",
  ],
  "equipment-levels": ["equipmentId", "equipmentName", "level"],
  "spell-levels": ["spellId", "spellName", "level"],
};

function isBlankRow(fields: readonly string[]) {
  return fields.every((field) => !field.trim());
}

export function parseCsv(csv: string): CsvParseResult {
  const records: { fields: string[]; rowNumber: number }[] = [];
  const errors: string[] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  let fieldWasQuoted = false;
  let rowNumber = 1;
  let recordStart = 1;

  const pushField = () => {
    fields.push(fieldWasQuoted ? field : field.trim());
    field = "";
    fieldWasQuoted = false;
  };
  const pushRecord = () => {
    pushField();
    if (!isBlankRow(fields)) {
      records.push({ fields, rowNumber: recordStart });
    }
    fields = [];
    recordStart = rowNumber + 1;
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (quoted) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
        if (character === "\n") {
          rowNumber += 1;
        }
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
      fieldWasQuoted = true;
    } else if (character === ",") {
      pushField();
    } else if (character === "\n") {
      pushRecord();
      rowNumber += 1;
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (quoted) {
    errors.push(`Row ${recordStart}: quoted value is not closed.`);
  }
  if (field.length > 0 || fields.length > 0) {
    pushRecord();
  }

  const headerRecord = records[0];
  if (!headerRecord) {
    return {
      headers: [],
      rows: [],
      errors: [...errors, "CSV must include a header row."],
    };
  }

  const headers = headerRecord.fields.map((header) => header.trim());
  if (headers.some((header) => !header)) {
    errors.push("CSV headers cannot be blank.");
  }
  if (new Set(headers).size !== headers.length) {
    errors.push("CSV headers must be unique.");
  }

  const rows: CsvRow[] = [];
  for (const record of records.slice(1)) {
    if (record.fields.length !== headers.length) {
      errors.push(
        `Row ${record.rowNumber}: expected ${headers.length} columns but found ${record.fields.length}.`,
      );
      continue;
    }

    rows.push({
      rowNumber: record.rowNumber,
      values: Object.fromEntries(
        headers.map((header, index) => [header, record.fields[index] ?? ""]),
      ),
    });
  }

  return { headers, rows, errors };
}

export function isBulkImportType(value: unknown): value is BulkImportType {
  return (
    typeof value === "string" &&
    bulkImportTypes.includes(value as BulkImportType)
  );
}

export function getActionableBulkImportRows(preview: BulkImportPreview) {
  return preview.rows.filter(
    (row) =>
      (row.action === "create" || row.action === "update") && row.data,
  );
}

function missingHeaders(type: BulkImportType, headers: readonly string[]) {
  return requiredHeaders[type].filter((header) => !headers.includes(header));
}

function itemLabel(row: BulkImportRow) {
  if (row.kind === "building-levels") {
    return row.buildingName ?? row.buildingId;
  }
  if (row.kind === "equipment-levels") {
    return row.equipmentName ?? row.equipmentId;
  }
  return row.spellName ?? row.spellId;
}

function stableValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "object") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableValue).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined && item !== null)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, item]) => `${key}:${stableValue(item)}`)
    .join(",")}}`;
}

function sameValues(first: object, second: object) {
  return stableValue(first) === stableValue(second);
}

function summarizeBuilding(row: ExistingBuildingLevelRow) {
  return [
    `HP ${row.hp}`,
    `TH${row.townHallLevel}`,
    row.isSupercharged
      ? `Supercharge ${row.superchargeLevel ?? "missing"}`
      : "Standard",
    row.patchId ? `Patch ${row.patchId}` : "No patch",
    row.verificationStatus,
  ].join(" · ");
}

function summarizeEquipment(row: ExistingEquipmentLevelRow) {
  return [
    `Damage ${row.damage ?? "—"}`,
    `Healing ${row.healing ?? "—"}`,
    `HP +${row.hpIncrease ?? "—"}`,
    row.patchId ? `Patch ${row.patchId}` : "No patch",
    row.verificationStatus,
  ].join(" · ");
}

function summarizeSpell(row: ExistingSpellLevelRow) {
  return [
    `Damage ${row.damage ?? "—"}`,
    `Percent ${row.damagePercent ?? "—"}`,
    row.repeatDamageRule ?? "No repeat rule",
    row.patchId ? `Patch ${row.patchId}` : "No patch",
    row.verificationStatus,
  ].join(" · ");
}

function buildingMatch(
  row: Extract<BulkImportRow, { kind: "building-levels" }>,
  existing: ExistingBuildingLevelRow,
) {
  return (
    row.buildingId === existing.buildingId &&
    row.townHallLevel === existing.townHallLevel &&
    row.level === existing.level &&
    row.isSupercharged === existing.isSupercharged &&
    (row.superchargeLevel ?? undefined) ===
      (existing.superchargeLevel ?? undefined)
  );
}

function invalidRow(
  row: CsvRow,
  itemId: string,
  errors: readonly string[],
): BulkImportPreviewRow {
  return {
    rowNumber: row.rowNumber,
    action: "invalid",
    itemId,
    message: errors.join(" "),
  };
}

function validateBuildingRow(
  row: CsvRow,
  context: BulkImportContext,
): BulkImportPreviewRow {
  const values = {
    ...row.values,
    verificationStatus:
      row.values.verificationStatus?.trim() || "needs-review",
  };
  const result = validateBuildingLevelInput(values);
  const errors = result.success ? [] : [...result.errors];
  const buildingId = row.values.buildingId?.trim() ?? "";

  if (buildingId && !context.buildingIds.has(buildingId)) {
    errors.push(
      "Unknown buildingId. Create the building first in Admin Data Editor.",
    );
  }
  const patchId = row.values.patchId?.trim();
  if (patchId && !context.patchIds.has(patchId)) {
    errors.push("Unknown patchId. Create the patch first in Admin Data Editor.");
  }
  if (!row.values.hp?.trim()) {
    errors.push("HP is required.");
  }
  if (errors.length > 0 || !result.success || result.data.hp === undefined) {
    return invalidRow(row, buildingId, errors);
  }

  const data = {
    kind: "building-levels" as const,
    buildingName: row.values.buildingName?.trim() || undefined,
    ...result.data,
    hp: result.data.hp,
  };
  const existing = context.buildingLevels.find((item) =>
    buildingMatch(data, item),
  );
  const comparable = {
    buildingId: data.buildingId,
    townHallLevel: data.townHallLevel,
    level: data.level,
    hp: data.hp,
    isSupercharged: data.isSupercharged,
    superchargeLevel: data.superchargeLevel,
    patchId: data.patchId,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    notes: data.notes,
  };
  const action =
    data.verificationStatus === "rejected"
      ? "skipped"
      : !existing
        ? "create"
        : sameValues(comparable, existing)
          ? "unchanged"
          : "update";

  return {
    rowNumber: row.rowNumber,
    action,
    itemId: data.buildingId,
    itemName: itemLabel(data),
    level: data.level,
    oldValue: existing ? summarizeBuilding(existing) : undefined,
    newValue: summarizeBuilding(comparable),
    message:
      action === "skipped"
        ? "Rejected rows are intentionally skipped."
        : undefined,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    data,
  };
}

function validateEquipmentRow(
  row: CsvRow,
  context: BulkImportContext,
): BulkImportPreviewRow {
  const values = {
    ...row.values,
    verificationStatus:
      row.values.verificationStatus?.trim() || "needs-review",
  };
  const result = validateEquipmentLevelInput(values);
  const errors = result.success ? [] : [...result.errors];
  const equipmentId = row.values.equipmentId?.trim() ?? "";
  const hasContent = [
    row.values.damage,
    row.values.healing,
    row.values.hpIncrease,
    row.values.abilityDescription,
    row.values.specialRules,
  ].some((value) => value?.trim());

  if (equipmentId && !context.equipmentIds.has(equipmentId)) {
    errors.push(
      "Unknown equipmentId. Create the equipment first in Admin Data Editor.",
    );
  }
  const patchId = row.values.patchId?.trim();
  if (patchId && !context.patchIds.has(patchId)) {
    errors.push("Unknown patchId. Create the patch first in Admin Data Editor.");
  }
  if (!hasContent) {
    errors.push("At least one equipment stat or description is required.");
  }
  if (errors.length > 0 || !result.success) {
    return invalidRow(row, equipmentId, errors);
  }

  const data = {
    kind: "equipment-levels" as const,
    equipmentName: row.values.equipmentName?.trim() || undefined,
    equipmentId: result.data.equipmentId,
    level: result.data.level,
    damage: result.data.damage,
    healing: result.data.healing,
    hpIncrease: result.data.hpIncrease,
    abilityDescription: result.data.abilityDescription,
    specialRules: result.data.specialRules,
    patchId: result.data.patchId,
    sourceUrl: result.data.sourceUrl,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes,
  };
  const existing = context.equipmentLevels.find(
    (item) =>
      item.equipmentId === data.equipmentId && item.level === data.level,
  );
  const comparable = {
    equipmentId: data.equipmentId,
    level: data.level,
    damage: data.damage,
    healing: data.healing,
    hpIncrease: data.hpIncrease,
    abilityDescription: data.abilityDescription,
    specialRules: data.specialRules,
    patchId: data.patchId,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    notes: data.notes,
  };
  const action =
    data.verificationStatus === "rejected"
      ? "skipped"
      : !existing
        ? "create"
        : sameValues(comparable, existing)
          ? "unchanged"
          : "update";

  return {
    rowNumber: row.rowNumber,
    action,
    itemId: data.equipmentId,
    itemName: itemLabel(data),
    level: data.level,
    oldValue: existing ? summarizeEquipment(existing) : undefined,
    newValue: summarizeEquipment(comparable),
    message:
      action === "skipped"
        ? "Rejected rows are intentionally skipped."
        : undefined,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    data,
  };
}

function validateSpellRow(
  row: CsvRow,
  context: BulkImportContext,
): BulkImportPreviewRow {
  const values = {
    ...row.values,
    verificationStatus:
      row.values.verificationStatus?.trim() || "needs-review",
  };
  const result = validateSpellLevelInput(values);
  const errors = result.success ? [] : [...result.errors];
  const spellId = row.values.spellId?.trim() ?? "";
  const hasContent = [
    row.values.damage,
    row.values.damagePercent,
    row.values.repeatDamageRule,
  ].some((value) => value?.trim());

  if (spellId && !context.spellIds.has(spellId)) {
    errors.push(
      "Unknown spellId. Create the spell first in Admin Data Editor.",
    );
  }
  const patchId = row.values.patchId?.trim();
  if (patchId && !context.patchIds.has(patchId)) {
    errors.push("Unknown patchId. Create the patch first in Admin Data Editor.");
  }
  if (!hasContent) {
    errors.push("At least one spell stat or repeat rule is required.");
  }
  if (errors.length > 0 || !result.success) {
    return invalidRow(row, spellId, errors);
  }

  const data = {
    kind: "spell-levels" as const,
    spellName: row.values.spellName?.trim() || undefined,
    ...result.data,
  };
  const existing = context.spellLevels.find(
    (item) => item.spellId === data.spellId && item.level === data.level,
  );
  const comparable = {
    spellId: data.spellId,
    level: data.level,
    damage: data.damage,
    damagePercent: data.damagePercent,
    repeatDamageRule: data.repeatDamageRule,
    patchId: data.patchId,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    notes: data.notes,
  };
  const action =
    data.verificationStatus === "rejected"
      ? "skipped"
      : !existing
        ? "create"
        : sameValues(comparable, existing)
          ? "unchanged"
          : "update";

  return {
    rowNumber: row.rowNumber,
    action,
    itemId: data.spellId,
    itemName: itemLabel(data),
    level: data.level,
    oldValue: existing ? summarizeSpell(existing) : undefined,
    newValue: summarizeSpell(comparable),
    message:
      action === "skipped"
        ? "Rejected rows are intentionally skipped."
        : undefined,
    sourceUrl: data.sourceUrl,
    verificationStatus: data.verificationStatus,
    data,
  };
}

function summarize(rows: readonly BulkImportPreviewRow[]): BulkImportSummary {
  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.action !== "invalid").length,
    invalidRows: rows.filter((row) => row.action === "invalid").length,
    newRows: rows.filter((row) => row.action === "create").length,
    updateRows: rows.filter((row) => row.action === "update").length,
    unchangedRows: rows.filter((row) => row.action === "unchanged").length,
    skippedRows: rows.filter((row) => row.action === "skipped").length,
  };
}

function previewRowKey(row: BulkImportPreviewRow) {
  if (!row.data) {
    return undefined;
  }
  if (row.data.kind === "building-levels") {
    return [
      row.data.buildingId,
      row.data.townHallLevel,
      row.data.level,
      row.data.isSupercharged,
      row.data.superchargeLevel ?? 0,
    ].join(":");
  }
  if (row.data.kind === "equipment-levels") {
    return `${row.data.equipmentId}:${row.data.level}`;
  }
  return `${row.data.spellId}:${row.data.level}`;
}

export function createBulkImportPreview(
  type: BulkImportType,
  csv: string,
  context: BulkImportContext,
): BulkImportPreview {
  if (new TextEncoder().encode(csv).length > maxCsvBytes) {
    return {
      type,
      headers: [],
      parseErrors: ["CSV exceeds the 1 MB import limit."],
      rows: [],
      summary: summarize([]),
    };
  }

  const parsed = parseCsv(csv);
  const headerErrors = missingHeaders(type, parsed.headers).map(
    (header) => `Missing required column: ${header}.`,
  );

  if (parsed.rows.length > maxCsvRows) {
    headerErrors.push(`CSV exceeds the ${maxCsvRows}-row import limit.`);
  }

  const rows =
    headerErrors.length > 0
      ? []
      : parsed.rows.slice(0, maxCsvRows).map((row) => {
          if (type === "building-levels") {
            return validateBuildingRow(row, context);
          }
          if (type === "equipment-levels") {
            return validateEquipmentRow(row, context);
          }
          return validateSpellRow(row, context);
        });
  const keyCounts = rows.reduce((counts, row) => {
    const key = previewRowKey(row);
    if (key && row.action !== "invalid") {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>());
  const withDuplicateValidation = rows.map((row) => {
    const key = previewRowKey(row);
    if (!key || row.action === "invalid" || keyCounts.get(key) === 1) {
      return row;
    }
    return {
      ...row,
      action: "invalid" as const,
      message: "Duplicate matching row in this CSV.",
    };
  });

  return {
    type,
    headers: parsed.headers,
    parseErrors: [...parsed.errors, ...headerErrors],
    rows: withDuplicateValidation,
    summary: summarize(withDuplicateValidation),
  };
}
