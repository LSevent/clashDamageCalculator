"use server";

import { revalidatePath } from "next/cache";

import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  runOfficialUpdateCheck,
} from "@/src/lib/admin/update-checker";
import { getPrismaClient } from "@/src/lib/db/prisma";
import type { UpdateCheckActionState } from "@/src/types/admin-update-check";

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
    await prisma.updateCheckResult.update({
      where: { id: resultId },
      data: { status: "ignored" },
    });
    revalidatePath("/admin/updates");
  } catch {
    // The page remains usable and does not expose database details.
  }
}
