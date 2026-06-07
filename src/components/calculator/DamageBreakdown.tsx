import type { DamageBreakdownItem } from "@/src/types/game/calculator";

type DamageBreakdownProps = {
  breakdown: readonly DamageBreakdownItem[];
};

function formatPercent(percent?: number) {
  if (percent === undefined) {
    return undefined;
  }

  return `${(percent * 100).toFixed(2)}%`;
}

export function DamageBreakdown({ breakdown }: DamageBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
        Enable at least one damage source to see a breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {breakdown.map((item) => (
        <article
          key={`${item.sourceType}-${item.sourceId}-${item.level}-${item.count ?? 1}`}
          className="rounded-xl border border-white/8 bg-black/20 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-black text-white">
                {item.sourceName} Lv{item.level}
                {item.count !== undefined ? ` x ${item.count}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {item.baseDamage !== undefined && (
                  <span>Base: {item.baseDamage}</span>
                )}
                {item.damagePercent !== undefined && (
                  <span>Percent: {formatPercent(item.damagePercent)}</span>
                )}
                {item.effectivePercent !== undefined && (
                  <span>Effective: {formatPercent(item.effectivePercent)}</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm font-black text-white">
              {item.finalDamage} damage
            </div>
          </div>

          {item.notes.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-amber-200">
              {item.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

