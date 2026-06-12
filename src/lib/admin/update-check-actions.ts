"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { createPatchDraftFromUpdateResult } from "@/src/lib/admin/patch-draft-service";
import {
  runOfficialUpdateCheck,
} from "@/src/lib/admin/update-checker";
import { getPrismaClient } from "@/src/lib/db/prisma";
import type { UpdateCheckActionState } from "@/src/types/admin-update-check";

function redirectWith(
  type: "message" | "error",
  text: string,
): never {
  const params = new URLSearchParams({ [type]: text });
  redirect(`/admin/updates?${params.toString()}`);
}

export async function checkForUpdatesAction(): Promise<UpdateCheckActionState> {
  const auth = await getAdminAuthState();

  if (!auth.authenticated) {
    return {
      ok: false,
      message: "Admin access required.",
    };
  }

  const result = await runOfficialUpdateCheck();

  if (!result.available) {
    return {
      ok: false,
      message: result.message,
    };
  }

  revalidatePath("/admin/updates");

  return {
    ok: result.summary.failedSources === 0,
    message:
      result.summary.sourcesChecked > 0
        ? "Official source check completed."
        : "No source was checked.",
    summary: result.summary,
    runId: result.summary.checkedAt,
  };
}

export async function ignoreUpdateResultAction(formData: FormData) {
  const auth = await getAdminAuthState();

  if (!auth.authenticated) {
    return;
  }

  const resultId = formData.get("resultId");
  const prisma = getPrismaClient();

  if (typeof resultId !== "string" || !resultId || !prisma) {
    return;
  }

  try {
    const result = await prisma.updateCheckResult.findUnique({
      where: { id: resultId },
      select: {
        patch: {
          select: { id: true },
        },
      },
    });

    if (!result?.patch) {
      await prisma.updateCheckResult.update({
        where: { id: resultId },
        data: { status: "ignored" },
      });
    }
    revalidatePath("/admin/updates");
  } catch {
    // The page remains usable and does not expose database details.
  }
}

export async function createPatchDraftFromUpdateResultAction(
  formData: FormData,
) {
  const auth = await getAdminAuthState();

  if (!auth.authenticated) {
    redirectWith("error", "Admin access required.");
  }

  const resultId = formData.get("resultId");

  if (typeof resultId !== "string") {
    redirectWith("error", "Update result not found.");
  }

  const result = await createPatchDraftFromUpdateResult(resultId);

  if (!result.ok) {
    redirectWith("error", result.message);
  }

  revalidatePath("/admin/updates");
  revalidatePath("/admin/data/patches");
  revalidatePath("/data-manager");
  redirectWith("message", result.message);
}
