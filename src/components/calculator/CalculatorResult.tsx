import { Badge } from "@/src/components/ui/Badge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatNumber } from "@/src/lib/format-number";
import type {
  BuildingTarget,
  DamageCalculationResult,
  MinimumEarthquakeResult,
} from "@/src/types/game/calculator";

import { DamageBreakdown } from "./DamageBreakdown";

type CalculatorResultProps = {
  target: BuildingTarget | undefined;
  result: DamageCalculationResult | undefined;
  minimumEarthquakes: MinimumEarthquakeResult | undefined;
  missingReason: string | undefined;
};

function getMinimumEarthquakeLabel(
  minimumEarthquakes: MinimumEarthquakeResult | undefined,
) {
  if (!minimumEarthquakes) {
    return "Unavailable";
  }

  if (!minimumEarthquakes.possible) {
    return "Not possible within selected max Earthquake limit";
  }

  return minimumEarthquakes.earthquakeCount === 0
    ? "No Earthquake needed"
    : `${minimumEarthquakes.earthquakeCount} Earthquake ${
        minimumEarthquakes.earthquakeCount === 1 ? "spell" : "spells"
      }`;
}

export function CalculatorResult({
  target,
  result,
  minimumEarthquakes,
  missingReason,
}: CalculatorResultProps) {
  if (!target || !result) {
    return (
      <div className="space-y-5">
        <EmptyState
          title="Calculation unavailable"
          description={
            missingReason ??
            "Choose a target with HP data and at least one valid damage source."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Target
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              TH{target.townHallLevel} {target.buildingName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Level {target.buildingLevel}
              {target.superchargeLevel
                ? `, Supercharge ${target.superchargeLevel}`
                : ""}
            </p>
          </div>
          <Badge tone={result.destroyed ? "success" : "warning"}>
            {result.destroyed ? "Destroyed" : "Not destroyed"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Building HP" value={result.buildingHp} />
          <Stat label="Total damage" value={result.totalDamage} />
          <Stat label="Direct damage" value={result.directDamage} />
          <Stat label="Spell damage" value={result.spellDamage} />
          <Stat label="Remaining HP" value={result.remainingHp} />
          <Stat label="Overkill damage" value={result.overkillDamage} />
        </div>

        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Minimum Earthquake needed
          </p>
          <p className="mt-2 text-sm font-black text-white">
            {getMinimumEarthquakeLabel(minimumEarthquakes)}
          </p>
        </div>

        {result.notes.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/8 p-4 text-sm leading-6 text-amber-100">
            {result.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
          Damage breakdown
        </h3>
        <DamageBreakdown breakdown={result.breakdown} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}
