"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Prisma, type PrismaClient } from "@/src/generated/prisma/client";
import {
  clearAdminSessionCookie,
  getAdminAuthState,
  setAdminSessionCookie,
  verifyAdminAccessKey,
} from "@/src/lib/admin/admin-auth";
import {
  validateBuildingInput,
  validateBuildingLevelInput,
  validateEquipmentInput,
  validateEquipmentLevelInput,
  validatePatchInput,
  validateSpellInput,
  validateSpellLevelInput,
} from "@/src/lib/admin/admin-validation";
import { getPrismaClient } from "@/src/lib/db/prisma";
import { createBuildingLevelKey } from "@/src/lib/game/db-game-data";

const adminPaths = new Set([
  "/admin",
  "/admin/data",
  "/admin/data/patches",
  "/admin/data/buildings",
  "/admin/data/equipment",
  "/admin/data/spells",
]);

function formRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function safeReturnPath(formData: FormData, fallback: string) {
  const returnTo = formData.get("returnTo");
  return typeof returnTo === "string" && adminPaths.has(returnTo)
    ? returnTo
    : fallback;
}

function redirectWith(
  path: string,
  type: "message" | "error",
  text: string,
): never {
  const params = new URLSearchParams({ [type]: text });
  redirect(`${path}?${params.toString()}`);
}

async function requireAdmin(path: string) {
  const state = await getAdminAuthState();

  if (!state.authenticated) {
    redirectWith(path, "error", "Admin access required.");
  }
}

function getDatabase(path: string): PrismaClient {
  const prisma = getPrismaClient();

  if (!prisma) {
    redirectWith(path, "error", "Database is unavailable.");
  }

  return prisma;
}

function mutationErrorMessage(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A record with the same unique values already exists.";
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2025")
  ) {
    return "A referenced record could not be found.";
  }

  return "Database is unavailable.";
}

async function requireExistingPatch(
  path: string,
  patchId: string | undefined,
) {
  if (!patchId) {
    return;
  }

  let patch: { id: string } | null;

  try {
    patch = await getDatabase(path).patch.findUnique({
      where: { id: patchId },
      select: { id: true },
    });
  } catch {
    redirectWith(path, "error", "Database is unavailable.");
  }

  if (!patch) {
    redirectWith(path, "error", "Selected patch does not exist.");
  }
}

function refreshPublicData() {
  revalidatePath("/calculator");
  revalidatePath("/data-manager");
  revalidatePath("/api/data-source-health");
}

export async function loginAdminAction(formData: FormData) {
  const state = await getAdminAuthState();

  if (!state.configured) {
    redirectWith(
      "/admin",
      "error",
      "Admin editor is not configured. Set ADMIN_ACCESS_KEY to enable it.",
    );
  }

  const accessKey = formData.get("accessKey");

  if (
    typeof accessKey !== "string" ||
    !verifyAdminAccessKey(accessKey.trim())
  ) {
    redirectWith("/admin", "error", "Invalid admin access key.");
  }

  await setAdminSessionCookie();
  redirectWith("/admin", "message", "Admin access granted.");
}

export async function logoutAdminAction() {
  await clearAdminSessionCookie();
  redirectWith("/admin", "message", "Admin session ended.");
}

export async function savePatchAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/patches");
  await requireAdmin(path);
  const result = validatePatchInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    name: result.data.name,
    releaseDate: result.data.releaseDate
      ? new Date(`${result.data.releaseDate}T00:00:00.000Z`)
      : null,
    sourceUrl: result.data.sourceUrl ?? null,
    notes: result.data.notes ?? null,
    isCurrent: result.data.isCurrent,
    verificationStatus: result.data.verificationStatus,
    verifiedAt: result.data.verifiedAt
      ? new Date(`${result.data.verifiedAt}T00:00:00.000Z`)
      : null,
  };

  try {
    await prisma.$transaction(async (transaction) => {
      if (result.data.isCurrent) {
        await transaction.patch.updateMany({
          where: {
            isCurrent: true,
            id: { not: result.data.id },
          },
          data: { isCurrent: false },
        });
      }

      if (typeof recordId === "string" && recordId) {
        await transaction.patch.update({
          where: { id: recordId },
          data,
        });
      } else {
        await transaction.patch.create({
          data: {
            id: result.data.id,
            ...data,
          },
        });
      }
    });
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Patch saved.");
}

export async function saveBuildingAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/buildings");
  await requireAdmin(path);
  const result = validateBuildingInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    dataId: result.data.dataId ?? null,
    name: result.data.name,
    village: result.data.village,
    category: result.data.category,
    targetType: result.data.targetType,
    canBeSupercharged: result.data.canBeSupercharged,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.building.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.building.create({
        data: {
          id: result.data.id,
          ...data,
        },
      });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Building saved.");
}

export async function saveBuildingLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/buildings");
  await requireAdmin(path);
  const result = validateBuildingLevelInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }
  await requireExistingPatch(path, result.data.patchId);

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    buildingId: result.data.buildingId,
    levelKey: createBuildingLevelKey(
      result.data.buildingId,
      result.data.level,
      result.data.townHallLevel,
      result.data.isSupercharged,
      result.data.superchargeLevel,
    ),
    level: result.data.level,
    townHallLevel: result.data.townHallLevel,
    hp: result.data.hp ?? null,
    patchId: result.data.patchId ?? null,
    sourceUrl: result.data.sourceUrl ?? null,
    isSupercharged: result.data.isSupercharged,
    superchargeLevel: result.data.superchargeLevel ?? null,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes ?? null,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.buildingLevel.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.buildingLevel.create({ data });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Building level saved.");
}

export async function deleteBuildingLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/buildings");
  await requireAdmin(path);
  const id = formData.get("recordId");

  if (typeof id !== "string" || !id) {
    redirectWith(path, "error", "Building level could not be found.");
  }

  try {
    await getDatabase(path).buildingLevel.delete({ where: { id } });
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Building level deleted.");
}

export async function saveEquipmentAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/equipment");
  await requireAdmin(path);
  const result = validateEquipmentInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }
  await requireExistingPatch(path, result.data.patchId);

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    dataId: result.data.dataId ?? null,
    name: result.data.name,
    hero: result.data.hero,
    rarity: result.data.rarity,
    category: result.data.category ?? null,
    patchId: result.data.patchId ?? null,
    sourceUrls:
      result.data.sourceUrls.length > 0
        ? (result.data.sourceUrls as Prisma.InputJsonValue)
        : Prisma.DbNull,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes ?? null,
    calculatorEnabled: result.data.calculatorEnabled,
    defaultLevel: result.data.defaultLevel ?? null,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.equipment.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.equipment.create({
        data: {
          id: result.data.id,
          ...data,
        },
      });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Equipment saved.");
}

export async function saveEquipmentLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/equipment");
  await requireAdmin(path);
  const result = validateEquipmentLevelInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }
  await requireExistingPatch(path, result.data.patchId);

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    equipmentId: result.data.equipmentId,
    level: result.data.level,
    damage: result.data.damage ?? null,
    damagePerSecond: result.data.damagePerSecond ?? null,
    regeneration: result.data.regeneration ?? null,
    healing: result.data.healing ?? null,
    hpIncrease: result.data.hpIncrease ?? null,
    abilityDescription: result.data.abilityDescription ?? null,
    specialRules:
      result.data.specialRules === undefined
        ? Prisma.DbNull
        : (result.data.specialRules as Prisma.InputJsonValue),
    patchId: result.data.patchId ?? null,
    sourceUrl: result.data.sourceUrl ?? null,
    sourceType: result.data.sourceType ?? null,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes ?? null,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.equipmentLevel.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.equipmentLevel.create({ data });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Equipment level saved.");
}

export async function deleteEquipmentLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/equipment");
  await requireAdmin(path);
  const id = formData.get("recordId");

  if (typeof id !== "string" || !id) {
    redirectWith(path, "error", "Equipment level could not be found.");
  }

  try {
    await getDatabase(path).equipmentLevel.delete({ where: { id } });
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Equipment level deleted.");
}

export async function saveSpellAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/spells");
  await requireAdmin(path);
  const result = validateSpellInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }
  await requireExistingPatch(path, result.data.patchId);

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    dataId: result.data.dataId ?? null,
    name: result.data.name,
    village: result.data.village,
    spellType: result.data.spellType,
    housingSpace: result.data.housingSpace ?? null,
    patchId: result.data.patchId ?? null,
    sourceUrls:
      result.data.sourceUrls.length > 0
        ? (result.data.sourceUrls as Prisma.InputJsonValue)
        : Prisma.DbNull,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes ?? null,
    calculatorEnabled: result.data.calculatorEnabled,
    defaultLevel: result.data.defaultLevel ?? null,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.spell.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.spell.create({
        data: {
          id: result.data.id,
          ...data,
        },
      });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Spell saved.");
}

export async function saveSpellLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/spells");
  await requireAdmin(path);
  const result = validateSpellLevelInput(formRecord(formData));

  if (!result.success) {
    redirectWith(path, "error", result.errors.join(" "));
  }
  await requireExistingPatch(path, result.data.patchId);

  const prisma = getDatabase(path);
  const recordId = formData.get("recordId");
  const data = {
    spellId: result.data.spellId,
    level: result.data.level,
    damage: result.data.damage ?? null,
    damagePercent: result.data.damagePercent ?? null,
    repeatDamageRule: result.data.repeatDamageRule ?? null,
    patchId: result.data.patchId ?? null,
    sourceUrl: result.data.sourceUrl ?? null,
    sourceType: result.data.sourceType ?? null,
    verificationStatus: result.data.verificationStatus,
    notes: result.data.notes ?? null,
  };

  try {
    if (typeof recordId === "string" && recordId) {
      await prisma.spellLevel.update({
        where: { id: recordId },
        data,
      });
    } else {
      await prisma.spellLevel.create({ data });
    }
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Spell level saved.");
}

export async function deleteSpellLevelAction(formData: FormData) {
  const path = safeReturnPath(formData, "/admin/data/spells");
  await requireAdmin(path);
  const id = formData.get("recordId");

  if (typeof id !== "string" || !id) {
    redirectWith(path, "error", "Spell level could not be found.");
  }

  try {
    await getDatabase(path).spellLevel.delete({ where: { id } });
  } catch (error) {
    redirectWith(path, "error", mutationErrorMessage(error));
  }

  refreshPublicData();
  revalidatePath(path);
  redirectWith(path, "message", "Spell level deleted.");
}
