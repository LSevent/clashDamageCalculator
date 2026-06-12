import Link from "next/link";

import {
  applyApprovedStatChangeSuggestionAction,
  approveStatChangeSuggestionAction,
  markStatChangeNeedsInfoAction,
  rejectStatChangeSuggestionAction,
  updateStatChangeSuggestionAction,
} from "@/src/lib/admin/stat-change-actions";
import { adminVerificationStatuses } from "@/src/types/admin";
import {
  statChangeFieldNames,
  statChangeTargetKinds,
  type StatChangeSuggestionView,
} from "@/src/types/admin-stat-change";

import {
  adminDangerButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "./admin-styles";

type StatChangeSuggestionListProps = {
  suggestions: readonly StatChangeSuggestionView[];
  showPatch?: boolean;
};

const statusClass: Record<string, string> = {
  "pending-review": "border-sky-300/20 bg-sky-300/10 text-sky-200",
  approved: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  rejected: "border-red-300/20 bg-red-300/10 text-red-200",
  "needs-info": "border-amber-300/20 bg-amber-300/10 text-amber-200",
  applied: "border-violet-300/20 bg-violet-300/10 text-violet-200",
};

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Not set";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function inputValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

function SuggestionActions({
  suggestion,
}: {
  suggestion: StatChangeSuggestionView;
}) {
  const hidden = (
    <>
      <input type="hidden" name="patchId" value={suggestion.patchId} />
      <input type="hidden" name="suggestionId" value={suggestion.id} />
    </>
  );

  if (suggestion.status === "applied" || suggestion.status === "rejected") {
    return (
      <p className="text-xs text-slate-500">
        {suggestion.status === "applied"
          ? "Applied suggestions are read-only."
          : "Rejected suggestions are retained for history."}
      </p>
    );
  }

  if (suggestion.status === "approved") {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestion.targetKind !== "patch-note-hint" ? (
          <form action={applyApprovedStatChangeSuggestionAction}>
            {hidden}
            <button className={adminPrimaryButtonClass} type="submit">
              Apply Approved Change
            </button>
          </form>
        ) : (
          <span className="self-center text-xs text-slate-500">
            Review hints cannot be applied.
          </span>
        )}
        <form action={rejectStatChangeSuggestionAction}>
          {hidden}
          <button className={adminDangerButtonClass} type="submit">
            Reject
          </button>
        </form>
      </div>
    );
  }

  if (suggestion.status === "needs-info") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500">
          Save review edits to return this suggestion to pending review.
        </span>
        <form action={rejectStatChangeSuggestionAction}>
          {hidden}
          <button className={adminDangerButtonClass} type="submit">
            Reject
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form action={approveStatChangeSuggestionAction}>
        {hidden}
        <button className={adminPrimaryButtonClass} type="submit">
          Approve
        </button>
      </form>
      <form action={markStatChangeNeedsInfoAction}>
        {hidden}
        <button className={adminSecondaryButtonClass} type="submit">
          Needs Info
        </button>
      </form>
      <form action={rejectStatChangeSuggestionAction}>
        {hidden}
        <button className={adminDangerButtonClass} type="submit">
          Reject
        </button>
      </form>
    </div>
  );
}

export function StatChangeSuggestionList({
  suggestions,
  showPatch = false,
}: StatChangeSuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <p className="rounded-2xl border border-white/8 bg-white/[0.035] p-6 text-sm text-slate-400">
        No stat change suggestions have been generated yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {suggestions.map((suggestion) => {
        const editable =
          suggestion.status === "pending-review" ||
          suggestion.status === "needs-info";

        return (
          <details
            key={suggestion.id}
            className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  {showPatch ? (
                    <Link
                      className="text-xs font-extrabold uppercase tracking-wider text-emerald-400"
                      href={`/admin/patches/${encodeURIComponent(suggestion.patchId)}/suggestions`}
                    >
                      {suggestion.patchName}
                    </Link>
                  ) : null}
                  <h3 className="mt-1 font-black text-white">
                    {suggestion.targetName ??
                      suggestion.targetId ??
                      "Manual review hint"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {suggestion.targetKind.replaceAll("-", " ")}
                    {suggestion.level ? ` - Level ${suggestion.level}` : ""}
                    {suggestion.townHallLevel
                      ? ` - TH${suggestion.townHallLevel}`
                      : ""}
                    {suggestion.fieldName
                      ? ` - ${suggestion.fieldName}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClass[suggestion.status]}`}
                  >
                    {suggestion.status.replaceAll("-", " ")}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                    {suggestion.confidence} confidence
                  </span>
                </div>
              </div>
            </summary>

            <div className="mt-6 grid gap-6 border-t border-white/8 pt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Old value", displayValue(suggestion.oldValue)],
                  [
                    "Suggested value",
                    displayValue(suggestion.suggestedValue),
                  ],
                  ["Final value", displayValue(suggestion.finalValue)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/8 bg-black/10 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 break-words font-mono text-sm text-slate-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {suggestion.parserNotes ? (
                <p className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/80">
                  {suggestion.parserNotes}
                </p>
              ) : null}
              {suggestion.sourceExcerpt ? (
                <blockquote className="rounded-xl border-l-2 border-slate-600 bg-black/10 p-4 text-sm leading-6 text-slate-400">
                  {suggestion.sourceExcerpt}
                </blockquote>
              ) : null}

              {editable ? (
                <form
                  action={updateStatChangeSuggestionAction}
                  className="grid gap-5"
                >
                  <input
                    type="hidden"
                    name="patchId"
                    value={suggestion.patchId}
                  />
                  <input
                    type="hidden"
                    name="suggestionId"
                    value={suggestion.id}
                  />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <label className={adminLabelClass}>
                      Target kind
                      <select
                        className={adminInputClass}
                        name="targetKind"
                        defaultValue={suggestion.targetKind}
                      >
                        {statChangeTargetKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind.replaceAll("-", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={adminLabelClass}>
                      Target ID
                      <input
                        className={adminInputClass}
                        name="targetId"
                        defaultValue={suggestion.targetId ?? ""}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Target name
                      <input
                        className={adminInputClass}
                        name="targetName"
                        defaultValue={suggestion.targetName ?? ""}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Level
                      <input
                        className={adminInputClass}
                        name="level"
                        type="number"
                        min="1"
                        defaultValue={suggestion.level ?? ""}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Town Hall level
                      <input
                        className={adminInputClass}
                        name="townHallLevel"
                        type="number"
                        min="1"
                        max="18"
                        defaultValue={suggestion.townHallLevel ?? ""}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Supercharge level
                      <input
                        className={adminInputClass}
                        name="superchargeLevel"
                        type="number"
                        min="1"
                        defaultValue={suggestion.superchargeLevel ?? ""}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Field
                      <select
                        className={adminInputClass}
                        name="fieldName"
                        defaultValue={suggestion.fieldName ?? ""}
                      >
                        <option value="">No field (hint)</option>
                        {statChangeFieldNames.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={adminLabelClass}>
                      Final value
                      <input
                        className={adminInputClass}
                        name="finalValue"
                        defaultValue={inputValue(suggestion.finalValue)}
                      />
                    </label>
                    <label className={adminLabelClass}>
                      Verification status
                      <select
                        className={adminInputClass}
                        name="verificationStatus"
                        defaultValue={
                          suggestion.verificationStatus ?? "pending-review"
                        }
                      >
                        {adminVerificationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("-", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <input
                      className="size-4 accent-emerald-400"
                      type="checkbox"
                      name="isSupercharged"
                      defaultChecked={Boolean(suggestion.isSupercharged)}
                    />
                    Supercharged building row
                  </label>
                  <label className={adminLabelClass}>
                    Review notes
                    <textarea
                      className={`${adminInputClass} min-h-24 resize-y`}
                      name="notes"
                      defaultValue={suggestion.notes ?? ""}
                    />
                  </label>
                  <div>
                    <button
                      className={adminSecondaryButtonClass}
                      type="submit"
                    >
                      Save Review Edits
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3 text-sm">
                  {suggestion.sourceUrl ? (
                    <a
                      className="font-bold text-emerald-300 hover:text-emerald-200"
                      href={suggestion.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open official source
                    </a>
                  ) : (
                    <span className="text-slate-600">Source pending</span>
                  )}
                </div>
                <SuggestionActions suggestion={suggestion} />
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
