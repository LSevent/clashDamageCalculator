import { equipment, spells } from "@/src/data/game";
import { Badge } from "@/src/components/ui/Badge";
import type { ImportedProgressPreview } from "@/src/types/game/imported-progress";

type JsonImportPreviewProps = {
  preview: ImportedProgressPreview;
  onSave: () => void;
  onCancel: () => void;
};

function getDefinitionName(
  section: "equipment" | "spells",
  appObjectId: string,
) {
  const definitions = section === "equipment" ? equipment : spells;
  return definitions.find((definition) => definition.id === appObjectId)?.name;
}

export function JsonImportPreview({
  preview,
  onSave,
  onCancel,
}: JsonImportPreviewProps) {
  const totalUnknown = Object.values(preview.unknownCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="mt-5 rounded-2xl border border-sky-300/15 bg-sky-300/[0.045] p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky-300">
            Import preview
          </p>
          <h3 className="mt-2 text-lg font-black text-white">
            Review detected progress
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nothing is saved until you confirm below.
          </p>
        </div>
        <Badge tone="info">Source: JSON import</Badge>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Detected account
          </h4>
          <dl className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8 bg-black/15 px-4">
            <PreviewRow
              label="Player tag"
              value={preview.playerTag ?? "Not detected"}
            />
            <PreviewRow
              label="Town Hall"
              value={
                preview.detectedTownHallLevel !== undefined
                  ? `Level ${preview.detectedTownHallLevel}`
                  : "Not detected"
              }
            />
          </dl>
        </section>

        <section>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Detected calculator data
          </h4>
          <dl className="mt-3 divide-y divide-white/8 rounded-xl border border-white/8 bg-black/15 px-4">
            {Object.keys(preview.equipmentLevels).length === 0 &&
              Object.keys(preview.spellLevels).length === 0 && (
                <p className="py-4 text-sm text-slate-500">
                  No valid calculator levels were detected.
                </p>
              )}
            {Object.entries(preview.equipmentLevels).map(([id, level]) => (
              <PreviewRow
                key={id}
                label={getDefinitionName("equipment", id) ?? id}
                value={`Lv${level}`}
              />
            ))}
            {Object.entries(preview.spellLevels).map(([id, level]) => (
              <PreviewRow
                key={id}
                label={getDefinitionName("spells", id) ?? id}
                value={`Lv${level}`}
              />
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-5">
        <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
          Data not used by this calculator
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(preview.unknownCounts).map(([section, count]) => (
            <div
              key={section}
              className="rounded-xl border border-white/8 bg-black/15 p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {section}
              </p>
              <p className="mt-2 text-xl font-black text-white">{count}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {totalUnknown} unrecognized item{totalUnknown === 1 ? "" : "s"} will
          be skipped safely. This is normal when a snapshot contains game data
          outside the current MVP dataset.
        </p>
      </section>

      {preview.warnings.length > 0 && (
        <section className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/8 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-200">
            Warnings
          </h4>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-100">
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl bg-sky-300 px-5 py-3 text-sm font-extrabold text-sky-950 transition hover:bg-sky-200"
        >
          Save Imported Progress
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
        >
          Cancel / Clear Preview
        </button>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-black text-slate-200">{value}</dd>
    </div>
  );
}
