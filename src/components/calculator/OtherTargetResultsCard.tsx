import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { formatNumber } from "@/src/lib/format-number";
import type {
  CalculatedOtherTargetAnalysisResult,
  EquipmentDamageSource,
  MissingOtherTargetAnalysisResult,
  OtherTargetAnalysisSummary,
  SpellDamageSource,
} from "@/src/types/game/calculator";

type OtherTargetResultsCardProps = {
  analysis: OtherTargetAnalysisSummary;
  equipmentSources: readonly EquipmentDamageSource[];
  spellSources: readonly SpellDamageSource[];
};

export function OtherTargetResultsCard({
  analysis,
  equipmentSources,
  spellSources,
}: OtherTargetResultsCardProps) {
  const destroyedResults = analysis.results.filter(
    (result): result is CalculatedOtherTargetAnalysisResult =>
      result.status === "destroyed",
  );
  const notDestroyedResults = analysis.results.filter(
    (result): result is CalculatedOtherTargetAnalysisResult =>
      result.status === "not-destroyed",
  );
  const missingResults = analysis.results.filter(
    (result): result is MissingOtherTargetAnalysisResult =>
      result.status === "missing-data",
  );

  return (
    <Card className="mt-5 p-5 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
            Other target results
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            What else can this combo destroy?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Uses the same selected equipment, spell level, and Earthquake count
            against other available buildings at the selected enemy Town Hall.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Selected target is excluded from this list.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="success">
            Can destroy: {analysis.destroyedCount}
          </Badge>
          <Badge tone="warning">
            Cannot destroy: {analysis.notDestroyedCount}
          </Badge>
          <Badge tone="neutral">
            Missing data: {analysis.missingDataCount}
          </Badge>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Selected combo
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {equipmentSources.map((source) => (
            <span
              key={`${source.sourceId}-${source.level}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-300"
            >
              {source.sourceName} Lv{source.level}
            </span>
          ))}
          {spellSources.map((source) => (
            <span
              key={`${source.sourceId}-${source.level}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-bold text-slate-300"
            >
              {source.sourceName} Lv{source.level} x{source.count}
            </span>
          ))}
          {equipmentSources.length === 0 && spellSources.length === 0 && (
            <span className="text-slate-500">
              No damage sources are currently enabled.
            </span>
          )}
        </div>
      </div>

      {analysis.totalTargetsChecked === 0 ? (
        <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] p-5 text-sm text-slate-400">
          No other Home Village buildings are defined for this analysis.
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          <ResultSection
            title="Can destroy"
            emptyMessage="No other loaded targets can be destroyed with this combo."
            results={destroyedResults}
          />
          <ResultSection
            title="Cannot destroy"
            emptyMessage="No loaded targets survive this combo."
            results={notDestroyedResults}
          />
          {missingResults.length > 0 && (
            <MissingDataSection results={missingResults} />
          )}
        </div>
      )}
    </Card>
  );
}

type ResultSectionProps = {
  title: string;
  emptyMessage: string;
  results: readonly CalculatedOtherTargetAnalysisResult[];
};

function ResultSection({
  title,
  emptyMessage,
  results,
}: ResultSectionProps) {
  return (
    <section>
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h3>
      {results.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {results.map((result) => (
            <OtherTargetResultRow key={result.buildingId} result={result} />
          ))}
        </div>
      )}
    </section>
  );
}

function OtherTargetResultRow({
  result,
}: {
  result: CalculatedOtherTargetAnalysisResult;
}) {
  return (
    <article className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-white">{result.buildingName}</p>
          <p className="mt-1 text-xs text-slate-500">
            TH{result.townHallLevel}, Level {result.buildingLevel}
          </p>
        </div>
        <Badge tone={result.destroyed ? "success" : "warning"}>
          {result.destroyed ? "Destroyed" : "Survives"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <ResultValue label="HP" value={result.hp} />
        <ResultValue label="Total damage" value={result.totalDamage} />
        <ResultValue
          label={result.destroyed ? "Overkill" : "Remaining HP"}
          value={result.destroyed ? result.overkillDamage : result.remainingHp}
        />
      </dl>

      {result.notes.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-white/8 pt-3 text-xs leading-5 text-amber-100">
          {result.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function ResultValue({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
        {label}
      </dt>
      <dd className="mt-1 font-black text-slate-200">{formatNumber(value)}</dd>
    </div>
  );
}

function MissingDataSection({
  results,
}: {
  results: readonly MissingOtherTargetAnalysisResult[];
}) {
  return (
    <section>
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
        Missing data
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
          <article
            key={result.buildingId}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
          >
            <p className="font-black text-slate-300">{result.buildingName}</p>
            <p className="mt-1 text-xs text-slate-600">
              TH{result.townHallLevel}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {result.notes[0]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
