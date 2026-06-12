import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { getPrismaClient } from "@/src/lib/db/prisma";
import {
  statChangeConfidences,
  statChangeFieldNames,
  statChangeStatuses,
  statChangeTargetKinds,
  type StatChangeConfidence,
  type StatChangeDashboardResult,
  type StatChangeFieldName,
  type StatChangeStatus,
  type StatChangeSuggestionView,
  type StatChangeSummary,
  type StatChangeTargetKind,
} from "@/src/types/admin-stat-change";
import {
  adminVerificationStatuses,
  type AdminVerificationStatus,
} from "@/src/types/admin";

type SuggestionRow = Prisma.StatChangeSuggestionGetPayload<{
  include: { patch: true };
}>;

function targetKind(value: string): StatChangeTargetKind {
  return statChangeTargetKinds.includes(value as StatChangeTargetKind)
    ? (value as StatChangeTargetKind)
    : "patch-note-hint";
}

function fieldName(value: string | null): StatChangeFieldName | null {
  return value && statChangeFieldNames.includes(value as StatChangeFieldName)
    ? (value as StatChangeFieldName)
    : null;
}

function confidence(value: string): StatChangeConfidence {
  return statChangeConfidences.includes(value as StatChangeConfidence)
    ? (value as StatChangeConfidence)
    : "low";
}

function status(value: string): StatChangeStatus {
  return statChangeStatuses.includes(value as StatChangeStatus)
    ? (value as StatChangeStatus)
    : "needs-info";
}

function verificationStatus(
  value: string | null,
): AdminVerificationStatus | null {
  return value &&
    adminVerificationStatuses.includes(value as AdminVerificationStatus)
    ? (value as AdminVerificationStatus)
    : null;
}

function mapSuggestion(row: SuggestionRow): StatChangeSuggestionView {
  return {
    id: row.id,
    patchId: row.patchId,
    patchName: row.patch.name,
    sourceUrl: row.sourceUrl,
    sourceTitle: row.sourceTitle,
    sourceExcerpt: row.sourceExcerpt,
    targetKind: targetKind(row.targetKind),
    targetId: row.targetId,
    targetName: row.targetName,
    level: row.level,
    townHallLevel: row.townHallLevel,
    isSupercharged: row.isSupercharged,
    superchargeLevel: row.superchargeLevel,
    fieldName: fieldName(row.fieldName),
    oldValue: row.oldValue,
    suggestedValue: row.suggestedValue,
    finalValue: row.finalValue,
    confidence: confidence(row.confidence),
    status: status(row.status),
    verificationStatus: verificationStatus(row.verificationStatus),
    notes: row.notes,
    parserNotes: row.parserNotes,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function summarizeStatChanges(
  suggestions: readonly Pick<
    StatChangeSuggestionView,
    "status" | "targetKind"
  >[],
): StatChangeSummary {
  return {
    pendingReview: suggestions.filter(
      (item) => item.status === "pending-review",
    ).length,
    approved: suggestions.filter((item) => item.status === "approved").length,
    rejected: suggestions.filter((item) => item.status === "rejected").length,
    needsInfo: suggestions.filter((item) => item.status === "needs-info")
      .length,
    applied: suggestions.filter((item) => item.status === "applied").length,
    hints: suggestions.filter((item) => item.targetKind === "patch-note-hint")
      .length,
    exact: suggestions.filter((item) => item.targetKind !== "patch-note-hint")
      .length,
  };
}

export async function getStatChangeDashboardData(
  patchId?: string,
): Promise<StatChangeDashboardResult> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      available: false,
      message: "Suggested stat change workflow requires database access.",
    };
  }

  try {
    const [patch, rows] = await Promise.all([
      patchId
        ? prisma.patch.findUnique({
            where: { id: patchId },
            include: {
              updateCheckResult: {
                select: { detectedType: true, url: true },
              },
            },
          })
        : null,
      prisma.statChangeSuggestion.findMany({
        where: patchId ? { patchId } : undefined,
        include: { patch: true },
        orderBy: [{ createdAt: "desc" }],
        take: patchId ? 500 : 200,
      }),
    ]);

    if (patchId && !patch) {
      return {
        available: false,
        message: "Patch could not be found.",
      };
    }

    const suggestions = rows.map(mapSuggestion);

    return {
      available: true,
      data: {
        patch: patch
          ? {
              id: patch.id,
              name: patch.name,
              releaseDate: patch.releaseDate?.toISOString().slice(0, 10) ?? null,
              sourceUrl: patch.sourceUrl ?? patch.updateCheckResult?.url ?? null,
              notes: patch.notes,
              verificationStatus: patch.verificationStatus,
              detectedType: patch.updateCheckResult?.detectedType ?? null,
            }
          : undefined,
        suggestions,
        summary: summarizeStatChanges(suggestions),
      },
    };
  } catch {
    return {
      available: false,
      message: "Suggested stat change workflow requires database access.",
    };
  }
}
