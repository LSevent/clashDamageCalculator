import { Card } from "@/src/components/ui/Card";
import type { UpdateCheckerDashboardData } from "@/src/types/admin-update-check";

import { UpdateCheckButton } from "./UpdateCheckButton";
import { UpdateCheckResults } from "./UpdateCheckResults";
import { UpdateSourceList } from "./UpdateSourceList";

type UpdateCheckerDashboardProps = {
  data?: UpdateCheckerDashboardData;
  unavailableMessage?: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  return `${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function UpdateCheckerDashboard({
  data,
  unavailableMessage,
}: UpdateCheckerDashboardProps) {
  if (!data) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-300">
          Database required
        </p>
        <h2 className="mt-3 text-xl font-black text-white">
          Update checker unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {unavailableMessage ?? "Update checker requires database access."}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          The public Calculator and Data Manager continue using static fallback
          data.
        </p>
      </Card>
    );
  }

  const metrics = [
    ["Enabled sources", data.enabledSourceCount],
    ["New posts", data.newPostCount],
    ["Already known", data.alreadyKnownPostCount],
    ["Ignored", data.ignoredPostCount],
  ] as const;

  return (
    <div className="grid gap-6">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
              Manual official-source check
            </p>
            <h2 className="mt-3 text-xl font-black text-white">
              Check public Clash of Clans news
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              The server checks only configured official Supercell sources.
              Each source has a five-minute cooldown, and no calculator data is
              changed.
            </p>
            <div className="mt-6">
              <UpdateCheckButton
                disabled={data.enabledSourceCount === 0}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Last checked
            </p>
            <p className="mt-2 font-black text-white">
              {formatDateTime(data.lastCheckedAt)}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <UpdateSourceList sources={data.sources} />
      <UpdateCheckResults results={data.results} />

      <Card className="border-sky-300/15 bg-sky-300/[0.06] p-6">
        <p className="font-black text-sky-100">Review-only workflow</p>
        <p className="mt-2 text-sm leading-6 text-sky-100/80">
          Detected posts do not automatically update calculator stats. Admin
          review and approval are required in later phases.
        </p>
      </Card>
    </div>
  );
}
