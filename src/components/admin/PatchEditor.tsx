import type { AdminPatchRow } from "@/src/lib/admin/admin-data";
import { savePatchAction } from "@/src/lib/admin/admin-actions";
import { adminVerificationStatuses } from "@/src/types/admin";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "./admin-styles";
import { SourceUrlField } from "./SourceUrlField";
import { VerificationBadge } from "./VerificationBadge";

type PatchEditorProps = {
  patches: readonly AdminPatchRow[];
  selectedPatchId?: string;
};

function dateValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function PatchForm({ patch }: { patch?: AdminPatchRow }) {
  return (
    <form action={savePatchAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/patches" />
      {patch ? (
        <input name="recordId" type="hidden" value={patch.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className={adminLabelClass}>
          Patch ID
          <input
            className={adminInputClass}
            name="id"
            defaultValue={patch?.id ?? ""}
            readOnly={Boolean(patch)}
            placeholder="june-2026"
            required
          />
        </label>
        <label className={adminLabelClass}>
          Name
          <input
            className={adminInputClass}
            name="name"
            defaultValue={patch?.name ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Release date
          <input
            className={adminInputClass}
            name="releaseDate"
            type="date"
            defaultValue={dateValue(patch?.releaseDate ?? null)}
          />
        </label>
        <label className={adminLabelClass}>
          Verified date
          <input
            className={adminInputClass}
            name="verifiedAt"
            type="date"
            defaultValue={dateValue(patch?.verifiedAt ?? null)}
          />
        </label>
        <label className={adminLabelClass}>
          Verification status
          <select
            className={adminInputClass}
            name="verificationStatus"
            defaultValue={patch?.verificationStatus ?? "needs-review"}
          >
            {adminVerificationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <SourceUrlField defaultValue={patch?.sourceUrl} />
      </div>

      <label className={adminLabelClass}>
        Notes
        <textarea
          className={`${adminInputClass} min-h-28 resize-y`}
          name="notes"
          defaultValue={patch?.notes ?? ""}
        />
      </label>

      <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
        <input
          className="size-4 accent-emerald-400"
          name="isCurrent"
          type="checkbox"
          defaultChecked={patch?.isCurrent ?? false}
        />
        Mark as current patch
      </label>

      <button className={adminPrimaryButtonClass} type="submit">
        Save patch
      </button>
    </form>
  );
}

export function PatchEditor({
  patches,
  selectedPatchId,
}: PatchEditorProps) {
  return (
    <div className="grid gap-6">
      <details
        className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6"
        open={patches.length === 0}
      >
        <summary className="cursor-pointer text-lg font-black text-white">
          Create patch
        </summary>
        <div className="mt-6">
          <PatchForm />
        </div>
      </details>

      {patches.map((patch) => (
        <details
          key={patch.id}
          id={`patch-${patch.id}`}
          className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
          open={patch.id === selectedPatchId}
        >
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-white">{patch.name}</p>
                {patch.updateCheckResultId ? (
                  <p className="mt-2 text-xs font-bold text-violet-300">
                    Created from official update checker
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  {patch.id}
                  {patch.isCurrent ? " · Current patch" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {patch.sourceUrl ? (
                  <a
                    className="text-sm font-bold text-emerald-300 hover:text-emerald-200"
                    href={patch.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source
                  </a>
                ) : null}
                <a
                  className="text-sm font-bold text-violet-300 hover:text-violet-200"
                  href={`/admin/patches/${encodeURIComponent(patch.id)}/suggestions`}
                >
                  Review stat suggestions
                </a>
                <VerificationBadge status={patch.verificationStatus} />
              </div>
            </div>
          </summary>
          <div className="mt-6 border-t border-white/8 pt-6">
            <PatchForm patch={patch} />
          </div>
        </details>
      ))}
    </div>
  );
}
