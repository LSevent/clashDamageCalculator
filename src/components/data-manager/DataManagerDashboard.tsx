import { auditGameData } from "@/src/lib/game/data-audit";
import type { GameDataBundle } from "@/src/types/game/game-data";

import { DataCoverageSummary } from "./DataCoverageSummary";
import { DataLimitations } from "./DataLimitations";
import { DataSourceStatus } from "./DataSourceStatus";
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
      <DataSourceStatus gameData={gameData} />
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
