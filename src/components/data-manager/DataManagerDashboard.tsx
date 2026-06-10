import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { auditGameData } from "@/src/lib/game/data-audit";
import type { GameDataBundle } from "@/src/types/game/game-data";

import { DataCoverageSummary } from "./DataCoverageSummary";
import { DataLimitations } from "./DataLimitations";
import { PatchChangeLog } from "./PatchChangeLog";
import { PatchOverview } from "./PatchOverview";
import { StaticDataTable } from "./StaticDataTable";

type DataManagerDashboardProps = {
  gameData: GameDataBundle;
};

export function DataManagerDashboard({
  gameData,
}: DataManagerDashboardProps) {
  const audit = auditGameData({
    patches: gameData.patches,
    buildings: gameData.buildings,
    equipment: gameData.equipment,
    spells: gameData.spells,
    currentPatchId: gameData.currentPatchId,
  });

  return (
    <div className="mt-12 grid gap-12">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Active game data
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {gameData.source === "database"
                ? "The dashboard and calculator are using PostgreSQL records."
                : gameData.fallbackReason}
            </p>
          </div>
          <Badge tone={gameData.source === "database" ? "success" : "warning"}>
            Data source:{" "}
            {gameData.source === "database" ? "Database" : "Static fallback"}
          </Badge>
        </div>
      </Card>
      <PatchOverview patch={audit.currentPatch} />
      <DataCoverageSummary audit={audit} />
      <PatchChangeLog patches={gameData.patches} />
      <StaticDataTable
        buildings={gameData.buildings}
        equipment={gameData.equipment}
        spells={gameData.spells}
      />
      <DataLimitations />
    </div>
  );
}
