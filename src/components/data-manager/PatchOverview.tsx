import type { PatchInfo } from "@/src/types/game/game-data";

import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";

type PatchOverviewProps = {
  patch?: PatchInfo;
};

const statusTone = {
  verified: "success",
  partial: "warning",
  "needs-review": "neutral",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatStatus(status: PatchInfo["verificationStatus"]) {
  return status.replace("-", " ");
}

export function PatchOverview({ patch }: PatchOverviewProps) {
  if (!patch) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-sm font-bold text-slate-300">
          No current patch is configured.
        </p>
      </Card>
    );
  }

  const sourceUrls = patch.sourceUrls ?? (patch.sourceUrl ? [patch.sourceUrl] : []);

  return (
    <Card className="overflow-hidden">
      {patch.verificationStatus !== "verified" && (
        <div className="border-b border-amber-300/15 bg-amber-300/[0.06] px-6 py-4 text-sm leading-6 text-amber-100 sm:px-8">
          Current patch data is marked as {patch.verificationStatus}. Calculator
          results may need verification for recently changed items.
        </div>
      )}

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
              Current patch
            </p>
            <Badge tone={statusTone[patch.verificationStatus]}>
              {formatStatus(patch.verificationStatus)}
            </Badge>
          </div>
          <h2 className="mt-4 text-2xl font-black text-white">{patch.name}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {patch.notes}
          </p>
        </div>

        <dl className="grid min-w-56 gap-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Released
            </dt>
            <dd className="mt-1 font-semibold text-slate-200">
              {formatDate(patch.releaseDate)}
            </dd>
          </div>
          {patch.verifiedAt && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Last reviewed
              </dt>
              <dd className="mt-1 font-semibold text-slate-200">
                {formatDate(patch.verifiedAt)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Source
            </dt>
            <dd className="mt-1">
              {sourceUrls.length > 0 ? (
                <span className="grid gap-1">
                  {sourceUrls.map((sourceUrl, index) => (
                    <a
                      key={sourceUrl}
                      className="font-bold text-emerald-300 underline decoration-emerald-300/30 underline-offset-4 hover:text-emerald-200"
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {index === 0 ? "View primary source" : `Related source ${index + 1}`}
                    </a>
                  ))}
                </span>
              ) : (
                <span className="text-slate-500">Source pending</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
