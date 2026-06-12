import { describe, expect, it } from "vitest";

import {
  matchParsedStatChange,
  suggestionDuplicateKey,
} from "./stat-change-comparison";
import { parseStatChangeText } from "./stat-change-parser";
import {
  canApplyStatChange,
  canTransitionStatChangeStatus,
  validateStatChangeSuggestion,
} from "./stat-change-validation";

describe("stat change parser", () => {
  it("parses a simple equipment damage line", () => {
    const result = parseStatChangeText(
      "Giant Arrow Level 18 damage: 1500",
    );

    expect(result.candidates[0]).toMatchObject({
      targetName: "Giant Arrow",
      level: 18,
      fieldName: "damage",
      suggestedValue: 1500,
    });
  });

  it("parses the official-table style without a separator", () => {
    const result = parseStatChangeText(
      "Rocket Backpack Level 21 penetrating damage 1875",
    );

    expect(result.candidates[0]).toMatchObject({
      targetName: "Rocket Backpack",
      level: 21,
      fieldName: "damage",
      suggestedValue: 1875,
    });
  });

  it("parses a spell damage percent table", () => {
    const result = parseStatChangeText(
      [
        "item,level,field,newValue,targetKind",
        "Earthquake Spell,5,damagePercent,0.29,spell-level",
      ].join("\n"),
    );

    expect(result.candidates[0]).toMatchObject({
      targetKind: "spell-level",
      fieldName: "damagePercent",
      suggestedValue: 0.29,
    });
  });

  it("requests a hint instead of inventing missing values", () => {
    const result = parseStatChangeText(
      "Several defenses received balance changes.",
    );

    expect(result.candidates).toEqual([]);
    expect(result.needsHint).toBe(true);
  });
});

describe("stat change matching and comparison", () => {
  it("captures the old value for an existing row", () => {
    const candidate = parseStatChangeText(
      "Giant Arrow Level 18 damage: 1500",
    ).candidates[0]!;
    const matched = matchParsedStatChange(candidate, {
      items: [
        {
          id: "giant-arrow",
          name: "Giant Arrow",
          kind: "equipment-level",
          levels: [{ level: 18, values: { damage: 1750 } }],
        },
      ],
    });

    expect(matched).toMatchObject({
      targetId: "giant-arrow",
      oldValue: 1750,
      suggestedValue: 1500,
      confidence: "high",
    });
  });

  it("marks an unmatched target low confidence without inventing an ID", () => {
    const candidate = parseStatChangeText(
      "Unknown Gear Level 3 damage: 500",
    ).candidates[0]!;
    const matched = matchParsedStatChange(candidate, { items: [] });

    expect(matched.targetId).toBeUndefined();
    expect(matched.oldValue).toBeNull();
    expect(matched.confidence).toBe("low");
    expect(matched.parserNotes).toContain("could not be matched");
  });

  it("creates stable duplicate keys", () => {
    const input = {
      patchId: "may-update",
      targetKind: "equipment-level",
      targetId: "giant-arrow",
      level: 18,
      fieldName: "specialRules",
      suggestedValue: { multiplier: 2, target: "air-defense" },
    };

    expect(suggestionDuplicateKey(input)).toBe(
      suggestionDuplicateKey({
        ...input,
        suggestedValue: { target: "air-defense", multiplier: 2 },
      }),
    );
    expect(
      suggestionDuplicateKey({
        patchId: "may-update",
        targetKind: "patch-note-hint",
        targetName: "Review",
        suggestedValue: undefined,
      }),
    ).toBe(
      suggestionDuplicateKey({
        patchId: "may-update",
        targetKind: "patch-note-hint",
        targetName: "Review",
        suggestedValue: null,
      }),
    );
  });
});

describe("stat change validation and status flow", () => {
  it("validates numeric fields and allows hints without final values", () => {
    expect(
      validateStatChangeSuggestion({
        targetKind: "building-level",
        targetId: "scattershot",
        level: 7,
        townHallLevel: 18,
        fieldName: "hp",
        finalValue: -1,
      }).success,
    ).toBe(false);
    expect(
      validateStatChangeSuggestion({
        targetKind: "spell-level",
        targetId: "earthquake-spell",
        level: 5,
        fieldName: "damagePercent",
        finalValue: 1.2,
      }).success,
    ).toBe(false);
    expect(
      validateStatChangeSuggestion({
        targetKind: "patch-note-hint",
      }).success,
    ).toBe(true);
    expect(
      validateStatChangeSuggestion({
        targetKind: "equipment-level",
        targetId: "giant-arrow",
        level: 18,
        fieldName: "specialRules",
        finalValue: "not-json",
      }).success,
    ).toBe(false);
    expect(
      validateStatChangeSuggestion({
        targetKind: "building-level",
        targetId: "scattershot",
        level: 7,
        townHallLevel: 18,
        fieldName: "damage",
        finalValue: 100,
      }).success,
    ).toBe(false);
  });

  it("enforces approval and apply lifecycle", () => {
    expect(
      canTransitionStatChangeStatus("pending-review", "approved"),
    ).toBe(true);
    expect(canApplyStatChange("approved", "equipment-level")).toBe(true);
    expect(canApplyStatChange("rejected", "equipment-level")).toBe(false);
    expect(canApplyStatChange("approved", "patch-note-hint")).toBe(false);
    expect(canApplyStatChange("applied", "equipment-level")).toBe(false);
  });
});
