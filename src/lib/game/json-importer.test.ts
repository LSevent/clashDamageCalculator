import { describe, expect, it } from "vitest";

import {
  importedPreviewToUserProgress,
  MAX_JSON_IMPORT_LENGTH,
  parseVillageSnapshotJson,
} from "./json-importer";
import { getDefaultUserProgress } from "./user-progress";

const validSnapshot = {
  tag: "#GGCRCV2P",
  buildings: [{ data: 1000001, lvl: 15 }],
  equipment: [
    { data: 90000024, lvl: 18 },
    { data: 90000053, lvl: 24 },
  ],
  spells: [{ data: 26000010, lvl: 5 }],
  heroes: [],
};

describe("JSON importer", () => {
  it("detects player tag, Town Hall, equipment, and spell progress", () => {
    const result = parseVillageSnapshotJson(JSON.stringify(validSnapshot));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.preview.playerTag).toBe("#GGCRCV2P");
      expect(result.preview.detectedTownHallLevel).toBe(15);
      expect(result.preview.equipmentLevels).toEqual({
        "giant-arrow": 18,
        "rocket-backpack": 24,
      });
      expect(result.preview.spellLevels).toEqual({
        "earthquake-spell": 5,
      });
    }
  });

  it("returns a friendly error for invalid JSON", () => {
    const result = parseVillageSnapshotJson("{invalid");

    expect(result).toEqual({
      success: false,
      error: "Invalid JSON syntax. Check the pasted text and try again.",
    });
  });

  it("returns a clear error for empty input", () => {
    expect(parseVillageSnapshotJson("   ")).toEqual({
      success: false,
      error: "Paste village snapshot JSON before previewing the import.",
    });
  });

  it("rejects oversized JSON before parsing", () => {
    const result = parseVillageSnapshotJson(
      `{"padding":"${"x".repeat(MAX_JSON_IMPORT_LENGTH)}"}`,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("JSON is too large");
    }
  });

  it("ignores and counts unknown IDs", () => {
    const result = parseVillageSnapshotJson(
      JSON.stringify({
        ...validSnapshot,
        buildings: [
          ...validSnapshot.buildings,
          { data: 1999999, lvl: 1 },
        ],
        equipment: [
          ...validSnapshot.equipment,
          { data: 99999999, lvl: 1 },
        ],
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.preview.unknownCounts.buildings).toBe(1);
      expect(result.preview.unknownCounts.equipment).toBe(1);
      expect(result.preview.unknownItems).toHaveLength(2);
    }
  });

  it("warns when Town Hall cannot be detected without failing import", () => {
    const result = parseVillageSnapshotJson(
      JSON.stringify({
        equipment: validSnapshot.equipment,
        spells: validSnapshot.spells,
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.preview.detectedTownHallLevel).toBeUndefined();
      expect(result.preview.warnings).toContain(
        "Town Hall level could not be detected from this JSON.",
      );
    }
  });

  it("skips equipment and spell levels missing from static app data", () => {
    const result = parseVillageSnapshotJson(
      JSON.stringify({
        buildings: validSnapshot.buildings,
        equipment: [{ data: 90000024, lvl: 17 }],
        spells: [{ data: 26000010, lvl: 4 }],
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.preview.equipmentLevels).toEqual({});
      expect(result.preview.spellLevels).toEqual({});
      expect(result.preview.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Giant Arrow Lv17"),
          expect.stringContaining("Earthquake Spell Lv4"),
        ]),
      );
    }
  });

  it("uses the highest valid duplicate equipment level", () => {
    const result = parseVillageSnapshotJson(
      JSON.stringify({
        buildings: validSnapshot.buildings,
        equipment: [
          { data: 90000024, lvl: 12 },
          { data: 90000024, lvl: 18 },
        ],
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.preview.equipmentLevels["giant-arrow"]).toBe(18);
      expect(result.preview.warnings).toContain(
        "Duplicate Giant Arrow entries detected; Lv18 was selected.",
      );
    }
  });

  it("converts a preview into merged JSON-import progress safely", () => {
    const result = parseVillageSnapshotJson(
      JSON.stringify({
        tag: "#GGCRCV2P",
        buildings: validSnapshot.buildings,
        equipment: [{ data: 90000024, lvl: 18 }],
        spells: validSnapshot.spells,
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const progress = importedPreviewToUserProgress(
        result.preview,
        getDefaultUserProgress(),
      );

      expect(progress).toMatchObject({
        playerTag: "#GGCRCV2P",
        townHallLevel: 15,
        equipmentLevels: {
          "giant-arrow": 18,
          "rocket-backpack": 24,
        },
        spellLevels: {
          "earthquake-spell": 5,
        },
        source: "json-import",
      });
      expect(progress).not.toHaveProperty("rawJson");
    }
  });
});
