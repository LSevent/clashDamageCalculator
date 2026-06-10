import type { DataAuditSummary } from "@/src/types/game/data-audit";

import { Card } from "@/src/components/ui/Card";

type DataCoverageSummaryProps = {
  audit: DataAuditSummary;
};

function coverageLabel(covered: number, total: number) {
  if (total === 0) {
    return "No level data";
  }

  return `${covered} of ${total}`;
}

export function DataCoverageSummary({ audit }: DataCoverageSummaryProps) {
  const metrics = [
    { label: "Buildings", value: audit.totalBuildings },
    { label: "Building levels", value: audit.totalBuildingLevels },
    { label: "Equipment", value: audit.totalEquipment },
    { label: "Equipment levels", value: audit.totalEquipmentLevels },
    { label: "Spells", value: audit.totalSpells },
    { label: "Spell levels", value: audit.totalSpellLevels },
    {
      label: "Sourced level entries",
      value: coverageLabel(
        audit.coverage.withSourceUrl,
        audit.totalLevelEntries,
      ),
    },
    {
      label: "Versioned level entries",
      value: coverageLabel(audit.coverage.withPatchId, audit.totalLevelEntries),
    },
  ];

  return (
    <section aria-labelledby="coverage-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
            Coverage
          </p>
          <h2
            id="coverage-heading"
            className="mt-2 text-2xl font-black text-white"
          >
            Static data snapshot
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {audit.partialDataItems} partial and {audit.needsReviewDataItems}{" "}
          needs-review definitions
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-black text-white">{metric.value}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">
        Coverage ratios count stored level entries, not complete in-game level
        tables. Empty catalog entries remain visible as partial data.
      </p>
    </section>
  );
}
