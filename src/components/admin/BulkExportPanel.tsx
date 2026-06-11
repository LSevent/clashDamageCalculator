import { Card } from "@/src/components/ui/Card";
import type { BulkImportType } from "@/src/types/admin-bulk-import";

import {
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "./admin-styles";

type BulkExportPanelProps = {
  databaseAvailable: boolean;
};

const exports: readonly { type: BulkImportType; label: string }[] = [
  { type: "building-levels", label: "Building HP" },
  { type: "equipment-levels", label: "Equipment levels" },
  { type: "spell-levels", label: "Spell levels" },
];

export function BulkExportPanel({
  databaseAvailable,
}: BulkExportPanelProps) {
  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-xl font-black text-white">Export current data</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Downloads include database rows only. Templates contain example rows
        and do not require seeded data.
      </p>

      {!databaseAvailable ? (
        <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          Export requires database access.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Current database CSV
          </p>
          <div className="mt-3 grid gap-2">
            {exports.map((item) =>
              databaseAvailable ? (
                <a
                  key={item.type}
                  className={adminPrimaryButtonClass}
                  href={`/admin/api/export/${item.type}`}
                >
                  Export {item.label} CSV
                </a>
              ) : (
                <span
                  key={item.type}
                  className={`${adminPrimaryButtonClass} cursor-not-allowed opacity-40`}
                >
                  Export {item.label} CSV
                </span>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            CSV templates
          </p>
          <div className="mt-3 grid gap-2">
            {exports.map((item) => (
              <a
                key={item.type}
                className={adminSecondaryButtonClass}
                href={`/admin/api/export/${item.type}?template=1`}
              >
                Download {item.label} template
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
