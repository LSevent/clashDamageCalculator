import {
  buildings,
  CURRENT_PATCH_ID,
  equipment,
  patches,
  spells,
} from "@/src/data/game";
import type {
  BuildingDefinition,
  BuildingLevel,
  EquipmentDefinition,
  EquipmentLevel,
  PatchInfo,
  SpellDefinition,
  SpellLevel,
} from "@/src/types/game/game-data";

export function getCurrentPatch(): PatchInfo | undefined {
  return getCurrentPatchFromData(patches, CURRENT_PATCH_ID);
}

export function getCurrentPatchFromData(
  patchData: readonly PatchInfo[],
  currentPatchId?: string,
): PatchInfo | undefined {
  return (
    patchData.find((patch) => patch.id === currentPatchId) ??
    patchData.find((patch) => patch.isCurrent)
  );
}

export function getBuildingById(id: string): BuildingDefinition | undefined {
  return getBuildingByIdFromData(buildings, id);
}

export function getBuildingByIdFromData(
  buildingData: readonly BuildingDefinition[],
  id: string,
): BuildingDefinition | undefined {
  return buildingData.find((building) => building.id === id);
}

export function getEquipmentById(id: string): EquipmentDefinition | undefined {
  return getEquipmentByIdFromData(equipment, id);
}

export function getEquipmentByIdFromData(
  equipmentData: readonly EquipmentDefinition[],
  id: string,
): EquipmentDefinition | undefined {
  return equipmentData.find((item) => item.id === id);
}

export function getSpellById(id: string): SpellDefinition | undefined {
  return getSpellByIdFromData(spells, id);
}

export function getSpellByIdFromData(
  spellData: readonly SpellDefinition[],
  id: string,
): SpellDefinition | undefined {
  return spellData.find((spell) => spell.id === id);
}

export function getBuildingLevelsByTownHall(
  buildingId: string,
  townHallLevel: number,
): readonly BuildingLevel[] {
  return getBuildingLevelsByTownHallFromData(
    buildings,
    buildingId,
    townHallLevel,
  );
}

export function getBuildingLevelsByTownHallFromData(
  buildingData: readonly BuildingDefinition[],
  buildingId: string,
  townHallLevel: number,
): readonly BuildingLevel[] {
  const building = getBuildingByIdFromData(buildingData, buildingId);

  if (!building) {
    return [];
  }

  return building.levels.filter(
    (buildingLevel) => buildingLevel.townHallLevel === townHallLevel,
  );
}

export function getEquipmentLevel(
  equipmentId: string,
  level: number,
): EquipmentLevel | undefined {
  return getEquipmentLevelFromData(equipment, equipmentId, level);
}

export function getEquipmentLevelFromData(
  equipmentData: readonly EquipmentDefinition[],
  equipmentId: string,
  level: number,
): EquipmentLevel | undefined {
  return getEquipmentByIdFromData(equipmentData, equipmentId)?.levels.find(
    (equipmentLevel) => equipmentLevel.level === level,
  );
}

export function getSpellLevel(
  spellId: string,
  level: number,
): SpellLevel | undefined {
  return getSpellLevelFromData(spells, spellId, level);
}

export function getSpellLevelFromData(
  spellData: readonly SpellDefinition[],
  spellId: string,
  level: number,
): SpellLevel | undefined {
  return getSpellByIdFromData(spellData, spellId)?.levels.find(
    (spellLevel) => spellLevel.level === level,
  );
}
