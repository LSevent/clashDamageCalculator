import type { PatchInfo } from "@/src/types/game/game-data";

import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";

type PatchChangeLogProps = {
  patches: readonly PatchInfo[];
};

const statusTone = {
  verified: "success",
  partial: "warning",
  "needs-review": "neutral",
  draft: "neutral",
  "pending-review": "warning",
  rejected: "neutral",
} as const;

function formatDate(value: string | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function PatchChangeLog({ patches }: PatchChangeLogProps) {
  const sortedPatches = [...patches].sort((left, right) =>
    (right.releaseDate ?? "").localeCompare(left.releaseDate ?? ""),
  );

  return (
    <section aria-labelledby="change-log-heading">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
        History
      </p>
      <h2
        id="change-log-heading"
        className="mt-2 text-2xl font-black text-white"
      >
        Patch change log
      </h2>

      <div className="mt-5 grid gap-4">
        {sortedPatches.map((patch) => {
          const sourceUrls =
            patch.sourceUrls ?? (patch.sourceUrl ? [patch.sourceUrl] : []);

          return (
          <Card key={patch.id} className="p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{patch.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Released {formatDate(patch.releaseDate)}
                </p>
              </div>
              <Badge tone={statusTone[patch.verificationStatus]}>
                {patch.verificationStatus.replaceAll("-", " ")}
              </Badge>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              {patch.notes}
            </p>

            {patch.changedItems && patch.changedItems.length > 0 && (
              <div className="mt-5 border-t border-white/8 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tracked changes
                </p>
                <ul className="mt-3 grid gap-3">
                  {patch.changedItems.map((item) => (
                    <li key={`${item.type}-${item.itemId}`}>
                      <span className="font-bold text-slate-200">
                        {item.itemName}:
                      </span>{" "}
                      <span className="text-sm text-slate-400">
                        {item.summary}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5">
              {sourceUrls.length > 0 ? (
                <span className="flex flex-wrap gap-4">
                  {sourceUrls.map((sourceUrl, index) => (
                    <a
                      key={sourceUrl}
                      className="text-sm font-bold text-emerald-300 underline decoration-emerald-300/30 underline-offset-4 hover:text-emerald-200"
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source {index + 1}
                    </a>
                  ))}
                </span>
              ) : (
                <span className="text-sm text-slate-600">Source pending</span>
              )}
            </div>
          </Card>
          );
        })}
      </div>
    </section>
  );
}
