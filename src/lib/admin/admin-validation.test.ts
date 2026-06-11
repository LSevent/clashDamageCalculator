import { describe, expect, it } from "vitest";

import {
  parseSpecialRulesJson,
  validateBuildingLevelInput,
  validateEquipmentLevelInput,
  validatePatchInput,
  validateSourceUrl,
  validateSpellLevelInput,
} from "./admin-validation";

describe("admin validation", () => {
  it("accepts HTTP source URLs and rejects unsafe or malformed URLs", () => {
    expect(validateSourceUrl("https://supercell.com/example")).toBe(
      "https://supercell.com/example",
    );
    expect(validateSourceUrl("javascript:alert(1)")).toBeUndefined();
    expect(validateSourceUrl("not-a-url")).toBeUndefined();
  });

  it("requires patch IDs, names, and valid verification statuses", () => {
    const result = validatePatchInput({
      id: "",
      name: "",
      verificationStatus: "unknown",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain("Patch ID is required.");
      expect(result.errors).toContain("Patch name is required.");
      expect(result.errors).toContain(
        "Verification status must be valid.",
      );
    }
  });

  it("rejects negative building HP", () => {
    const result = validateBuildingLevelInput({
      buildingId: "x-bow",
      level: "1",
      townHallLevel: "10",
      hp: "-1",
      verificationStatus: "needs-review",
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative equipment damage", () => {
    const result = validateEquipmentLevelInput({
      equipmentId: "giant-arrow",
      level: "18",
      damage: "-5",
      verificationStatus: "verified",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain(
        "Damage must be a non-negative integer.",
      );
    }
  });

  it("rejects Earthquake percentages outside zero to one", () => {
    const result = validateSpellLevelInput({
      spellId: "earthquake-spell",
      level: "5",
      damagePercent: "1.2",
      verificationStatus: "verified",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain(
        "Damage percent must be between 0 and 1.",
      );
    }
  });

  it("rejects invalid special rules JSON and preserves valid rules", () => {
    expect(parseSpecialRulesJson("{bad json").success).toBe(false);

    const valid = parseSpecialRulesJson(
      '{"targetMultipliers":[{"targetBuildingId":"air-defense","multiplier":2}]}',
    );
    expect(valid.success).toBe(true);
  });
});
