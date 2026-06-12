import "server-only";

import { getPrismaClient } from "@/src/lib/db/prisma";
import {
  getDetectedPostStatus,
  isAllowedOfficialUpdateSource,
  parseOfficialBlogArchive,
} from "@/src/lib/admin/update-checker-utils";
import {
  updateDetectedTypes,
  updateResultStatuses,
  type UpdateCheckResultView,
  type UpdateCheckSummary,
  type UpdateCheckerDashboardResult,
  type UpdateDetectedType,
  type UpdateResultStatus,
} from "@/src/types/admin-update-check";

const sourceCooldownMs = 5 * 60 * 1000;
const fetchTimeoutMs = 10_000;
const maxPostsPerSource = 30;
const databaseUnavailableMessage =
  "Update checker requires database access.";

function isRecentCheck(lastCheckedAt: Date | null, now: Date) {
  return Boolean(
    lastCheckedAt &&
      now.getTime() - lastCheckedAt.getTime() < sourceCooldownMs,
  );
}

function asDetectedType(value: string): UpdateDetectedType {
  return updateDetectedTypes.includes(value as UpdateDetectedType)
    ? (value as UpdateDetectedType)
    : "unknown";
}

function asResultStatus(value: string): UpdateResultStatus {
  return updateResultStatuses.includes(value as UpdateResultStatus)
    ? (value as UpdateResultStatus)
    : "already-known";
}

function friendlySourceFailure(sourceName: string) {
  return `${sourceName}: Could not check official source right now. Try again later.`;
}

export async function runOfficialUpdateCheck(): Promise<
  | { available: true; summary: UpdateCheckSummary }
  | { available: false; message: string }
> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      available: false,
      message: databaseUnavailableMessage,
    };
  }

  let sources;

  try {
    sources = await prisma.updateSource.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return {
      available: false,
      message: databaseUnavailableMessage,
    };
  }

  const now = new Date();
  const summary = {
    sourcesChecked: 0,
    sourcesSkipped: 0,
    newPosts: 0,
    alreadyKnownPosts: 0,
    ignoredPosts: 0,
    failedSources: 0,
    checkedAt: now.toISOString(),
    messages: [] as string[],
  };

  for (const source of sources) {
    if (
      source.sourceType !== "official" ||
      !isAllowedOfficialUpdateSource(source.url)
    ) {
      summary.failedSources += 1;
      summary.messages.push(
        `${source.name}: Source is not on the official Clash of Clans blog allowlist.`,
      );
      continue;
    }

    if (isRecentCheck(source.lastCheckedAt, now)) {
      summary.sourcesSkipped += 1;
      summary.messages.push(
        `${source.name}: Checked within the last five minutes, so this source was skipped.`,
      );
      continue;
    }

    try {
      const cooldownCutoff = new Date(now.getTime() - sourceCooldownMs);
      const claimed = await prisma.updateSource.updateMany({
        where: {
          id: source.id,
          OR: [
            { lastCheckedAt: null },
            { lastCheckedAt: { lte: cooldownCutoff } },
          ],
        },
        data: { lastCheckedAt: now },
      });

      if (claimed.count === 0) {
        summary.sourcesSkipped += 1;
        summary.messages.push(
          `${source.name}: Another check already claimed this source within the last five minutes.`,
        );
        continue;
      }
    } catch {
      summary.failedSources += 1;
      summary.messages.push(friendlySourceFailure(source.name));
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const response = await fetch(source.url, {
        cache: "no-store",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "ClashDamageCalculator-OfficialUpdateChecker/1.0",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Official source returned an unsuccessful response.");
      }

      const posts = parseOfficialBlogArchive(
        await response.text(),
        source.url,
      ).slice(0, maxPostsPerSource);

      if (posts.length === 0) {
        summary.failedSources += 1;
        summary.messages.push(friendlySourceFailure(source.name));
        continue;
      }

      const existingResults = await prisma.updateCheckResult.findMany({
        where: {
          url: { in: posts.map((post) => post.url) },
        },
      });
      const existingByUrl = new Map(
        existingResults.map((result) => [result.url, result]),
      );

      await prisma.$transaction(async (transaction) => {
        for (const post of posts) {
          const existing = existingByUrl.get(post.url);
          const status = getDetectedPostStatus(
            existing ? asResultStatus(existing.status) : undefined,
          );

          if (status === "new") {
            summary.newPosts += 1;
          } else if (status === "ignored") {
            summary.ignoredPosts += 1;
          } else {
            summary.alreadyKnownPosts += 1;
          }

          if (existing) {
            await transaction.updateCheckResult.update({
              where: { id: existing.id },
              data: {
                title: post.title,
                publishedAt: post.publishedAt ?? existing.publishedAt,
                detectedType: post.detectedType,
                status,
                checkedAt: now,
              },
            });
          } else {
            await transaction.updateCheckResult.create({
              data: {
                sourceId: source.id,
                title: post.title,
                url: post.url,
                publishedAt: post.publishedAt,
                detectedType: post.detectedType,
                status,
                checkedAt: now,
              },
            });
          }
        }

      });

      summary.sourcesChecked += 1;
    } catch {
      summary.failedSources += 1;
      summary.messages.push(friendlySourceFailure(source.name));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (sources.length === 0) {
    summary.messages.push(
      "No enabled official update sources are configured. Run the database seed.",
    );
  }

  return {
    available: true,
    summary,
  };
}

export async function getUpdateCheckerDashboardData(): Promise<UpdateCheckerDashboardResult> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      available: false,
      message: databaseUnavailableMessage,
    };
  }

  try {
    const [sources, results] = await Promise.all([
      prisma.updateSource.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.updateCheckResult.findMany({
        include: {
          source: {
            select: { name: true },
          },
          patch: {
            select: {
              id: true,
              name: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: [
          { publishedAt: { sort: "desc", nulls: "last" } },
          { checkedAt: "desc" },
        ],
        take: 100,
      }),
    ]);
    const resultViews: UpdateCheckResultView[] = results.map((result) => ({
      id: result.id,
      sourceId: result.sourceId,
      sourceName: result.source.name,
      title: result.title,
      url: result.url,
      publishedAt: result.publishedAt?.toISOString() ?? null,
      detectedType: asDetectedType(result.detectedType),
      status: asResultStatus(result.status),
      checkedAt: result.checkedAt.toISOString(),
      patch: result.patch,
    }));
    const lastCheckedAt = sources.reduce<Date | null>(
      (latest, source) =>
        source.lastCheckedAt &&
        (!latest || source.lastCheckedAt > latest)
          ? source.lastCheckedAt
          : latest,
      null,
    );

    return {
      available: true,
      data: {
        sources: sources.map((source) => ({
          id: source.id,
          name: source.name,
          url: source.url,
          sourceType: source.sourceType,
          enabled: source.enabled,
          lastCheckedAt: source.lastCheckedAt?.toISOString() ?? null,
        })),
        results: resultViews,
        enabledSourceCount: sources.filter((source) => source.enabled).length,
        newPostCount: resultViews.filter((result) => result.status === "new")
          .length,
        alreadyKnownPostCount: resultViews.filter(
          (result) => result.status === "already-known",
        ).length,
        ignoredPostCount: resultViews.filter(
          (result) => result.status === "ignored",
        ).length,
        patchDraftCount: resultViews.filter(
          (result) => result.status === "patch-draft-created",
        ).length,
        lastCheckedAt: lastCheckedAt?.toISOString() ?? null,
      },
    };
  } catch {
    return {
      available: false,
      message: databaseUnavailableMessage,
    };
  }
}
