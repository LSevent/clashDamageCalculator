"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma, type PrismaClient } from "@/src/generated/prisma/client";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { applyApprovedStatChange } from "@/src/lib/admin/stat-change-apply";
import { generateStatChangeSuggestions } from "@/src/lib/admin/stat-change-generator";
import {
  canTransitionStatChangeStatus,
  parseFinalValueInput,
  validateStatChangeSuggestion,
} from "@/src/lib/admin/stat-change-validation";
import { getPrismaClient } from "@/src/lib/db/prisma";
import { createBuildingLevelKey } from "@/src/lib/game/db-game-data";
import {
  regenerateModes,
  statChangeFieldNames,
  statChangeStatuses,
  statChangeTargetKinds,
  type StatChangeFieldName,
  type StatChangeRegenerateMode,
  type StatChangeStatus,
  type StatChangeTargetKind,
  type StatChangeValidationInput,
} from "@/src/types/admin-stat-change";
import {
  adminVerificationStatuses,
  type AdminVerificationStatus,
} from "@/src/types/admin";

function patchPath(patchId: string) {
  return `/admin/patches/${encodeURIComponent(patchId)}/suggestions`;
}

function redirectWith(
  path: string,
  type: "message" | "error",
  text: string,
): never {
  redirect(`${path}?${new URLSearchParams({ [type]: text }).toString()}`);
}

async function requireAccess(path: string) {
  const auth = await getAdminAuthState();

  if (!auth.authenticated) {
    redirectWith(path, "error", "Admin access required.");
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    redirectWith(
      path,
      "error",
      "Suggested stat change workflow requires database access.",
    );
  }

  return prisma;
}

function optionalPositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : Number.NaN;
}

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function targetKind(value: string): StatChangeTargetKind | undefined {
  return statChangeTargetKinds.includes(value as StatChangeTargetKind)
    ? (value as StatChangeTargetKind)
    : undefined;
}

function fieldName(value: string): StatChangeFieldName | undefined {
  return statChangeFieldNames.includes(value as StatChangeFieldName)
    ? (value as StatChangeFieldName)
    : undefined;
}

function verificationStatus(
  value: string,
): AdminVerificationStatus | undefined {
  return adminVerificationStatuses.includes(value as AdminVerificationStatus)
    ? (value as AdminVerificationStatus)
    : undefined;
}

function refreshSuggestionPaths(patchId: string) {
  revalidatePath(patchPath(patchId));
  revalidatePath("/admin/stat-changes");
}

async function getCurrentTargetValue(
  prisma: PrismaClient,
  input: StatChangeValidationInput,
) {
  if (
    input.targetKind === "patch-note-hint" ||
    !input.targetId ||
    !input.level ||
    !input.fieldName
  ) {
    return undefined;
  }

  if (input.targetKind === "building-level") {
    if (!input.townHallLevel) {
      return undefined;
    }

    const row = await prisma.buildingLevel.findUnique({
      where: {
        levelKey: createBuildingLevelKey(
          input.targetId,
          input.level,
          input.townHallLevel,
          input.isSupercharged ?? false,
          input.superchargeLevel,
        ),
      },
    });

    return row?.[input.fieldName as "hp" | "notes"] ?? null;
  }

  if (input.targetKind === "equipment-level") {
    const row = await prisma.equipmentLevel.findUnique({
      where: {
        equipmentId_level: {
          equipmentId: input.targetId,
          level: input.level,
        },
      },
    });

    if (!row) {
      return null;
    }

    const values = {
      damage: row.damage,
      healing: row.healing,
      hpIncrease: row.hpIncrease,
      specialRules: row.specialRules,
      abilityDescription: row.abilityDescription,
      notes: row.notes,
    };

    return values[input.fieldName as keyof typeof values] ?? null;
  }

  const row = await prisma.spellLevel.findUnique({
    where: {
      spellId_level: {
        spellId: input.targetId,
        level: input.level,
      },
    },
  });

  if (!row) {
    return null;
  }

  const values = {
    damage: row.damage,
    damagePercent: row.damagePercent,
    repeatDamageRule: row.repeatDamageRule,
    notes: row.notes,
  };

  return values[input.fieldName as keyof typeof values] ?? null;
}

async function baseTargetExists(
  prisma: PrismaClient,
  kind: StatChangeTargetKind,
  targetId?: string | null,
) {
  if (kind === "patch-note-hint" || !targetId) {
    return kind === "patch-note-hint";
  }

  if (kind === "building-level") {
    return Boolean(
      await prisma.building.findUnique({
        where: { id: targetId },
        select: { id: true },
      }),
    );
  }
  if (kind === "equipment-level") {
    return Boolean(
      await prisma.equipment.findUnique({
        where: { id: targetId },
        select: { id: true },
      }),
    );
  }

  return Boolean(
    await prisma.spell.findUnique({
      where: { id: targetId },
      select: { id: true },
    }),
  );
}

export async function generateStatChangeSuggestionsAction(
  formData: FormData,
) {
  const patchId = formString(formData.get("patchId"));
  const path = patchPath(patchId);
  const prisma = await requireAccess(path);
  const sourceExcerpt = formString(formData.get("sourceExcerpt"));
  const rawMode = formString(formData.get("regenerateMode"));
  const regenerateMode: StatChangeRegenerateMode = regenerateModes.includes(
    rawMode as StatChangeRegenerateMode,
  )
    ? (rawMode as StatChangeRegenerateMode)
    : "append-new";

  if (sourceExcerpt.length > 20_000) {
    redirectWith(path, "error", "Source excerpt exceeds 20,000 characters.");
  }

  let result;
  try {
    result = await generateStatChangeSuggestions(prisma, {
      patchId,
      useSourceUrl: formData.get("useSourceUrl") === "on",
      sourceExcerpt: sourceExcerpt || undefined,
      regenerateMode,
    });
  } catch {
    redirectWith(path, "error", "Could not generate stat change suggestions.");
  }

  if (!result.ok) {
    redirectWith(path, "error", result.message);
  }

  refreshSuggestionPaths(patchId);
  const detail = [
    `${result.summary.created} suggestion(s) created`,
    `${result.summary.hintsCreated} hint(s)`,
    `${result.summary.duplicatesSkipped} duplicate(s) skipped`,
  ].join(", ");
  redirectWith(path, "message", `Suggestion generation complete: ${detail}.`);
}

export async function updateStatChangeSuggestionAction(formData: FormData) {
  const patchId = formString(formData.get("patchId"));
  const path = patchPath(patchId);
  const prisma = await requireAccess(path);
  const id = formString(formData.get("suggestionId"));
  let existing;

  try {
    existing = await prisma.statChangeSuggestion.findUnique({
      where: { id },
    });
  } catch {
    redirectWith(path, "error", "Database is unavailable.");
  }

  if (!existing || existing.patchId !== patchId) {
    redirectWith(path, "error", "Suggestion could not be found.");
  }
  if (!["pending-review", "needs-info"].includes(existing.status)) {
    redirectWith(path, "error", "Only pending suggestions can be edited.");
  }

  const rawKind = formString(formData.get("targetKind"));
  const rawField = formString(formData.get("fieldName"));
  const kind = targetKind(rawKind);
  const field = fieldName(rawField);
  const finalValue = parseFinalValueInput(
    field,
    formString(formData.get("finalValue")),
  );
  const data = {
    targetKind: kind ?? ("patch-note-hint" as const),
    targetId: formString(formData.get("targetId")) || undefined,
    targetName: formString(formData.get("targetName")) || undefined,
    level: optionalPositiveInteger(formData.get("level")),
    townHallLevel: optionalPositiveInteger(formData.get("townHallLevel")),
    isSupercharged: formData.get("isSupercharged") === "on",
    superchargeLevel: optionalPositiveInteger(
      formData.get("superchargeLevel"),
    ),
    fieldName: field,
    finalValue,
    verificationStatus: verificationStatus(
      formString(formData.get("verificationStatus")),
    ),
    notes: formString(formData.get("notes")) || undefined,
  };
  const validation = validateStatChangeSuggestion(data);

  if (!kind) {
    redirectWith(path, "error", "Target kind must be valid.");
  }
  if (!validation.success) {
    redirectWith(path, "error", validation.errors.join(" "));
  }

  const isBuildingChange = data.targetKind === "building-level";
  let oldValue;

  try {
    oldValue = await getCurrentTargetValue(prisma, data);
  } catch {
    redirectWith(path, "error", "Could not load the current stat value.");
  }

  try {
    await prisma.statChangeSuggestion.update({
      where: { id },
      data: {
        targetKind: data.targetKind,
        targetId: data.targetId ?? null,
        targetName: data.targetName ?? null,
        level: data.level ?? null,
        townHallLevel: isBuildingChange ? data.townHallLevel ?? null : null,
        isSupercharged: isBuildingChange ? data.isSupercharged : null,
        superchargeLevel:
          isBuildingChange && data.isSupercharged
            ? data.superchargeLevel ?? null
            : null,
        fieldName: data.fieldName ?? null,
        oldValue:
          data.targetKind === "patch-note-hint"
            ? Prisma.DbNull
            : oldValue === undefined || oldValue === null
              ? Prisma.DbNull
              : (oldValue as Prisma.InputJsonValue),
        finalValue:
          data.targetKind === "patch-note-hint"
            ? Prisma.DbNull
            : (data.finalValue as Prisma.InputJsonValue),
        verificationStatus: data.verificationStatus ?? "pending-review",
        notes: data.notes ?? null,
        status: "pending-review",
      },
    });
  } catch {
    redirectWith(path, "error", "Could not update the suggestion.");
  }

  refreshSuggestionPaths(patchId);
  redirectWith(path, "message", "Suggestion updated for review.");
}

async function transitionSuggestion(
  formData: FormData,
  nextStatus: StatChangeStatus,
  message: string,
) {
  const patchId = formString(formData.get("patchId"));
  const path = patchPath(patchId);
  const prisma = await requireAccess(path);
  const id = formString(formData.get("suggestionId"));
  let suggestion;

  try {
    suggestion = await prisma.statChangeSuggestion.findUnique({
      where: { id },
    });
  } catch {
    redirectWith(path, "error", "Database is unavailable.");
  }

  if (!suggestion || suggestion.patchId !== patchId) {
    redirectWith(path, "error", "Suggestion could not be found.");
  }
  if (
    !statChangeStatuses.includes(suggestion.status as StatChangeStatus) ||
    !canTransitionStatChangeStatus(
      suggestion.status as StatChangeStatus,
      nextStatus,
    )
  ) {
    redirectWith(path, "error", "Suggestion status cannot be changed.");
  }

  if (nextStatus === "approved") {
    const validation = validateStatChangeSuggestion({
      targetKind: suggestion.targetKind as StatChangeTargetKind,
      targetId: suggestion.targetId ?? undefined,
      targetName: suggestion.targetName ?? undefined,
      level: suggestion.level ?? undefined,
      townHallLevel: suggestion.townHallLevel ?? undefined,
      isSupercharged: suggestion.isSupercharged ?? undefined,
      superchargeLevel: suggestion.superchargeLevel ?? undefined,
      fieldName: suggestion.fieldName as StatChangeFieldName | undefined,
      finalValue: suggestion.finalValue,
      verificationStatus: verificationStatus(
        suggestion.verificationStatus ?? "",
      ),
      notes: suggestion.notes ?? undefined,
    });

    if (!validation.success) {
      redirectWith(path, "error", validation.errors.join(" "));
    }

    let targetExists = false;
    try {
      targetExists = await baseTargetExists(
        prisma,
        suggestion.targetKind as StatChangeTargetKind,
        suggestion.targetId,
      );
    } catch {
      redirectWith(path, "error", "Could not validate the suggestion target.");
    }

    if (!targetExists) {
      redirectWith(
        path,
        "error",
        "Target base item could not be found in the database.",
      );
    }
  }

  const reviewNote = formString(formData.get("reviewNote"));

  try {
    await prisma.statChangeSuggestion.update({
      where: { id },
      data: {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewedBy: "admin",
        ...(reviewNote ? { notes: reviewNote } : {}),
      },
    });
  } catch {
    redirectWith(path, "error", "Could not update the suggestion status.");
  }

  refreshSuggestionPaths(patchId);
  redirectWith(path, "message", message);
}

export async function approveStatChangeSuggestionAction(formData: FormData) {
  return transitionSuggestion(
    formData,
    "approved",
    "Suggestion approved. It has not been applied yet.",
  );
}

export async function rejectStatChangeSuggestionAction(formData: FormData) {
  return transitionSuggestion(formData, "rejected", "Suggestion rejected.");
}

export async function markStatChangeNeedsInfoAction(formData: FormData) {
  return transitionSuggestion(
    formData,
    "needs-info",
    "Suggestion marked as needing more information.",
  );
}

export async function applyApprovedStatChangeSuggestionAction(
  formData: FormData,
) {
  const patchId = formString(formData.get("patchId"));
  const path = patchPath(patchId);
  const prisma = await requireAccess(path);
  const suggestionId = formString(formData.get("suggestionId"));
  let suggestion;

  try {
    suggestion = await prisma.statChangeSuggestion.findUnique({
      where: { id: suggestionId },
      select: { patchId: true },
    });
  } catch {
    redirectWith(path, "error", "Database is unavailable.");
  }

  if (!suggestion || suggestion.patchId !== patchId) {
    redirectWith(path, "error", "Suggestion could not be found.");
  }

  const result = await applyApprovedStatChange(prisma, suggestionId);

  if (!result.ok) {
    redirectWith(path, "error", result.message);
  }

  refreshSuggestionPaths(patchId);
  revalidatePath("/calculator");
  revalidatePath("/data-manager");
  revalidatePath("/api/data-source-health");
  revalidatePath("/admin/data");
  redirectWith(path, "message", result.message);
}
