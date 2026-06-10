import type {
  BuildingDefinition,
  DataVerificationStatus,
  EquipmentDefinition,
  SpellDefinition,
} from "@/src/types/game/game-data";

import {
  createBuildingAuditRows,
  createEquipmentAuditRows,
  createSpellAuditRows,
} from "@/src/lib/game/data-audit";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";

type StaticDataTableProps = {
  buildings: readonly BuildingDefinition[];
  equipment: readonly EquipmentDefinition[];
  spells: readonly SpellDefinition[];
};

function formatValue(value: string) {
  return value.replaceAll("-", " ");
}

function DataStatus({
  verificationStatus,
  missingSourceCount,
}: {
  verificationStatus: DataVerificationStatus;
  missingSourceCount: number;
}) {
  const tone =
    verificationStatus === "verified"
      ? "success"
      : verificationStatus === "partial"
        ? "warning"
        : "neutral";

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={tone}>
        {verificationStatus.replace("-", " ")}
      </Badge>
      {missingSourceCount > 0 && (
        <span className="text-xs text-slate-600">
          {missingSourceCount} source missing
        </span>
      )}
    </div>
  );
}

function SourceLinks({ sourceUrls }: { sourceUrls: readonly string[] }) {
  if (sourceUrls.length === 0) {
    return <span className="text-slate-600">Source pending</span>;
  }

  return (
    <div className="grid gap-1">
      {sourceUrls.map((sourceUrl, index) => (
        <a
          key={sourceUrl}
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-emerald-300 underline decoration-emerald-300/30 underline-offset-4 hover:text-emerald-200"
        >
          Source {index + 1}
        </a>
      ))}
    </div>
  );
}

function TableShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/8 px-5 py-5 sm:px-7">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

export function StaticDataTable({
  buildings,
  equipment,
  spells,
}: StaticDataTableProps) {
  const buildingRows = createBuildingAuditRows(buildings);
  const equipmentRows = createEquipmentAuditRows(equipment);
  const spellRows = createSpellAuditRows(spells);

  return (
    <section aria-labelledby="static-data-heading">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
        Definitions
      </p>
      <h2
        id="static-data-heading"
        className="mt-2 text-2xl font-black text-white"
      >
        Game data tables
      </h2>

      <div className="mt-5 grid gap-5">
        <TableShell
          title="Buildings"
          description="Home and Builder Village structures available to the app."
        >
          <table className="w-full min-w-216 text-left text-sm">
            <thead className="bg-black/15 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3 sm:px-7">Name</th>
                <th className="px-5 py-3">Village</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Supercharge</th>
                <th className="px-5 py-3">Levels</th>
                <th className="px-5 py-3">Latest patch</th>
                <th className="px-5 py-3">Sources</th>
                <th className="px-5 py-3">Data status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {buildings.map((building, index) => {
                const auditRow = buildingRows[index];

                return (
                  <tr key={building.id} className="text-slate-400">
                    <td className="px-5 py-4 font-bold text-slate-200 sm:px-7">
                      {building.name}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {building.village}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {formatValue(building.category)}
                    </td>
                    <td className="px-5 py-4">
                      {building.canBeSupercharged ? "Yes" : "No"}
                    </td>
                    <td className="px-5 py-4">{auditRow.levelCount}</td>
                    <td className="px-5 py-4">
                      {auditRow.latestPatchId ?? "Not added"}
                    </td>
                    <td className="px-5 py-4">
                      <SourceLinks sourceUrls={auditRow.sourceUrls} />
                    </td>
                    <td className="px-5 py-4">
                      <DataStatus
                        verificationStatus={auditRow.verificationStatus}
                        missingSourceCount={auditRow.missingSourceCount}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>

        <TableShell
          title="Equipment"
          description="Hero equipment with verified level snapshots."
        >
          <table className="w-full min-w-216 text-left text-sm">
            <thead className="bg-black/15 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3 sm:px-7">Name</th>
                <th className="px-5 py-3">Hero</th>
                <th className="px-5 py-3">Rarity</th>
                <th className="px-5 py-3">Levels</th>
                <th className="px-5 py-3">Special rules</th>
                <th className="px-5 py-3">Latest patch</th>
                <th className="px-5 py-3">Sources</th>
                <th className="px-5 py-3">Data status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {equipment.map((item, index) => {
                const auditRow = equipmentRows[index];
                const specialRules = item.levels.flatMap(
                  (level) => level.specialRules ?? [],
                );
                const hasContinuousEffects = item.levels.some(
                  (level) =>
                    level.damagePerSecond !== undefined ||
                    level.regeneration !== undefined,
                );

                return (
                  <tr key={item.id} className="text-slate-400">
                    <td className="px-5 py-4 font-bold text-slate-200 sm:px-7">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {formatValue(item.hero)}
                    </td>
                    <td className="px-5 py-4 capitalize">{item.rarity}</td>
                    <td className="px-5 py-4">{auditRow.levelCount}</td>
                    <td className="max-w-72 px-5 py-4">
                      {specialRules.length > 0
                        ? [...new Set(specialRules)].join(" ")
                        : hasContinuousEffects
                          ? "DPS and regeneration values tracked; not a one-shot calculator source."
                        : "None recorded"}
                    </td>
                    <td className="px-5 py-4">
                      {auditRow.latestPatchId ?? "Not added"}
                    </td>
                    <td className="px-5 py-4">
                      <SourceLinks sourceUrls={auditRow.sourceUrls} />
                    </td>
                    <td className="px-5 py-4">
                      <DataStatus
                        verificationStatus={auditRow.verificationStatus}
                        missingSourceCount={auditRow.missingSourceCount}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>

        <TableShell
          title="Spells"
          description="Spell levels and stored damage behavior."
        >
          <table className="w-full min-w-192 text-left text-sm">
            <thead className="bg-black/15 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3 sm:px-7">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Housing</th>
                <th className="px-5 py-3">Levels</th>
                <th className="px-5 py-3">Damage type</th>
                <th className="px-5 py-3">Latest patch</th>
                <th className="px-5 py-3">Sources</th>
                <th className="px-5 py-3">Data status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {spells.map((spell, index) => {
                const auditRow = spellRows[index];
                const hasPercentDamage = spell.levels.some(
                  (level) => level.damagePercent !== undefined,
                );
                const hasFlatDamage = spell.levels.some(
                  (level) => level.damage !== undefined,
                );

                return (
                  <tr key={spell.id} className="text-slate-400">
                    <td className="px-5 py-4 font-bold text-slate-200 sm:px-7">
                      {spell.name}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {spell.spellType}
                    </td>
                    <td className="px-5 py-4">
                      {spell.housingSpace ?? "Not recorded"}
                    </td>
                    <td className="px-5 py-4">{auditRow.levelCount}</td>
                    <td className="px-5 py-4">
                      {hasPercentDamage
                        ? "Percent"
                        : hasFlatDamage
                          ? "Flat"
                          : "Not recorded"}
                    </td>
                    <td className="px-5 py-4">
                      {auditRow.latestPatchId ?? "Not added"}
                    </td>
                    <td className="px-5 py-4">
                      <SourceLinks sourceUrls={auditRow.sourceUrls} />
                    </td>
                    <td className="px-5 py-4">
                      <DataStatus
                        verificationStatus={auditRow.verificationStatus}
                        missingSourceCount={auditRow.missingSourceCount}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </div>
    </section>
  );
}
