import { describe, expect, it } from "vitest";

import { buildings, CURRENT_PATCH_ID, equipment, patches, spells } from "@/src/data/game";
import type { DataAuditInput } from "@/src/types/game/data-audit";

import { auditGameData } from "./data-audit";

describe("data audit", () => {
  it("counts buildings, equipment, spells, and levels", () => {
    const audit = auditGameData({
      patches,
      buildings,
      equipment,
      spells,
      currentPatchId: CURRENT_PATCH_ID,
    });

    expect(audit.totalBuildings).toBe(buildings.length);
    expect(audit.totalEquipment).toBe(equipment.length);
    expect(audit.totalSpells).toBe(spells.length);
    expect(audit.totalBuildingLevels).toBe(1);
    expect(audit.totalEquipmentLevels).toBe(2);
    expect(audit.totalSpellLevels).toBe(1);
  });

  it("identifies the current patch", () => {
    const audit = auditGameData({
      patches,
      buildings,
      equipment,
      spells,
      currentPatchId: CURRENT_PATCH_ID,
    });

    expect(audit.currentPatch?.id).toBe(CURRENT_PATCH_ID);
  });

  it("counts missing source URLs safely", () => {
    const audit = auditGameData({
      patches,
      buildings,
      equipment,
      spells,
    });

    expect(audit.coverage.withSourceUrl).toBe(1);
    expect(audit.coverage.missingSourceUrl).toBe(3);
  });

  it("handles empty arrays", () => {
    const emptyAudit = auditGameData({
      patches: [],
      buildings: [],
      equipment: [],
      spells: [],
    });

    expect(emptyAudit).toMatchObject({
      totalPatches: 0,
      totalBuildings: 0,
      totalBuildingLevels: 0,
      totalEquipment: 0,
      totalEquipmentLevels: 0,
      totalSpells: 0,
      totalSpellLevels: 0,
      totalLevelEntries: 0,
      partialDataItems: 0,
    });
    expect(emptyAudit.currentPatch).toBeUndefined();
  });

  it("does not mutate input data", () => {
    const fixture: DataAuditInput = {
      patches: structuredClone(patches),
      buildings: structuredClone(buildings),
      equipment: structuredClone(equipment),
      spells: structuredClone(spells),
      currentPatchId: CURRENT_PATCH_ID,
    };
    const beforeAudit = structuredClone(fixture);

    auditGameData(fixture);

    expect(fixture).toEqual(beforeAudit);
  });
});
