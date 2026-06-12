import { Card } from "@/src/components/ui/Card";
import type { UpdateSourceView } from "@/src/types/admin-update-check";

type UpdateSourceListProps = {
  sources: readonly UpdateSourceView[];
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Never checked";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function UpdateSourceList({ sources }: UpdateSourceListProps) {
  return (
    <Card className="p-6 sm:p-8">
      <h3 className="text-lg font-black text-white">Official sources</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Checks are restricted to configured official Supercell Clash of Clans
        blog sources.
      </p>

      {sources.length === 0 ? (
        <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          No update sources are configured. Run the database seed.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-black text-white">{source.name}</p>
                  <a
                    className="mt-1 block break-all text-sm font-bold text-emerald-300 hover:text-emerald-200"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.url}
                  </a>
                </div>
                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${
                    source.enabled
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  {source.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Last checked: {formatDateTime(source.lastCheckedAt)} UTC
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
