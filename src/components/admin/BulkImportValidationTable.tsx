import type { BulkImportPreviewRow } from "@/src/types/admin-bulk-import";

const statusStyles = {
  create: "text-emerald-300",
  update: "text-sky-300",
  unchanged: "text-slate-500",
  invalid: "text-red-300",
  skipped: "text-amber-200",
} as const;

type BulkImportValidationTableProps = {
  rows: readonly BulkImportPreviewRow[];
};

export function BulkImportValidationTable({
  rows,
}: BulkImportValidationTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="min-w-[1050px] w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Row</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Old value</th>
            <th className="px-4 py-3">New value</th>
            <th className="px-4 py-3">Source / validation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row) => (
            <tr
              key={`${row.rowNumber}-${row.itemId}`}
              className={row.action === "unchanged" ? "opacity-60" : ""}
            >
              <td className="px-4 py-4 text-slate-500">{row.rowNumber}</td>
              <td
                className={`px-4 py-4 font-black uppercase ${statusStyles[row.action]}`}
              >
                {row.action}
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-100">
                  {row.itemName || row.itemId || "Unknown item"}
                </p>
                <p className="mt-1 text-xs text-slate-600">{row.itemId}</p>
              </td>
              <td className="px-4 py-4 text-slate-300">
                {row.level ?? "—"}
              </td>
              <td className="max-w-64 px-4 py-4 text-xs leading-5 text-slate-500">
                {row.oldValue ?? "No matching row"}
              </td>
              <td className="max-w-64 px-4 py-4 text-xs leading-5 text-slate-300">
                {row.newValue ?? "—"}
              </td>
              <td className="max-w-72 px-4 py-4 text-xs leading-5">
                {row.message ? (
                  <p className={row.action === "invalid" ? "text-red-300" : "text-amber-200"}>
                    {row.message}
                  </p>
                ) : null}
                {row.sourceUrl ? (
                  <a
                    className="mt-1 block break-all text-emerald-300 hover:underline"
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.sourceUrl}
                  </a>
                ) : (
                  <p className="mt-1 text-slate-600">Source pending</p>
                )}
                {row.verificationStatus ? (
                  <p className="mt-1 text-slate-500">
                    {row.verificationStatus.replaceAll("-", " ")}
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
