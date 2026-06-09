"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { UserProgress } from "@/src/types/game/user-progress";

import {
  clearUserProgress,
  getDefaultUserProgress,
  getRawUserProgress,
  parseUserProgress,
  saveUserProgress,
  USER_PROGRESS_CHANGED_EVENT,
  USER_PROGRESS_STORAGE_KEY,
} from "./user-progress";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(USER_PROGRESS_CHANGED_EVENT, onStoreChange);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === USER_PROGRESS_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(USER_PROGRESS_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerSnapshot() {
  return "";
}

export function useUserProgress() {
  const rawProgress = useSyncExternalStore(
    subscribe,
    getRawUserProgress,
    getServerSnapshot,
  );

  const savedProgress = useMemo(() => {
    if (!rawProgress) {
      return undefined;
    }

    try {
      return parseUserProgress(JSON.parse(rawProgress));
    } catch {
      return undefined;
    }
  }, [rawProgress]);

  const progress = useMemo(
    () => savedProgress ?? getDefaultUserProgress(),
    [savedProgress],
  );

  const saveProgress = useCallback((nextProgress: UserProgress) => {
    return saveUserProgress(nextProgress);
  }, []);

  const clearProgress = useCallback(() => {
    clearUserProgress();
  }, []);

  return {
    progress,
    savedProgress,
    hasSavedProgress: savedProgress !== undefined,
    saveProgress,
    clearProgress,
  };
}

