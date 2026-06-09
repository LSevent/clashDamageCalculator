"use client";

import { useState } from "react";

import { equipment, spells } from "@/src/data/game";
import {
  getDefaultUserProgress,
  MAX_TOWN_HALL_LEVEL,
  MIN_TOWN_HALL_LEVEL,
  validateUserProgress,
} from "@/src/lib/game/user-progress";
import { useUserProgress } from "@/src/lib/game/use-user-progress";
import { Card } from "@/src/components/ui/Card";
import type {
  UserProgress,
  UserProgressValidationErrors,
} from "@/src/types/game/user-progress";

import { EquipmentProgressForm } from "./EquipmentProgressForm";
import { JsonImportPanel } from "./JsonImportPanel";
import { ProgressSummary } from "./ProgressSummary";
import { SpellProgressForm } from "./SpellProgressForm";

const townHallLevels = Array.from(
  { length: MAX_TOWN_HALL_LEVEL - MIN_TOWN_HALL_LEVEL + 1 },
  (_, index) => MAX_TOWN_HALL_LEVEL - index,
);

type ProgressEditorProps = {
  initialProgress: UserProgress;
  savedProgress: UserProgress | undefined;
  onSave: (progress: UserProgress) => boolean;
  onClear: () => void;
  statusMessage: string | undefined;
  statusTone: "success" | "error";
  onStatusChange: (
    message: string,
    tone?: "success" | "error",
  ) => void;
  onSaveImportedProgress: (progress: UserProgress) => boolean;
};

export function ProgressSetupForm() {
  const [statusMessage, setStatusMessage] = useState<string>();
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const {
    progress,
    savedProgress,
    saveProgress,
    clearProgress,
  } = useUserProgress();

  function handleStatusChange(
    message: string,
    tone: "success" | "error" = "success",
  ) {
    setStatusMessage(message);
    setStatusTone(tone);
  }

  return (
    <ProgressEditor
      key={savedProgress?.updatedAt ?? "default-progress"}
      initialProgress={progress}
      savedProgress={savedProgress}
      onSave={(nextProgress) => {
        const saved = saveProgress(nextProgress);
        handleStatusChange(
          saved
            ? "Progress saved locally on this device."
            : "Progress could not be saved. Browser storage may be unavailable.",
          saved ? "success" : "error",
        );
        return saved;
      }}
      onClear={() => {
        clearProgress();
        handleStatusChange("Saved progress cleared from this device.");
      }}
      statusMessage={statusMessage}
      statusTone={statusTone}
      onStatusChange={handleStatusChange}
      onSaveImportedProgress={(nextProgress) => {
        const saved = saveProgress(nextProgress);
        handleStatusChange(
          saved
            ? "Imported progress saved locally on this device."
            : "Imported progress could not be saved. Browser storage may be unavailable.",
          saved ? "success" : "error",
        );
        return saved;
      }}
    />
  );
}

function ProgressEditor({
  initialProgress,
  savedProgress,
  onSave,
  onClear,
  statusMessage,
  statusTone,
  onStatusChange,
  onSaveImportedProgress,
}: ProgressEditorProps) {
  const [draft, setDraft] = useState<UserProgress>(initialProgress);
  const [errors, setErrors] = useState<UserProgressValidationErrors>({});

  function handleSave() {
    const candidate: UserProgress = {
      ...(draft.playerTag?.trim()
        ? { playerTag: draft.playerTag.trim() }
        : {}),
      townHallLevel: draft.townHallLevel,
      equipmentLevels: { ...draft.equipmentLevels },
      spellLevels: { ...draft.spellLevels },
      updatedAt: new Date().toISOString(),
      source: "manual",
    };
    const validation = validateUserProgress(candidate);

    if (!validation.valid) {
      setErrors(validation.errors);
      onStatusChange("Please fix the highlighted progress fields.", "error");
      return;
    }

    if (!onSave(validation.progress)) {
      return;
    }

    setErrors({});
  }

  function handleReset() {
    setDraft(getDefaultUserProgress());
    setErrors({});
    onStatusChange(
      "Form reset to default levels. Save to keep these values.",
    );
  }

  function handleClear() {
    onClear();
    setDraft(getDefaultUserProgress());
    setErrors({});
  }

  return (
    <div className="mt-12">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
              Manual setup
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              Set your current levels
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manual progress is stored only in your browser. No Clash of Clans
              login is required.
            </p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-300">
            Local only
          </span>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <Card className="p-5 sm:p-7">
          <div className="space-y-8">
            <section>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-300">
                  Player tag (optional)
                  <input
                    type="text"
                    value={draft.playerTag ?? ""}
                    placeholder="#PLAYER"
                    autoComplete="off"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        playerTag: event.target.value,
                      }))
                    }
                    className="min-h-12 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-emerald-300/50"
                  />
                  {errors.playerTag && (
                    <span className="text-xs font-medium text-rose-300">
                      {errors.playerTag}
                    </span>
                  )}
                </label>

                <label className="grid gap-2 text-sm font-bold text-slate-300">
                  Town Hall level
                  <select
                    value={draft.townHallLevel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        townHallLevel: Number(event.target.value),
                      }))
                    }
                    className="min-h-12 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/50"
                  >
                    {townHallLevels.map((townHallLevel) => (
                      <option key={townHallLevel} value={townHallLevel}>
                        Town Hall {townHallLevel}
                      </option>
                    ))}
                  </select>
                  {errors.townHallLevel && (
                    <span className="text-xs font-medium text-rose-300">
                      {errors.townHallLevel}
                    </span>
                  )}
                </label>
              </div>
            </section>

            <EquipmentProgressForm
              equipmentItems={equipment}
              values={draft.equipmentLevels}
              errors={errors.equipmentLevels}
              onChange={(equipmentId, level) =>
                setDraft((current) => ({
                  ...current,
                  equipmentLevels: {
                    ...current.equipmentLevels,
                    [equipmentId]: level,
                  },
                }))
              }
            />

            <SpellProgressForm
              spellItems={spells}
              values={draft.spellLevels}
              errors={errors.spellLevels}
              onChange={(spellId, level) =>
                setDraft((current) => ({
                  ...current,
                  spellLevels: {
                    ...current.spellLevels,
                    [spellId]: level,
                  },
                }))
              }
            />

            <div className="rounded-xl border border-amber-300/15 bg-amber-300/8 p-4 text-sm leading-6 text-amber-100">
              The current static dataset is partial. Selectors only include
              verified levels already available to the calculator.
            </div>

            {statusMessage && (
              <div
                role="status"
                className={`rounded-xl border p-4 text-sm font-bold ${
                  statusTone === "success"
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                }`}
              >
                {statusMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-300"
              >
                Save progress
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-5 py-3 text-sm font-extrabold text-rose-200 transition hover:bg-rose-300/10"
              >
                Clear saved progress
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <ProgressSummary progress={savedProgress} />
        </Card>
      </div>

      <JsonImportPanel
        baseProgress={initialProgress}
        onSaveImportedProgress={onSaveImportedProgress}
      />
    </div>
  );
}
