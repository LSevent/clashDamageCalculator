"use client";

import { useState, useTransition } from "react";

import {
  commitBulkImportAction,
  previewBulkImportAction,
} from "@/src/lib/admin/bulk-import-actions";
import { maxCsvBytes } from "@/src/lib/admin/bulk-import";
import { Card } from "@/src/components/ui/Card";
import type {
  BulkImportActionState,
  BulkImportType,
} from "@/src/types/admin-bulk-import";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "./admin-styles";
import { BulkImportPreview } from "./BulkImportPreview";

type BulkImportPanelProps = {
  databaseAvailable: boolean;
};

const emptyState: BulkImportActionState = { ok: false };

export function BulkImportPanel({
  databaseAvailable,
}: BulkImportPanelProps) {
  const [type, setType] = useState<BulkImportType>("building-levels");
  const [csv, setCsv] = useState("");
  const [state, setState] = useState<BulkImportActionState>(emptyState);
  const [reviewed, setReviewed] = useState(false);
  const [pending, startTransition] = useTransition();

  function resetPreview(nextCsv = csv) {
    setCsv(nextCsv);
    setState(emptyState);
    setReviewed(false);
  }

  function formData() {
    const data = new FormData();
    data.set("type", type);
    data.set("csv", csv);
    return data;
  }

  function preview() {
    startTransition(async () => {
      setState(await previewBulkImportAction(formData()));
      setReviewed(false);
    });
  }

  function commit() {
    const data = formData();
    data.set("reviewed", reviewed ? "true" : "false");
    startTransition(async () => {
      setState(await commitBulkImportAction(data));
    });
  }

  async function loadFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > maxCsvBytes) {
      setState({ ok: false, error: "CSV exceeds the 1 MB import limit." });
      return;
    }
    resetPreview(await file.text());
  }

  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-xl font-black text-white">Import CSV</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Paste or upload curated CSV. Nothing is saved until a server-generated
        preview is reviewed and confirmed.
      </p>

      {!databaseAvailable ? (
        <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          Database is unavailable. Import preview and commit require database
          access.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className={adminLabelClass}>
            Import type
            <select
              className={adminInputClass}
              value={type}
              onChange={(event) => {
                setType(event.target.value as BulkImportType);
                setState(emptyState);
                setReviewed(false);
              }}
            >
              <option value="building-levels">
                Building HP / building levels
              </option>
              <option value="equipment-levels">Equipment levels</option>
              <option value="spell-levels">Spell levels</option>
            </select>
          </label>
          <label className={adminLabelClass}>
            Upload CSV file
            <input
              className={`${adminInputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-300/10 file:px-3 file:py-1.5 file:font-bold file:text-emerald-300`}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void loadFile(event.target.files?.[0])}
            />
          </label>
        </div>

        <label className={adminLabelClass}>
          CSV content
          <textarea
            className={`${adminInputClass} min-h-72 resize-y font-mono text-xs leading-5`}
            value={csv}
            maxLength={maxCsvBytes}
            onChange={(event) => resetPreview(event.target.value)}
            placeholder="Paste a CSV header and rows here..."
          />
          <span className="mt-2 block normal-case tracking-normal text-slate-600">
            Maximum 1 MB and 5,000 data rows. Blank lines are ignored.
          </span>
        </label>

        {state.error ? (
          <p className="rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}
        {state.result ? (
          <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-200">
            Import complete: {state.result.created} created,{" "}
            {state.result.updated} updated, {state.result.unchanged} unchanged,{" "}
            {state.result.invalid} invalid, {state.result.skipped} skipped.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className={adminPrimaryButtonClass}
            type="button"
            disabled={pending || !databaseAvailable || !csv.trim()}
            onClick={preview}
          >
            {pending ? "Working..." : "Preview import"}
          </button>
          <button
            className={adminSecondaryButtonClass}
            type="button"
            disabled={pending}
            onClick={() => resetPreview("")}
          >
            Clear
          </button>
        </div>
      </div>

      {state.preview ? (
        <>
          <BulkImportPreview preview={state.preview} />
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
            <p className="text-sm font-bold text-amber-100">
              This will update database game data used by the calculator.
            </p>
            <label className="mt-4 flex items-start gap-3 text-sm text-slate-300">
              <input
                className="mt-0.5 size-4 accent-emerald-400"
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              I reviewed the preview and want to apply these changes.
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className={adminPrimaryButtonClass}
                type="button"
                disabled={
                  pending ||
                  !reviewed ||
                  state.preview.parseErrors.length > 0 ||
                  state.preview.summary.newRows +
                    state.preview.summary.updateRows ===
                    0
                }
                onClick={commit}
              >
                Confirm import
              </button>
              <button
                className={adminSecondaryButtonClass}
                type="button"
                disabled={pending}
                onClick={() => {
                  setState(emptyState);
                  setReviewed(false);
                }}
              >
                Cancel preview
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
