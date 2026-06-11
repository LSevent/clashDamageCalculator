import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { getGameDataCounts } from "@/src/lib/game/game-data-source";
import type { GameDataBundle } from "@/src/types/game/game-data";

type DataSourceStatusProps = {
  gameData: GameDataBundle;
};

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

function formatReachability(value: boolean | null) {
  if (value === null) {
    return "Unknown";
  }

  return formatBoolean(value);
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function DataSourceStatus({ gameData }: DataSourceStatusProps) {
  const currentPatch =
    gameData.patches.find((patch) => patch.id === gameData.currentPatchId) ??
    gameData.patches.find((patch) => patch.isCurrent);
  const counts = getGameDataCounts(gameData);
  const metrics = [
    { label: "Database configured", value: formatBoolean(gameData.databaseConfigured) },
    {
      label: "Database reachable",
      value: formatReachability(gameData.databaseReachable),
    },
    { label: "Seeded data found", value: formatBoolean(gameData.seeded) },
    { label: "Current patch", value: currentPatch?.name ?? "Not detected" },
    { label: "Patches", value: counts.patches },
    { label: "Buildings", value: counts.buildings },
    { label: "Equipment", value: counts.equipment },
    { label: "Spells", value: counts.spells },
  ];

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Data source status
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {gameData.source === "database"
              ? "The dashboard and calculator are using seeded PostgreSQL records."
              : gameData.fallbackReason}
          </p>
        </div>
        <Badge tone={gameData.source === "database" ? "success" : "warning"}>
          Data source:{" "}
          {gameData.source === "database" ? "Database" : "Static fallback"}
        </Badge>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
          >
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              {metric.label}
            </dt>
            <dd className="mt-2 break-words text-sm font-black text-slate-200">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs text-slate-600">
        Last checked: {formatCheckedAt(gameData.checkedAt)}
      </p>
    </Card>
  );
}
