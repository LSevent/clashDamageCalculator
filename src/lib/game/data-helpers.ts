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
  return (
    patches.find((patch) => patch.id === CURRENT_PATCH_ID) ??
    patches.find((patch) => patch.isCurrent)
  );
}

export function getBuildingById(id: string): BuildingDefinition | undefined {
  return buildings.find((building) => building.id === id);
}

export function getEquipmentById(id: string): EquipmentDefinition | undefined {
  return equipment.find((item) => item.id === id);
}

export function getSpellById(id: string): SpellDefinition | undefined {
  return spells.find((spell) => spell.id === id);
}

export function getBuildingLevelsByTownHall(
  buildingId: string,
  townHallLevel: number,
): readonly BuildingLevel[] {
  const building = getBuildingById(buildingId);

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
  return getEquipmentById(equipmentId)?.levels.find(
    (equipmentLevel) => equipmentLevel.level === level,
  );
}

export function getSpellLevel(
  spellId: string,
  level: number,
): SpellLevel | undefined {
  return getSpellById(spellId)?.levels.find(
    (spellLevel) => spellLevel.level === level,
  );
}

