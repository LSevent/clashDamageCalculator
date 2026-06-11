import { BulkExportPanel } from "./BulkExportPanel";
import { BulkImportPanel } from "./BulkImportPanel";

type BulkImportExportDashboardProps = {
  databaseAvailable: boolean;
};

export function BulkImportExportDashboard({
  databaseAvailable,
}: BulkImportExportDashboardProps) {
  return (
    <div className="grid gap-6">
      <BulkExportPanel databaseAvailable={databaseAvailable} />
      <BulkImportPanel databaseAvailable={databaseAvailable} />
    </div>
  );
}
