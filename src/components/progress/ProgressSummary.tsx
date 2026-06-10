import { equipment, spells } from "@/src/data/game";
import { Badge } from "@/src/components/ui/Badge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import type { UserProgress } from "@/src/types/game/user-progress";

type ProgressSummaryProps = {
  progress: UserProgress | undefined;
};

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProgressSummary({ progress }: ProgressSummaryProps) {
  if (!progress) {
    return (
      <EmptyState
        title="No saved progress yet"
        description="Set your levels manually to make the calculator easier to use."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Current progress
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Town Hall {progress.townHallLevel}
          </h2>
          {progress.playerTag && (
            <p className="mt-1 text-sm text-slate-500">{progress.playerTag}</p>
          )}
        </div>
        <Badge tone="info">
          Source: {progress.source === "json-import" ? "JSON import" : "Manual"}
        </Badge>
      </div>

      <dl className="mt-5 divide-y divide-white/8">
        {equipment.filter((item) => item.calculatorEnabled).map((item) => (
          <SummaryRow
            key={item.id}
            label={item.name}
            value={
              progress.equipmentLevels[item.id] !== undefined
                ? `Lv${progress.equipmentLevels[item.id]}`
                : "Not set"
            }
          />
        ))}
        {spells.filter((spell) => spell.calculatorEnabled).map((spell) => (
          <SummaryRow
            key={spell.id}
            label={spell.name}
            value={
              progress.spellLevels[spell.id] !== undefined
                ? `Lv${progress.spellLevels[spell.id]}`
                : "Not set"
            }
          />
        ))}
        <SummaryRow
          label="Last updated"
          value={formatUpdatedAt(progress.updatedAt)}
        />
      </dl>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-black text-slate-200">{value}</dd>
    </div>
  );
}
