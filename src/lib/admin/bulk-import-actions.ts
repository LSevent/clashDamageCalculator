"use server";

import { revalidatePath } from "next/cache";

import {
  Prisma,
  type PrismaClient,
} from "@/src/generated/prisma/client";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  createBulkImportPreview,
  getActionableBulkImportRows,
  isBulkImportType,
} from "./bulk-import";
import { getPrismaClient } from "@/src/lib/db/prisma";
import { createBuildingLevelKey } from "@/src/lib/game/db-game-data";
import type {
  BulkImportActionState,
  BulkImportContext,
  BulkImportPreview,
} from "@/src/types/admin-bulk-import";

function normalizeJson(value: unknown) {
  return value === null ? undefined : value;
}

async function createContext(
  prisma: PrismaClient,
): Promise<BulkImportContext> {
  const [
    buildings,
    equipment,
    spells,
    patches,
    buildingLevels,
    equipmentLevels,
    spellLevels,
  ] = await Promise.all([
    prisma.building.findMany({ select: { id: true } }),
    prisma.equipment.findMany({ select: { id: true } }),
    prisma.spell.findMany({ select: { id: true } }),
    prisma.patch.findMany({ select: { id: true } }),
    prisma.buildingLevel.findMany(),
    prisma.equipmentLevel.findMany(),
    prisma.spellLevel.findMany(),
  ]);

  return {
    buildingIds: new Set(buildings.map((item) => item.id)),
    equipmentIds: new Set(equipment.map((item) => item.id)),
    spellIds: new Set(spells.map((item) => item.id)),
    patchIds: new Set(patches.map((item) => item.id)),
    buildingLevels: buildingLevels
      .filter(
        (row) => row.townHallLevel !== null && row.hp !== null,
      )
      .map((row) => ({
        buildingId: row.buildingId,
        townHallLevel: row.townHallLevel as number,
        level: row.level,
        hp: row.hp as number,
        isSupercharged: row.isSupercharged,
        superchargeLevel: row.superchargeLevel ?? undefined,
        patchId: row.patchId ?? undefined,
        sourceUrl: row.sourceUrl ?? undefined,
        verificationStatus:
          (row.verificationStatus as
            | "draft"
            | "pending-review"
            | "partial"
            | "verified"
            | "needs-review"
            | "rejected"
            | null) ?? "needs-review",
        notes: row.notes ?? undefined,
      })),
    equipmentLevels: equipmentLevels.map((row) => ({
      equipmentId: row.equipmentId,
      level: row.level,
      damage: row.damage ?? undefined,
      healing: row.healing ?? undefined,
      hpIncrease: row.hpIncrease ?? undefined,
      abilityDescription: row.abilityDescription ?? undefined,
      specialRules: normalizeJson(row.specialRules),
      patchId: row.patchId ?? undefined,
      sourceUrl: row.sourceUrl ?? undefined,
      verificationStatus:
        (row.verificationStatus as
          | "draft"
          | "pending-review"
          | "partial"
          | "verified"
          | "needs-review"
          | "rejected"
          | null) ?? "needs-review",
      notes: row.notes ?? undefined,
    })),
    spellLevels: spellLevels.map((row) => ({
      spellId: row.spellId,
      level: row.level,
      damage: row.damage ?? undefined,
      damagePercent: row.damagePercent ?? undefined,
      repeatDamageRule:
        row.repeatDamageRule === "diminishing-odd-denominator"
          ? row.repeatDamageRule
          : undefined,
      patchId: row.patchId ?? undefined,
      sourceUrl: row.sourceUrl ?? undefined,
      verificationStatus:
        (row.verificationStatus as
          | "draft"
          | "pending-review"
          | "partial"
          | "verified"
          | "needs-review"
          | "rejected"
          | null) ?? "needs-review",
      notes: row.notes ?? undefined,
    })),
  };
}

async function requireBulkAdmin(): Promise<
  { ok: true; prisma: PrismaClient } | { ok: false; state: BulkImportActionState }
> {
  const auth = await getAdminAuthState();
  if (!auth.authenticated) {
    return {
      ok: false,
      state: { ok: false, error: "Admin access required." },
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return {
      ok: false,
      state: { ok: false, error: "Database is unavailable." },
    };
  }

  return { ok: true, prisma };
}

async function buildPreview(
  formData: FormData,
): Promise<
  | { ok: true; preview: BulkImportPreview; prisma: PrismaClient }
  | { ok: false; state: BulkImportActionState }
> {
  const access = await requireBulkAdmin();
  if (!access.ok) {
    return access;
  }

  const type = formData.get("type");
  const csv = formData.get("csv");
  if (!isBulkImportType(type)) {
    return {
      ok: false,
      state: { ok: false, error: "Select a valid import type." },
    };
  }
  if (typeof csv !== "string" || !csv.trim()) {
    return {
      ok: false,
      state: { ok: false, error: "Paste or upload CSV before previewing." },
    };
  }

  try {
    const context = await createContext(access.prisma);
    return {
      ok: true,
      preview: createBulkImportPreview(type, csv, context),
      prisma: access.prisma,
    };
  } catch {
    return {
      ok: false,
      state: { ok: false, error: "Database is unavailable." },
    };
  }
}

export async function previewBulkImportAction(
  formData: FormData,
): Promise<BulkImportActionState> {
  const result = await buildPreview(formData);
  if (!result.ok) {
    return result.state;
  }

  return {
    ok: result.preview.parseErrors.length === 0,
    error:
      result.preview.parseErrors.length > 0
        ? result.preview.parseErrors.join(" ")
        : undefined,
    preview: result.preview,
  };
}

export async function commitBulkImportAction(
  formData: FormData,
): Promise<BulkImportActionState> {
  if (formData.get("reviewed") !== "true") {
    return {
      ok: false,
      error: "Confirm that you reviewed the preview before importing.",
    };
  }

  const result = await buildPreview(formData);
  if (!result.ok) {
    return result.state;
  }

  const { preview, prisma } = result;
  if (preview.parseErrors.length > 0) {
    return {
      ok: false,
      error: preview.parseErrors.join(" "),
      preview,
    };
  }

  const actionableRows = getActionableBulkImportRows(preview);

  try {
    await prisma.$transaction(async (transaction) => {
      for (const row of actionableRows) {
        const data = row.data;
        if (!data) {
          continue;
        }

        if (data.kind === "building-levels") {
          const levelKey = createBuildingLevelKey(
            data.buildingId,
            data.level,
            data.townHallLevel,
            data.isSupercharged,
            data.superchargeLevel,
          );
          await transaction.buildingLevel.upsert({
            where: { levelKey },
            create: {
              levelKey,
              buildingId: data.buildingId,
              townHallLevel: data.townHallLevel,
              level: data.level,
              hp: data.hp,
              isSupercharged: data.isSupercharged,
              superchargeLevel: data.superchargeLevel ?? null,
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
            update: {
              hp: data.hp,
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
          });
        } else if (data.kind === "equipment-levels") {
          await transaction.equipmentLevel.upsert({
            where: {
              equipmentId_level: {
                equipmentId: data.equipmentId,
                level: data.level,
              },
            },
            create: {
              equipmentId: data.equipmentId,
              level: data.level,
              damage: data.damage ?? null,
              healing: data.healing ?? null,
              hpIncrease: data.hpIncrease ?? null,
              abilityDescription: data.abilityDescription ?? null,
              specialRules:
                data.specialRules === undefined
                  ? Prisma.DbNull
                  : (data.specialRules as Prisma.InputJsonValue),
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
            update: {
              damage: data.damage ?? null,
              healing: data.healing ?? null,
              hpIncrease: data.hpIncrease ?? null,
              abilityDescription: data.abilityDescription ?? null,
              specialRules:
                data.specialRules === undefined
                  ? Prisma.DbNull
                  : (data.specialRules as Prisma.InputJsonValue),
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
          });
        } else {
          await transaction.spellLevel.upsert({
            where: {
              spellId_level: {
                spellId: data.spellId,
                level: data.level,
              },
            },
            create: {
              spellId: data.spellId,
              level: data.level,
              damage: data.damage ?? null,
              damagePercent: data.damagePercent ?? null,
              repeatDamageRule: data.repeatDamageRule ?? null,
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
            update: {
              damage: data.damage ?? null,
              damagePercent: data.damagePercent ?? null,
              repeatDamageRule: data.repeatDamageRule ?? null,
              patchId: data.patchId ?? null,
              sourceUrl: data.sourceUrl ?? null,
              verificationStatus: data.verificationStatus,
              notes: data.notes ?? null,
            },
          });
        }
      }
    });
  } catch {
    return {
      ok: false,
      error: "Database import failed. No changes were applied.",
      preview,
    };
  }

  revalidatePath("/calculator");
  revalidatePath("/data-manager");
  revalidatePath("/api/data-source-health");
  revalidatePath("/admin/data");
  revalidatePath("/admin/data/import-export");

  return {
    ok: true,
    preview,
    result: {
      created: preview.summary.newRows,
      updated: preview.summary.updateRows,
      unchanged: preview.summary.unchangedRows,
      invalid: preview.summary.invalidRows,
      skipped: preview.summary.skippedRows,
    },
  };
}
