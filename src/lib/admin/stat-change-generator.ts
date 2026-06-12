import "server-only";

import { Prisma, type PrismaClient } from "@/src/generated/prisma/client";
import {
  matchParsedStatChange,
  suggestionDuplicateKey,
  type StatChangeMatchContext,
} from "@/src/lib/admin/stat-change-comparison";
import {
  maxSourceExcerptCharacters,
  parseStatChangeText,
} from "@/src/lib/admin/stat-change-parser";
import { normalizeOfficialPostUrl } from "@/src/lib/admin/update-checker-utils";
import type {
  StatChangeGenerationSummary,
  StatChangeRegenerateMode,
} from "@/src/types/admin-stat-change";

const fetchTimeoutMs = 10_000;
const maxFetchedHtmlCharacters = 1_000_000;

const hintText: Record<string, string> = {
  "patch-notes": "Patch notes review required.",
  "balance-update": "Balance changes review required.",
  equipment: "Equipment stats review required.",
  spell: "Spell stats review required.",
  event: "Event content review required.",
  unknown: "Manual review required.",
  "general-news": "Manual review required.",
};

function htmlToText(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .slice(0, maxSourceExcerptCharacters);
}

async function fetchOfficialSource(sourceUrl: string) {
  const normalized = normalizeOfficialPostUrl(sourceUrl);

  if (!normalized || normalized !== sourceUrl) {
    throw new Error("Patch source is not an allowlisted official post URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ClashDamageCalculator-StatSuggestionReview/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Official source could not be loaded.");
    }

    const html = (await response.text()).slice(0, maxFetchedHtmlCharacters);
    return htmlToText(html);
  } finally {
    clearTimeout(timeout);
  }
}

async function createMatchContext(
  prisma: PrismaClient,
): Promise<StatChangeMatchContext> {
  const [buildings, equipment, spells] = await Promise.all([
    prisma.building.findMany({ include: { levels: true } }),
    prisma.equipment.findMany({ include: { levels: true } }),
    prisma.spell.findMany({ include: { levels: true } }),
  ]);

  return {
    items: [
      ...buildings.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "building-level" as const,
        levels: item.levels.map((level) => ({
          level: level.level,
          townHallLevel: level.townHallLevel ?? undefined,
          isSupercharged: level.isSupercharged,
          superchargeLevel: level.superchargeLevel ?? undefined,
          values: {
            hp: level.hp,
            notes: level.notes,
          },
        })),
      })),
      ...equipment.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "equipment-level" as const,
        levels: item.levels.map((level) => ({
          level: level.level,
          values: {
            damage: level.damage,
            healing: level.healing,
            hpIncrease: level.hpIncrease,
            abilityDescription: level.abilityDescription,
            specialRules: level.specialRules,
            notes: level.notes,
          },
        })),
      })),
      ...spells.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "spell-level" as const,
        levels: item.levels.map((level) => ({
          level: level.level,
          values: {
            damage: level.damage,
            damagePercent: level.damagePercent,
            repeatDamageRule: level.repeatDamageRule,
            notes: level.notes,
          },
        })),
      })),
    ],
  };
}

function jsonValue(value: unknown) {
  return value === undefined || value === null
    ? Prisma.DbNull
    : (value as Prisma.InputJsonValue);
}

export async function generateStatChangeSuggestions(
  prisma: PrismaClient,
  options: {
    patchId: string;
    useSourceUrl: boolean;
    sourceExcerpt?: string;
    regenerateMode: StatChangeRegenerateMode;
  },
): Promise<
  | { ok: true; summary: StatChangeGenerationSummary }
  | { ok: false; message: string }
> {
  const patch = await prisma.patch.findUnique({
    where: { id: options.patchId },
    include: {
      updateCheckResult: {
        select: { detectedType: true, url: true },
      },
    },
  });

  if (!patch) {
    return { ok: false, message: "Patch could not be found." };
  }

  const storedSourceUrl =
    patch.sourceUrl ?? patch.updateCheckResult?.url ?? null;
  const sourceUrl = storedSourceUrl
    ? normalizeOfficialPostUrl(storedSourceUrl) ?? null
    : null;
  const excerpt = options.sourceExcerpt?.trim().slice(
    0,
    maxSourceExcerptCharacters,
  );
  const warnings: string[] = [];
  let sourceText = excerpt ?? "";

  if (options.useSourceUrl) {
    if (!sourceUrl) {
      return {
        ok: false,
        message: "Patch does not have an official source URL.",
      };
    }

    try {
      const fetchedText = await fetchOfficialSource(sourceUrl);
      sourceText = [sourceText, fetchedText].filter(Boolean).join("\n");
    } catch {
      return {
        ok: false,
        message: "Could not load the official patch source right now.",
      };
    }
  }

  if (!sourceText.trim()) {
    return {
      ok: false,
      message: "Use the official source URL or paste a source excerpt.",
    };
  }

  const parsed = parseStatChangeText(sourceText);
  warnings.push(...parsed.warnings);
  const context = await createMatchContext(prisma);
  const matched = parsed.candidates.map((candidate) =>
    matchParsedStatChange(candidate, context),
  );
  const detectedType = patch.updateCheckResult?.detectedType ?? "unknown";
  const hint = hintText[detectedType] ?? hintText.unknown;
  const drafts =
    matched.length > 0
      ? matched.map((item) => ({
          patchId: patch.id,
          sourceUrl,
          sourceTitle: patch.name,
          sourceExcerpt: item.sourceExcerpt,
          targetKind: item.targetKind,
          targetId: item.targetId ?? null,
          targetName: item.targetName,
          level: item.level,
          townHallLevel: item.townHallLevel ?? null,
          isSupercharged: item.isSupercharged ?? null,
          superchargeLevel: item.superchargeLevel ?? null,
          fieldName: item.fieldName,
          oldValue: item.oldValue,
          suggestedValue: item.suggestedValue,
          finalValue: item.suggestedValue,
          confidence: item.confidence,
          status: "pending-review",
          verificationStatus: "pending-review",
          notes: null,
          parserNotes: item.parserNotes ?? null,
          createdBy: "admin-generator",
        }))
      : [
          {
            patchId: patch.id,
            sourceUrl,
            sourceTitle: patch.name,
            sourceExcerpt: excerpt?.slice(0, 1_000) ?? null,
            targetKind: "patch-note-hint",
            targetId: null,
            targetName: hint,
            level: null,
            townHallLevel: null,
            isSupercharged: null,
            superchargeLevel: null,
            fieldName: null,
            oldValue: undefined,
            suggestedValue: undefined,
            finalValue: undefined,
            confidence: "hint",
            status: "pending-review",
            verificationStatus: "pending-review",
            notes:
              "Official source mentions changes, but exact calculator-ready stat values were not parsed automatically.",
            parserNotes: warnings.join(" ") || null,
            createdBy: "admin-generator",
          },
        ];

  if (options.regenerateMode === "replace-pending") {
    await prisma.statChangeSuggestion.deleteMany({
      where: {
        patchId: patch.id,
        status: { in: ["pending-review", "needs-info"] },
      },
    });
  }

  const existing = await prisma.statChangeSuggestion.findMany({
    where: { patchId: patch.id },
  });
  const existingKeys = new Set(
    existing.map((item) =>
      suggestionDuplicateKey({
        patchId: item.patchId,
        targetKind: item.targetKind,
        targetId: item.targetId,
        targetName: item.targetName,
        level: item.level,
        townHallLevel: item.townHallLevel,
        isSupercharged: item.isSupercharged,
        superchargeLevel: item.superchargeLevel,
        fieldName: item.fieldName,
        suggestedValue: item.suggestedValue,
      }),
    ),
  );
  let created = 0;
  let hintsCreated = 0;
  let duplicatesSkipped = 0;

  for (const draft of drafts) {
    const key = suggestionDuplicateKey({
      ...draft,
      suggestedValue: draft.suggestedValue,
    });

    if (existingKeys.has(key)) {
      duplicatesSkipped += 1;
      continue;
    }

    await prisma.statChangeSuggestion.create({
      data: {
        ...draft,
        oldValue: jsonValue(draft.oldValue),
        suggestedValue: jsonValue(draft.suggestedValue),
        finalValue: jsonValue(draft.finalValue),
      },
    });
    existingKeys.add(key);
    created += 1;
    if (draft.targetKind === "patch-note-hint") {
      hintsCreated += 1;
    }
  }

  return {
    ok: true,
    summary: {
      created,
      hintsCreated,
      duplicatesSkipped,
      warnings,
    },
  };
}
