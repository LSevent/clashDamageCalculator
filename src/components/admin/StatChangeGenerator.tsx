import { generateStatChangeSuggestionsAction } from "@/src/lib/admin/stat-change-actions";
import type { StatChangePatchView } from "@/src/types/admin-stat-change";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "./admin-styles";

type StatChangeGeneratorProps = {
  patch: StatChangePatchView;
};

export function StatChangeGenerator({ patch }: StatChangeGeneratorProps) {
  return (
    <section className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-6 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
        Conservative generator
      </p>
      <h2 className="mt-3 text-xl font-black text-white">
        Generate suggested stat changes
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
        Clear level, field, and value patterns may become pending suggestions.
        Ambiguous content becomes a review hint. Nothing is applied
        automatically.
      </p>

      <form
        action={generateStatChangeSuggestionsAction}
        className="mt-6 grid gap-5"
      >
        <input type="hidden" name="patchId" value={patch.id} />

        <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
          <input
            className="mt-0.5 size-4 accent-emerald-400"
            type="checkbox"
            name="useSourceUrl"
            defaultChecked={Boolean(patch.sourceUrl)}
            disabled={!patch.sourceUrl}
          />
          <span>
            <span className="font-bold text-white">
              Generate from stored official source URL
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Only the patch&apos;s stored official Supercell post URL can be
              fetched.
            </span>
          </span>
        </label>

        <label className={adminLabelClass}>
          Optional official source excerpt
          <textarea
            className={`${adminInputClass} min-h-40 resize-y`}
            name="sourceExcerpt"
            maxLength={20_000}
            placeholder="Giant Arrow Level 18 damage: 1500"
          />
          <span className="mt-2 block normal-case tracking-normal text-slate-600">
            Maximum 20,000 characters. Use an excerpt you reviewed from the
            official source.
          </span>
        </label>

        <label className={adminLabelClass}>
          Regenerate mode
          <select
            className={adminInputClass}
            name="regenerateMode"
            defaultValue="append-new"
          >
            <option value="append-new">Append new suggestions</option>
            <option value="replace-pending">
              Replace pending and needs-info suggestions
            </option>
          </select>
        </label>

        <div>
          <button className={adminPrimaryButtonClass} type="submit">
            Generate Suggestions
          </button>
        </div>
      </form>

      <p className="mt-5 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-4 text-sm leading-6 text-sky-100/80">
        Generated suggestions are not applied automatically. Admin review,
        approval, and a separate apply action are required.
      </p>
    </section>
  );
}
