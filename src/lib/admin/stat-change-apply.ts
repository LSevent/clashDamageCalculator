import "server-only";

import { Prisma, type PrismaClient } from "@/src/generated/prisma/client";
import {
  canApplyStatChange,
  validateStatChangeSuggestion,
} from "@/src/lib/admin/stat-change-validation";
import { createBuildingLevelKey } from "@/src/lib/game/db-game-data";
import type {
  StatChangeFieldName,
  StatChangeStatus,
  StatChangeTargetKind,
} from "@/src/types/admin-stat-change";

const allowedFields: Record<
  Exclude<StatChangeTargetKind, "patch-note-hint">,
  readonly StatChangeFieldName[]
> = {
  "building-level": ["hp", "notes"],
  "equipment-level": [
    "damage",
    "healing",
    "hpIncrease",
    "specialRules",
    "abilityDescription",
    "notes",
  ],
  "spell-level": [
    "damage",
    "damagePercent",
    "repeatDamageRule",
    "notes",
  ],
};

function jsonInput(value: unknown) {
  return value === null
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

export async function applyApprovedStatChange(
  prisma: PrismaClient,
  suggestionId: string,
): Promise<{ ok: boolean; message: string }> {
  const suggestion = await prisma.statChangeSuggestion.findUnique({
    where: { id: suggestionId },
    include: { patch: true },
  });

  if (!suggestion) {
    return { ok: false, message: "Suggestion could not be found." };
  }
  if (
    !canApplyStatChange(
      suggestion.status as StatChangeStatus,
      suggestion.targetKind,
    )
  ) {
    return suggestion.targetKind === "patch-note-hint"
      ? {
          ok: false,
          message: "Review hints cannot be applied as stat changes.",
        }
      : {
          ok: false,
          message: "Only approved suggestions can be applied.",
        };
  }
  if (
    !suggestion.targetId ||
    !suggestion.level ||
    !suggestion.fieldName ||
    suggestion.finalValue === null
  ) {
    return {
      ok: false,
      message: "Suggestion is missing required target or final value data.",
    };
  }

  const targetKind = suggestion.targetKind as Exclude<
    StatChangeTargetKind,
    "patch-note-hint"
  >;
  const fieldName = suggestion.fieldName as StatChangeFieldName;
  const validation = validateStatChangeSuggestion({
    targetKind,
    targetId: suggestion.targetId,
    targetName: suggestion.targetName ?? undefined,
    level: suggestion.level,
    townHallLevel: suggestion.townHallLevel ?? undefined,
    isSupercharged: suggestion.isSupercharged ?? undefined,
    superchargeLevel: suggestion.superchargeLevel ?? undefined,
    fieldName,
    finalValue: suggestion.finalValue,
    verificationStatus:
      suggestion.verificationStatus as
        | "draft"
        | "pending-review"
        | "partial"
        | "verified"
        | "needs-review"
        | "rejected"
        | undefined,
    notes: suggestion.notes ?? undefined,
  });

  if (
    !allowedFields[targetKind]?.includes(fieldName) ||
    !validation.success
  ) {
    return {
      ok: false,
      message: validation.success
        ? "Field is not supported for this target kind."
        : validation.errors.join(" "),
    };
  }

  const sourceUrl = suggestion.sourceUrl ?? suggestion.patch.sourceUrl;
  const verificationStatus =
    suggestion.verificationStatus ?? "pending-review";
  const sourceType = sourceUrl ? "official" : "manual";
  const metadata = {
    patchId: suggestion.patchId,
    sourceUrl,
    verificationStatus,
  };

  try {
    await prisma.$transaction(async (transaction) => {
      if (targetKind === "building-level") {
        if (!suggestion.townHallLevel) {
          throw new Error("Town Hall level is required.");
        }
        const building = await transaction.building.findUnique({
          where: { id: suggestion.targetId! },
          select: { id: true },
        });
        if (!building) {
          throw new Error("Base building does not exist.");
        }

        const levelKey = createBuildingLevelKey(
          suggestion.targetId!,
          suggestion.level!,
          suggestion.townHallLevel,
          suggestion.isSupercharged ?? false,
          suggestion.superchargeLevel ?? undefined,
        );
        const valueData =
          fieldName === "hp"
            ? { hp: suggestion.finalValue as number }
            : { notes: String(suggestion.finalValue) };

        await transaction.buildingLevel.upsert({
          where: { levelKey },
          create: {
            levelKey,
            buildingId: suggestion.targetId!,
            level: suggestion.level!,
            townHallLevel: suggestion.townHallLevel,
            isSupercharged: suggestion.isSupercharged ?? false,
            superchargeLevel: suggestion.superchargeLevel,
            hp: fieldName === "hp" ? (suggestion.finalValue as number) : null,
            notes:
              fieldName === "notes"
                ? String(suggestion.finalValue)
                : suggestion.notes,
            ...metadata,
          },
          update: {
            ...valueData,
            ...metadata,
            ...(suggestion.notes && fieldName !== "notes"
              ? { notes: suggestion.notes }
              : {}),
          },
        });
      } else if (targetKind === "equipment-level") {
        const equipment = await transaction.equipment.findUnique({
          where: { id: suggestion.targetId! },
          select: { id: true },
        });
        if (!equipment) {
          throw new Error("Base equipment does not exist.");
        }

        const valueData =
          fieldName === "specialRules"
            ? { specialRules: jsonInput(suggestion.finalValue) }
            : { [fieldName]: suggestion.finalValue };

        await transaction.equipmentLevel.upsert({
          where: {
            equipmentId_level: {
              equipmentId: suggestion.targetId!,
              level: suggestion.level!,
            },
          },
          create: {
            equipmentId: suggestion.targetId!,
            level: suggestion.level!,
            ...valueData,
            ...metadata,
            sourceType,
            ...(suggestion.notes && fieldName !== "notes"
              ? { notes: suggestion.notes }
              : {}),
          },
          update: {
            ...valueData,
            ...metadata,
            sourceType,
            ...(suggestion.notes && fieldName !== "notes"
              ? { notes: suggestion.notes }
              : {}),
          },
        });
      } else {
        const spell = await transaction.spell.findUnique({
          where: { id: suggestion.targetId! },
          select: { id: true },
        });
        if (!spell) {
          throw new Error("Base spell does not exist.");
        }

        const valueData = { [fieldName]: suggestion.finalValue };

        await transaction.spellLevel.upsert({
          where: {
            spellId_level: {
              spellId: suggestion.targetId!,
              level: suggestion.level!,
            },
          },
          create: {
            spellId: suggestion.targetId!,
            level: suggestion.level!,
            ...valueData,
            ...metadata,
            sourceType,
            ...(suggestion.notes && fieldName !== "notes"
              ? { notes: suggestion.notes }
              : {}),
          },
          update: {
            ...valueData,
            ...metadata,
            sourceType,
            ...(suggestion.notes && fieldName !== "notes"
              ? { notes: suggestion.notes }
              : {}),
          },
        });
      }

      await transaction.statChangeSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "applied",
          appliedAt: new Date(),
          reviewedAt: suggestion.reviewedAt ?? new Date(),
          reviewedBy: suggestion.reviewedBy ?? "admin",
        },
      });
    });

    return { ok: true, message: "Approved stat change applied." };
  } catch {
    return {
      ok: false,
      message: "Could not apply the approved stat change.",
    };
  }
}
