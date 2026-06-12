import type { UpdateDetectedType } from "@/src/types/admin-update-check";

function includesAny(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function classifyOfficialPost(
  title: string,
  url = "",
): UpdateDetectedType {
  const value = `${title} ${url}`.toLowerCase().replace(/\s+/g, " ").trim();

  if (!value) {
    return "unknown";
  }

  if (
    includesAny(value, [
      "state of gameplay",
      "balance update",
      "balance changes",
      "balancing",
      "gameplay changes",
    ])
  ) {
    return "balance-update";
  }

  if (
    includesAny(value, [
      "hero equipment",
      "epic equipment",
      "new equipment",
      "equipment",
    ])
  ) {
    return "equipment";
  }

  if (value.includes("spell")) {
    return "spell";
  }

  if (
    includesAny(value, [
      "medal event",
      "event",
      "season",
      "challenge",
      "clan games",
    ])
  ) {
    return "event";
  }

  if (
    includesAny(value, [
      "release notes",
      "patch notes",
      "update notes",
      " update",
    ]) ||
    value.startsWith("update ")
  ) {
    return "patch-notes";
  }

  return "general-news";
}
