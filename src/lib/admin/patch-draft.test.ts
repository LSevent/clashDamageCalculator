import { describe, expect, it } from "vitest";

import {
  canCreatePatchDraftFromStatus,
  createPatchDraftBaseId,
  createPatchDraftChangedItems,
  createPatchDraftNotes,
  createUniquePatchId,
} from "./patch-draft";

describe("patch draft IDs", () => {
  it("creates a readable ID from title and published date", () => {
    expect(createPatchDraftBaseId("May Update", "2026-05-26")).toBe(
      "may-update-2026-05-26",
    );
  });

  it("normalizes special characters and falls back for an empty title", () => {
    expect(
      createPatchDraftBaseId("Anime Fury: Season #2!", "2026-06-01"),
    ).toBe("anime-fury-season-2-2026-06-01");
    expect(createPatchDraftBaseId(" !!! ")).toBe("official-update");
  });

  it("adds a short numeric suffix when an ID already exists", () => {
    expect(
      createUniquePatchId(
        "may-update-2026-05-26",
        new Set([
          "may-update-2026-05-26",
          "may-update-2026-05-26-2",
        ]),
      ),
    ).toBe("may-update-2026-05-26-3");
  });
});

describe("patch draft notes", () => {
  it("includes the review reminder and detected type", () => {
    const notes = createPatchDraftNotes("balance-update", true);

    expect(notes).toContain("Admin must review the source");
    expect(notes).toContain("Detected type: balance-update");
    expect(notes).not.toContain("Release date was not detected");
  });

  it("notes when the release date was not detected", () => {
    expect(createPatchDraftNotes("unknown", false)).toContain(
      "Release date was not detected automatically.",
    );
  });
});

describe("patch draft changed-item hints", () => {
  it.each([
    ["patch-notes", "Patch notes review required"],
    ["balance-update", "Balance changes review required"],
    ["equipment", "Equipment data review required"],
    ["spell", "Spell data review required"],
    ["event", "Event content review required"],
    ["unknown", "General update review required"],
  ] as const)("creates a generic review hint for %s", (type, expected) => {
    expect(createPatchDraftChangedItems(type)[0]?.summary).toBe(expected);
  });
});

describe("patch draft status eligibility", () => {
  it("allows new and already-known results only", () => {
    expect(canCreatePatchDraftFromStatus("new")).toBe(true);
    expect(canCreatePatchDraftFromStatus("already-known")).toBe(true);
    expect(canCreatePatchDraftFromStatus("ignored")).toBe(false);
    expect(canCreatePatchDraftFromStatus("patch-draft-created")).toBe(false);
  });
});
