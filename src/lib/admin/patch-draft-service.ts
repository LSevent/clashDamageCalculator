import "server-only";

import { Prisma } from "@/src/generated/prisma/client";
import {
  canCreatePatchDraftFromStatus,
  createPatchDraftBaseId,
  createPatchDraftChangedItems,
  createPatchDraftNotes,
  createUniquePatchId,
} from "@/src/lib/admin/patch-draft";
import { getPrismaClient } from "@/src/lib/db/prisma";
import {
  updateDetectedTypes,
  type PatchDraftActionState,
  type UpdateDetectedType,
} from "@/src/types/admin-update-check";

function asDetectedType(value: string): UpdateDetectedType {
  return updateDetectedTypes.includes(value as UpdateDetectedType)
    ? (value as UpdateDetectedType)
    : "unknown";
}

function existingDraft(patchId: string): PatchDraftActionState {
  return {
    ok: true,
    message: "Patch draft already exists.",
    patchId,
    existing: true,
  };
}

export async function createPatchDraftFromUpdateResult(
  updateCheckResultId: string,
): Promise<PatchDraftActionState> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      ok: false,
      message: "Patch draft creation requires database access.",
    };
  }

  if (!updateCheckResultId.trim()) {
    return {
      ok: false,
      message: "Update result not found.",
    };
  }

  try {
    const updateResult = await prisma.updateCheckResult.findUnique({
      where: { id: updateCheckResultId },
      include: {
        patch: {
          select: { id: true },
        },
      },
    });

    if (!updateResult) {
      return {
        ok: false,
        message: "Update result not found.",
      };
    }

    if (updateResult.patch) {
      return existingDraft(updateResult.patch.id);
    }

    if (updateResult.status === "ignored") {
      return {
        ok: false,
        message: "Ignored update results cannot create patch drafts.",
      };
    }

    if (!canCreatePatchDraftFromStatus(updateResult.status)) {
      return {
        ok: false,
        message: "Could not create patch draft.",
      };
    }

    const patchWithSource = await prisma.patch.findFirst({
      where: { sourceUrl: updateResult.url },
      select: {
        id: true,
        updateCheckResultId: true,
      },
    });

    if (patchWithSource) {
      if (
        patchWithSource.updateCheckResultId &&
        patchWithSource.updateCheckResultId !== updateResult.id
      ) {
        return {
          ok: false,
          message: "Could not create patch draft.",
        };
      }

      await prisma.$transaction([
        prisma.patch.update({
          where: { id: patchWithSource.id },
          data: { updateCheckResultId: updateResult.id },
        }),
        prisma.updateCheckResult.update({
          where: { id: updateResult.id },
          data: { status: "patch-draft-created" },
        }),
      ]);

      return existingDraft(patchWithSource.id);
    }

    const baseId = createPatchDraftBaseId(
      updateResult.title,
      updateResult.publishedAt,
    );
    const existingIds = await prisma.patch.findMany({
      where: { id: { startsWith: baseId } },
      select: { id: true },
    });
    const reservedIds = new Set(existingIds.map((patch) => patch.id));
    const detectedType = asDetectedType(updateResult.detectedType);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const patchId = createUniquePatchId(baseId, reservedIds);

      try {
        await prisma.$transaction([
          prisma.patch.create({
            data: {
              id: patchId,
              name: updateResult.title,
              releaseDate: updateResult.publishedAt,
              sourceUrl: updateResult.url,
              sourceUrls: [updateResult.url],
              notes: createPatchDraftNotes(
                detectedType,
                updateResult.publishedAt !== null,
              ),
              isCurrent: false,
              verificationStatus: "draft",
              verifiedAt: null,
              changedItems: createPatchDraftChangedItems(
                detectedType,
              ) as Prisma.InputJsonValue,
              updateCheckResultId: updateResult.id,
            },
          }),
          prisma.updateCheckResult.update({
            where: { id: updateResult.id },
            data: { status: "patch-draft-created" },
          }),
        ]);

        return {
          ok: true,
          message: "Patch draft created.",
          patchId,
          existing: false,
        };
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== "P2002"
        ) {
          throw error;
        }

        const linkedResult = await prisma.updateCheckResult.findUnique({
          where: { id: updateCheckResultId },
          select: {
            patch: {
              select: { id: true },
            },
          },
        });

        if (linkedResult?.patch) {
          return existingDraft(linkedResult.patch.id);
        }

        reservedIds.add(patchId);
      }
    }

    return {
      ok: false,
      message: "Could not create patch draft.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.updateCheckResult
        .findUnique({
          where: { id: updateCheckResultId },
          select: {
            patch: {
              select: { id: true },
            },
          },
        })
        .catch(() => null);

      if (existing?.patch) {
        return existingDraft(existing.patch.id);
      }
    }

    return {
      ok: false,
      message: "Could not create patch draft.",
    };
  }
}
