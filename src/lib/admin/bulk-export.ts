import type { BulkImportType } from "@/src/types/admin-bulk-import";

export function escapeCsvValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");
}

export const bulkCsvHeaders: Record<BulkImportType, readonly string[]> = {
  "building-levels": [
    "buildingId",
    "buildingName",
    "townHallLevel",
    "level",
    "hp",
    "isSupercharged",
    "superchargeLevel",
    "patchId",
    "sourceUrl",
    "verificationStatus",
    "notes",
  ],
  "equipment-levels": [
    "equipmentId",
    "equipmentName",
    "level",
    "damage",
    "healing",
    "hpIncrease",
    "abilityDescription",
    "specialRules",
    "patchId",
    "sourceUrl",
    "verificationStatus",
    "notes",
  ],
  "spell-levels": [
    "spellId",
    "spellName",
    "level",
    "damage",
    "damagePercent",
    "repeatDamageRule",
    "patchId",
    "sourceUrl",
    "verificationStatus",
    "notes",
  ],
};

export function createBulkTemplate(type: BulkImportType) {
  if (type === "building-levels") {
    return createCsv(bulkCsvHeaders[type], [
      [
        "scattershot",
        "Scattershot",
        18,
        7,
        5800,
        false,
        "",
        "may-2026",
        "https://example.com/source",
        "needs-review",
        "EXAMPLE ROW - replace before import",
      ],
    ]);
  }

  if (type === "equipment-levels") {
    return createCsv(bulkCsvHeaders[type], [
      [
        "giant-arrow",
        "Giant Arrow",
        18,
        1500,
        "",
        "",
        "Shoots a giant arrow across the village",
        {
          targetMultipliers: [
            { targetBuildingId: "air-defense", multiplier: 2 },
          ],
        },
        "may-2026",
        "https://example.com/source",
        "needs-review",
        "EXAMPLE ROW - replace before import",
      ],
    ]);
  }

  return createCsv(bulkCsvHeaders[type], [
    [
      "earthquake-spell",
      "Earthquake Spell",
      5,
      "",
      0.29,
      "diminishing-odd-denominator",
      "may-2026",
      "https://example.com/source",
      "needs-review",
      "EXAMPLE ROW - replace before import",
    ],
  ]);
}
