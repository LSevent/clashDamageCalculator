import type { UpdateDetectedType } from "@/src/types/admin-update-check";
import type { PatchChangedItem } from "@/src/types/game/game-data";

const draftReviewReminder =
  "Patch draft created from official update checker result. Admin must review the source and add or approve stat changes before calculator data is updated.";

const reviewHints: Record<
  UpdateDetectedType,
  { itemName: string; summary: string }
> = {
  "patch-notes": {
    itemName: "Patch notes review",
    summary: "Patch notes review required",
  },
  "balance-update": {
    itemName: "Balance changes review",
    summary: "Balance changes review required",
  },
  equipment: {
    itemName: "Equipment data review",
    summary: "Equipment data review required",
  },
  spell: {
    itemName: "Spell data review",
    summary: "Spell data review required",
  },
  event: {
    itemName: "Event content review",
    summary: "Event content review required",
  },
  "general-news": {
    itemName: "General update review",
    summary: "General update review required",
  },
  unknown: {
    itemName: "General update review",
    summary: "General update review required",
  },
};

function datePart(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
}

export function createPatchDraftBaseId(
  title: string,
  publishedAt?: Date | string | null,
) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  const safeSlug = slug || "official-update";
  const publishedDate = datePart(publishedAt);

  return publishedDate ? `${safeSlug}-${publishedDate}` : safeSlug;
}

export function createUniquePatchId(
  baseId: string,
  existingIds: ReadonlySet<string>,
) {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;

  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

export function createPatchDraftNotes(
  detectedType: UpdateDetectedType,
  hasPublishedDate: boolean,
) {
  return [
    draftReviewReminder,
    `Detected type: ${detectedType}`,
    ...(hasPublishedDate
      ? []
      : ["Release date was not detected automatically."]),
  ].join("\n\n");
}

export function canCreatePatchDraftFromStatus(status: string) {
  return status === "new" || status === "already-known";
}

export function createPatchDraftChangedItems(
  detectedType: UpdateDetectedType,
): readonly PatchChangedItem[] {
  const hint = reviewHints[detectedType];

  return [
    {
      type: "other",
      itemId: `${detectedType}-review`,
      itemName: hint.itemName,
      summary: hint.summary,
    },
  ];
}
