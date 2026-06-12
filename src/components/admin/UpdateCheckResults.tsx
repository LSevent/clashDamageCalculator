import { Card } from "@/src/components/ui/Card";
import { ignoreUpdateResultAction } from "@/src/lib/admin/update-check-actions";
import type {
  UpdateCheckResultView,
  UpdateDetectedType,
  UpdateResultStatus,
} from "@/src/types/admin-update-check";

import { adminSecondaryButtonClass } from "./admin-styles";

type UpdateCheckResultsProps = {
  results: readonly UpdateCheckResultView[];
};

const typeLabels: Record<UpdateDetectedType, string> = {
  "patch-notes": "Patch notes",
  "balance-update": "Balance update",
  event: "Event",
  equipment: "Equipment",
  spell: "Spell",
  "general-news": "General news",
  unknown: "Unknown",
};

const statusClasses: Record<UpdateResultStatus, string> = {
  new: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  "already-known": "border-white/10 bg-white/5 text-slate-300",
  ignored: "border-amber-300/20 bg-amber-300/10 text-amber-200",
};

const statusLabels: Record<UpdateResultStatus, string> = {
  new: "New",
  "already-known": "Already known",
  ignored: "Ignored",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Date not detected";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function UpdateCheckResults({ results }: UpdateCheckResultsProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-black text-white">Detected posts</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Results are stored for review only. Up to the 100 most recent records
          are shown.
        </p>
      </div>

      {results.length === 0 ? (
        <p className="border-t border-white/8 px-6 py-8 text-sm text-slate-400 sm:px-8">
          No official posts have been detected yet.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-white/8">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-black/15 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Post</th>
                <th className="px-5 py-4">Published</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Checked</th>
                <th className="px-5 py-4">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {results.map((result) => (
                <tr key={result.id} className="align-top">
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClasses[result.status]}`}
                    >
                      {statusLabels[result.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-300">
                    {typeLabels[result.detectedType]}
                  </td>
                  <td className="max-w-sm px-5 py-4">
                    <a
                      className="font-black leading-5 text-white hover:text-emerald-200"
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {result.title}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {formatDate(result.publishedAt)}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {result.sourceName}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {formatDateTime(result.checkedAt)} UTC
                  </td>
                  <td className="px-5 py-4">
                    {result.status === "ignored" ? (
                      <span className="text-xs text-slate-500">No action</span>
                    ) : (
                      <form action={ignoreUpdateResultAction}>
                        <input type="hidden" name="resultId" value={result.id} />
                        <button
                          className={`${adminSecondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                          type="submit"
                        >
                          Ignore
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
