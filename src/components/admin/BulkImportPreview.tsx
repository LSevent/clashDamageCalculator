import type { BulkImportPreview as Preview } from "@/src/types/admin-bulk-import";

import { BulkImportValidationTable } from "./BulkImportValidationTable";

type BulkImportPreviewProps = {
  preview: Preview;
};

export function BulkImportPreview({ preview }: BulkImportPreviewProps) {
  const metrics = [
    ["Total", preview.summary.totalRows],
    ["Valid", preview.summary.validRows],
    ["Invalid", preview.summary.invalidRows],
    ["Create", preview.summary.newRows],
    ["Update", preview.summary.updateRows],
    ["Unchanged", preview.summary.unchangedRows],
    ["Skipped", preview.summary.skippedRows],
  ];

  return (
    <section className="mt-8 border-t border-white/8 pt-8">
      <h3 className="text-lg font-black text-white">Import preview</h3>
      <p className="mt-2 text-sm text-slate-400">
        This comparison was generated on the server from current database
        values. Commit performs the same validation again.
      </p>

      {preview.parseErrors.length > 0 ? (
        <div className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-200">
          {preview.parseErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
          >
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {label}
            </dt>
            <dd className="mt-1 text-xl font-black text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <BulkImportValidationTable rows={preview.rows} />
      </div>
    </section>
  );
}
