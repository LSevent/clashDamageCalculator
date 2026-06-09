import {
  buildings,
  CURRENT_PATCH_ID,
  equipment,
  patches,
  spells,
} from "@/src/data/game";
import { auditGameData } from "@/src/lib/game/data-audit";

import { DataCoverageSummary } from "./DataCoverageSummary";
import { DataLimitations } from "./DataLimitations";
import { PatchChangeLog } from "./PatchChangeLog";
import { PatchOverview } from "./PatchOverview";
import { StaticDataTable } from "./StaticDataTable";

export function DataManagerDashboard() {
  const audit = auditGameData({
    patches,
    buildings,
    equipment,
    spells,
    currentPatchId: CURRENT_PATCH_ID,
  });

  return (
    <div className="mt-12 grid gap-12">
      <PatchOverview patch={audit.currentPatch} />
      <DataCoverageSummary audit={audit} />
      <PatchChangeLog patches={patches} />
      <StaticDataTable
        buildings={buildings}
        equipment={equipment}
        spells={spells}
      />
      <DataLimitations />
    </div>
  );
}
