"use client";

import { useState } from "react";

import {
  importedPreviewToUserProgress,
  MAX_JSON_IMPORT_LENGTH,
  parseVillageSnapshotJson,
} from "@/src/lib/game/json-importer";
import type { ImportedProgressPreview } from "@/src/types/game/imported-progress";
import type { UserProgress } from "@/src/types/game/user-progress";

import { JsonImportPreview } from "./JsonImportPreview";

type JsonImportPanelProps = {
  baseProgress: UserProgress;
  onSaveImportedProgress: (progress: UserProgress) => boolean;
};

export function JsonImportPanel({
  baseProgress,
  onSaveImportedProgress,
}: JsonImportPanelProps) {
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<ImportedProgressPreview>();
  const [error, setError] = useState<string>();

  function clearImport() {
    setJsonText("");
    setPreview(undefined);
    setError(undefined);
  }

  function handlePreview() {
    const result = parseVillageSnapshotJson(jsonText);

    if (!result.success) {
      setPreview(undefined);
      setError(result.error);
      return;
    }

    setError(undefined);
    setPreview(result.preview);
  }

  function handleSave() {
    if (!preview) {
      return;
    }

    const importedProgress = importedPreviewToUserProgress(
      preview,
      baseProgress,
    );

    if (!importedProgress) {
      setError(
        "Imported progress could not be normalized against the current app data.",
      );
      return;
    }

    if (onSaveImportedProgress(importedProgress)) {
      clearImport();
    } else {
      setError(
        "Imported progress could not be saved. Browser storage may be unavailable.",
      );
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky-300">
            Optional JSON Import
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Preview a village snapshot
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            JSON import is optional. You can always use manual setup instead.
            Only paste JSON that you own and voluntarily provide. This app does
            not extract data from Clash of Clans.
          </p>
        </div>
        <span className="w-fit rounded-full border border-sky-300/15 bg-sky-300/8 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-200">
          Local processing
        </span>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-bold text-slate-300">
        Village snapshot JSON
        <textarea
          value={jsonText}
          maxLength={MAX_JSON_IMPORT_LENGTH}
          rows={10}
          spellCheck={false}
          placeholder={'{"tag":"#PLAYER","buildings":[],"equipment":[],"spells":[]}'}
          onChange={(event) => {
            setJsonText(event.target.value);
            setPreview(undefined);
            setError(undefined);
          }}
          className="min-h-56 resize-y rounded-xl border border-white/10 bg-[#08120f] p-4 font-mono text-xs leading-6 text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-sky-300/50"
        />
      </label>
      <p className="mt-2 text-right text-xs text-slate-600">
        {jsonText.length.toLocaleString()} /{" "}
        {MAX_JSON_IMPORT_LENGTH.toLocaleString()} characters
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-200"
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handlePreview}
          className="rounded-xl bg-sky-300 px-5 py-3 text-sm font-extrabold text-sky-950 transition hover:bg-sky-200"
        >
          Preview Import
        </button>
        <button
          type="button"
          onClick={clearImport}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
        >
          Clear JSON
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-black/15 p-4 text-sm leading-6 text-slate-500">
        Your pasted JSON is processed locally in your browser. The raw JSON is
        not stored after saving. Never paste a Supercell ID, email, password,
        recovery code, or 2FA code.
      </div>

      {preview && (
        <JsonImportPreview
          preview={preview}
          onSave={handleSave}
          onCancel={() => {
            setPreview(undefined);
            setError(undefined);
          }}
        />
      )}
    </section>
  );
}

