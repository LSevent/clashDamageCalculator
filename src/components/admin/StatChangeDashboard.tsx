import Link from "next/link";

import { Card } from "@/src/components/ui/Card";
import type { StatChangeDashboardData } from "@/src/types/admin-stat-change";

import { StatChangeGenerator } from "./StatChangeGenerator";
import { StatChangeSuggestionList } from "./StatChangeSuggestionList";
import { VerificationBadge } from "./VerificationBadge";

type StatChangeDashboardProps = {
  data?: StatChangeDashboardData;
  unavailableMessage?: string;
  showGenerator?: boolean;
};

export function StatChangeDashboard({
  data,
  unavailableMessage,
  showGenerator = false,
}: StatChangeDashboardProps) {
  if (!data) {
    return (
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-black text-white">
          Suggested stat changes unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {unavailableMessage ??
            "Suggested stat change workflow requires database access."}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Public calculator static fallback behavior is unchanged.
        </p>
      </Card>
    );
  }

  const metrics = [
    ["Pending review", data.summary.pendingReview],
    ["Approved", data.summary.approved],
    ["Needs info", data.summary.needsInfo],
    ["Rejected", data.summary.rejected],
    ["Applied", data.summary.applied],
    ["Review hints", data.summary.hints],
    ["Exact suggestions", data.summary.exact],
  ] as const;

  return (
    <div className="grid gap-6">
      {data.patch ? (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                Patch review
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                {data.patch.name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {data.patch.releaseDate ?? "Release date not recorded"}
              </p>
            </div>
            <VerificationBadge status={data.patch.verificationStatus} />
          </div>
          {data.patch.notes ? (
            <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-400">
              {data.patch.notes}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-4">
            {data.patch.sourceUrl ? (
              <a
                className="text-sm font-bold text-emerald-300 hover:text-emerald-200"
                href={data.patch.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open official source
              </a>
            ) : null}
            <Link
              className="text-sm font-bold text-slate-300 hover:text-white"
              href={{
                pathname: "/admin/data/patches",
                query: { patch: data.patch.id },
              }}
            >
              Open Patch Editor
            </Link>
          </div>
        </Card>
      ) : null}

      {showGenerator && data.patch ? (
        <StatChangeGenerator patch={data.patch} />
      ) : null}

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-black text-white">Suggestion summary</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
            >
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <StatChangeSuggestionList
        suggestions={data.suggestions}
        showPatch={!data.patch}
      />
    </div>
  );
}
