import { describe, expect, it } from "vitest";

import { createCsv, escapeCsvValue } from "./bulk-export";
import {
  createBulkImportPreview,
  getActionableBulkImportRows,
  parseCsv,
} from "./bulk-import";
import type { BulkImportContext } from "@/src/types/admin-bulk-import";

function context(
  overrides: Partial<BulkImportContext> = {},
): BulkImportContext {
  return {
    buildingIds: new Set(["scattershot"]),
    equipmentIds: new Set(["giant-arrow"]),
    spellIds: new Set(["earthquake-spell"]),
    patchIds: new Set(["may-2026"]),
    buildingLevels: [],
    equipmentLevels: [],
    spellLevels: [],
    ...overrides,
  };
}

describe("CSV parser", () => {
  it("parses basic rows, quoted commas, escaped quotes, and blank lines", () => {
    const parsed = parseCsv(
      'id,name,notes\n1,"Giant Arrow, Level 18","Deals ""double"" damage"\n\n',
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.values).toEqual({
      id: "1",
      name: "Giant Arrow, Level 18",
      notes: 'Deals "double" damage',
    });
  });

  it("reports malformed quoted values and column counts", () => {
    const parsed = parseCsv('id,name\n1,"Unclosed\n2,extra,value');

    expect(parsed.errors.some((error) => error.includes("not closed"))).toBe(
      true,
    );
  });
});

describe("bulk import validation and comparison", () => {
  it("validates building HP and defaults verification to needs-review", () => {
    const preview = createBulkImportPreview(
      "building-levels",
      [
        "buildingId,buildingName,townHallLevel,level,hp,isSupercharged,superchargeLevel,patchId,sourceUrl,verificationStatus,notes",
        "scattershot,Scattershot,18,7,5800,false,,may-2026,https://example.com,,TH18",
      ].join("\n"),
      context(),
    );

    expect(preview.rows[0]?.action).toBe("create");
    expect(preview.rows[0]?.verificationStatus).toBe("needs-review");
  });

  it("rejects missing IDs, negative HP, invalid URLs, and bad statuses", () => {
    const preview = createBulkImportPreview(
      "building-levels",
      [
        "buildingId,buildingName,townHallLevel,level,hp,isSupercharged,superchargeLevel,patchId,sourceUrl,verificationStatus,notes",
        ",Scattershot,18,7,-1,false,,may-2026,not-a-url,unknown,bad",
      ].join("\n"),
      context(),
    );

    expect(preview.rows[0]?.action).toBe("invalid");
    expect(preview.rows[0]?.message).toContain("Building ID is required.");
    expect(preview.rows[0]?.message).toContain("Invalid source URL.");
  });

  it("validates Giant Arrow special rules and rejects invalid JSON", () => {
    const validCsv = createCsv(
      [
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
      [
        [
          "giant-arrow",
          "Giant Arrow",
          18,
          1500,
          "",
          "",
          "",
          {
            targetMultipliers: [
              { targetBuildingId: "air-defense", multiplier: 2 },
            ],
          },
          "may-2026",
          "https://example.com",
          "verified",
          "2x rule",
        ],
      ],
    );
    const valid = createBulkImportPreview(
      "equipment-levels",
      validCsv,
      context(),
    );
    const invalid = createBulkImportPreview(
      "equipment-levels",
      [
        "equipmentId,equipmentName,level,damage,healing,hpIncrease,abilityDescription,specialRules,patchId,sourceUrl,verificationStatus,notes",
        'giant-arrow,Giant Arrow,18,-1,,,,{bad,may-2026,,verified,"bad"',
      ].join("\n"),
      context(),
    );

    expect(valid.rows[0]?.action).toBe("create");
    expect(valid.rows[0]?.data?.kind).toBe("equipment-levels");
    expect(invalid.rows[0]?.action).toBe("invalid");
  });

  it("validates Earthquake percentages", () => {
    const valid = createBulkImportPreview(
      "spell-levels",
      [
        "spellId,spellName,level,damage,damagePercent,repeatDamageRule,patchId,sourceUrl,verificationStatus,notes",
        "earthquake-spell,Earthquake Spell,5,,0.29,diminishing-odd-denominator,may-2026,,needs-review,percent",
      ].join("\n"),
      context(),
    );
    const invalid = createBulkImportPreview(
      "spell-levels",
      [
        "spellId,spellName,level,damage,damagePercent,repeatDamageRule,patchId,sourceUrl,verificationStatus,notes",
        "earthquake-spell,Earthquake Spell,5,,1.2,diminishing-odd-denominator,may-2026,,needs-review,bad",
      ].join("\n"),
      context(),
    );

    expect(valid.rows[0]?.action).toBe("create");
    expect(invalid.rows[0]?.action).toBe("invalid");
  });

  it("marks matching, changed, and missing rows correctly", () => {
    const csv = [
      "buildingId,buildingName,townHallLevel,level,hp,isSupercharged,superchargeLevel,patchId,sourceUrl,verificationStatus,notes",
      "scattershot,Scattershot,18,7,5800,false,,may-2026,,needs-review,same",
    ].join("\n");
    const existing = {
      buildingId: "scattershot",
      townHallLevel: 18,
      level: 7,
      hp: 5800,
      isSupercharged: false,
      patchId: "may-2026",
      verificationStatus: "needs-review" as const,
      notes: "same",
    };

    expect(
      createBulkImportPreview(
        "building-levels",
        csv,
        context({ buildingLevels: [existing] }),
      ).rows[0]?.action,
    ).toBe("unchanged");
    expect(
      createBulkImportPreview(
        "building-levels",
        csv.replace("5800", "5900"),
        context({ buildingLevels: [existing] }),
      ).rows[0]?.action,
    ).toBe("update");
    expect(
      createBulkImportPreview(
        "building-levels",
        csv,
        context(),
      ).rows[0]?.action,
    ).toBe("create");
  });

  it("marks every duplicate matching row invalid", () => {
    const row =
      "scattershot,Scattershot,18,7,5800,false,,may-2026,,needs-review,same";
    const preview = createBulkImportPreview(
      "building-levels",
      [
        "buildingId,buildingName,townHallLevel,level,hp,isSupercharged,superchargeLevel,patchId,sourceUrl,verificationStatus,notes",
        row,
        row,
      ].join("\n"),
      context(),
    );

    expect(preview.rows.every((item) => item.action === "invalid")).toBe(true);
    expect(getActionableBulkImportRows(preview)).toEqual([]);
  });
});

describe("CSV export", () => {
  it("escapes commas and quotes and serializes JSON safely", () => {
    expect(escapeCsvValue('A "quoted", value')).toBe(
      '"A ""quoted"", value"',
    );
    const csv = createCsv(["rules"], [[{ multiplier: 2, target: "air" }]]);
    expect(parseCsv(csv).rows[0]?.values.rules).toBe(
      '{"multiplier":2,"target":"air"}',
    );
  });
});
