import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDefaultUserProgress,
  getUserProgress,
  hasUserProgress,
  saveUserProgress,
  USER_PROGRESS_STORAGE_KEY,
  validateUserProgress,
} from "./user-progress";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("user progress", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("creates defaults from the latest known static data levels", () => {
    expect(getDefaultUserProgress()).toEqual({
      townHallLevel: 18,
      equipmentLevels: {
        "giant-arrow": 18,
        "rocket-backpack": 24,
      },
      spellLevels: {
        "earthquake-spell": 5,
      },
      updatedAt: "",
      source: "manual",
    });
  });

  it("validates available equipment and spell levels", () => {
    const result = validateUserProgress({
      playerTag: " #ABC123 ",
      townHallLevel: 15,
      equipmentLevels: {
        "giant-arrow": 18,
        "rocket-backpack": 24,
      },
      spellLevels: {
        "earthquake-spell": 5,
      },
      updatedAt: "2026-06-09T12:00:00.000Z",
      source: "manual",
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.progress.playerTag).toBe("#ABC123");
    }
  });

  it("rejects unavailable static data levels", () => {
    const result = validateUserProgress({
      townHallLevel: 15,
      equipmentLevels: {
        "giant-arrow": 17,
      },
      spellLevels: {
        "earthquake-spell": 4,
      },
      updatedAt: "2026-06-09T12:00:00.000Z",
      source: "manual",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.equipmentLevels?.["giant-arrow"]).toContain(
        "not available",
      );
      expect(result.errors.spellLevels?.["earthquake-spell"]).toContain(
        "not available",
      );
    }
  });

  it("falls back safely when stored progress is corrupted", () => {
    localStorage.setItem(USER_PROGRESS_STORAGE_KEY, "{not-json");

    expect(hasUserProgress()).toBe(false);
    expect(getUserProgress()).toEqual(getDefaultUserProgress());
  });

  it("saves and reads valid progress", () => {
    const progress = {
      ...getDefaultUserProgress(),
      townHallLevel: 16,
      updatedAt: "2026-06-09T12:00:00.000Z",
    };

    expect(saveUserProgress(progress)).toBe(true);
    expect(hasUserProgress()).toBe(true);
    expect(getUserProgress()).toEqual(progress);
  });
});

