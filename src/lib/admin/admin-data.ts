import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { getPrismaClient } from "@/src/lib/db/prisma";
import type { AdminDataSummary } from "@/src/types/admin";

export type AdminPatchRow = Prisma.PatchGetPayload<Record<string, never>>;
export type AdminBuildingRow = Prisma.BuildingGetPayload<{
  include: { levels: true };
}>;
export type AdminEquipmentRow = Prisma.EquipmentGetPayload<{
  include: { levels: true };
}>;
export type AdminSpellRow = Prisma.SpellGetPayload<{
  include: { levels: true };
}>;

export type AdminDatabaseResult<T> =
  | {
      available: true;
      data: T;
    }
  | {
      available: false;
      message: string;
    };

const unavailableMessage =
  "Database is unavailable. Admin editing requires database access.";

function unavailable<T>(): AdminDatabaseResult<T> {
  return {
    available: false,
    message: unavailableMessage,
  };
}

function hasSourceUrls(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((url) => typeof url === "string" && url.trim())
  );
}

function needsAttention(status: string | null) {
  return (
    status === "partial" ||
    status === "needs-review" ||
    status === "draft" ||
    status === "pending-review" ||
    status === null
  );
}

export async function getAdminDataSummary(): Promise<
  AdminDatabaseResult<AdminDataSummary>
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return unavailable();
  }

  try {
    const [patches, buildings, equipment, spells] = await Promise.all([
      prisma.patch.findMany({
        select: {
          sourceUrl: true,
          verificationStatus: true,
        },
      }),
      prisma.building.findMany({
        select: {
          levels: {
            select: {
              sourceUrl: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.equipment.findMany({
        select: {
          sourceUrls: true,
          verificationStatus: true,
          levels: {
            select: {
              sourceUrl: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.spell.findMany({
        select: {
          sourceUrls: true,
          verificationStatus: true,
          levels: {
            select: {
              sourceUrl: true,
              verificationStatus: true,
            },
          },
        },
      }),
    ]);
    const buildingLevels = buildings.flatMap((building) => building.levels);
    const equipmentLevels = equipment.flatMap((item) => item.levels);
    const spellLevels = spells.flatMap((spell) => spell.levels);
    const statuses = [
      ...patches.map((patch) => patch.verificationStatus),
      ...buildingLevels.map((level) => level.verificationStatus),
      ...equipment.map((item) => item.verificationStatus),
      ...equipmentLevels.map((level) => level.verificationStatus),
      ...spells.map((spell) => spell.verificationStatus),
      ...spellLevels.map((level) => level.verificationStatus),
    ];

    return {
      available: true,
      data: {
        patches: patches.length,
        buildings: buildings.length,
        buildingLevels: buildingLevels.length,
        equipment: equipment.length,
        equipmentLevels: equipmentLevels.length,
        spells: spells.length,
        spellLevels: spellLevels.length,
        partialOrNeedsReview: statuses.filter(needsAttention).length,
        missingSourceUrls:
          patches.filter((patch) => !patch.sourceUrl?.trim()).length +
          buildingLevels.filter((level) => !level.sourceUrl?.trim()).length +
          equipment.filter((item) => !hasSourceUrls(item.sourceUrls)).length +
          equipmentLevels.filter((level) => !level.sourceUrl?.trim()).length +
          spells.filter((spell) => !hasSourceUrls(spell.sourceUrls)).length +
          spellLevels.filter((level) => !level.sourceUrl?.trim()).length,
      },
    };
  } catch {
    return unavailable();
  }
}

export async function getAdminPatches(): Promise<
  AdminDatabaseResult<readonly AdminPatchRow[]>
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return unavailable();
  }

  try {
    return {
      available: true,
      data: await prisma.patch.findMany({
        orderBy: [{ isCurrent: "desc" }, { releaseDate: "desc" }],
      }),
    };
  } catch {
    return unavailable();
  }
}

export async function getAdminBuildings(): Promise<
  AdminDatabaseResult<readonly AdminBuildingRow[]>
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return unavailable();
  }

  try {
    return {
      available: true,
      data: await prisma.building.findMany({
        include: {
          levels: {
            orderBy: [
              { townHallLevel: "asc" },
              { level: "asc" },
              { superchargeLevel: "asc" },
            ],
          },
        },
        orderBy: { name: "asc" },
      }),
    };
  } catch {
    return unavailable();
  }
}

export async function getAdminEquipment(): Promise<
  AdminDatabaseResult<readonly AdminEquipmentRow[]>
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return unavailable();
  }

  try {
    return {
      available: true,
      data: await prisma.equipment.findMany({
        include: {
          levels: {
            orderBy: { level: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
    };
  } catch {
    return unavailable();
  }
}

export async function getAdminSpells(): Promise<
  AdminDatabaseResult<readonly AdminSpellRow[]>
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return unavailable();
  }

  try {
    return {
      available: true,
      data: await prisma.spell.findMany({
        include: {
          levels: {
            orderBy: { level: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
    };
  } catch {
    return unavailable();
  }
}
