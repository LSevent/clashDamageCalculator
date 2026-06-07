import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { Panel } from "@/components/panel";
import { buildings, equipment, spells } from "@/src/data/game";
import { getCurrentPatch } from "@/src/lib/game/data-helpers";

export const metadata: Metadata = {
  title: "Data Manager",
};

export default function DataManagerPage() {
  const currentPatch = getCurrentPatch();
  const dataGroups = [
    { name: "Buildings", records: buildings.length, status: "Partial" },
    { name: "Equipment", records: equipment.length, status: "Partial" },
    { name: "Spells", records: spells.length, status: "Partial" },
  ];
  const totalRecords = dataGroups.reduce(
    (total, group) => total + group.records,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow="Game reference"
          title="Data Manager"
          description="This area will provide a clear view of the structured game data used by the calculator in a future phase."
        />
        <div className="w-fit rounded-xl border border-emerald-300/15 bg-emerald-300/8 px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Current patch
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {currentPatch?.name ?? "Not set"}
          </p>
        </div>
      </div>

      <Panel className="mt-12 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="text-lg font-black text-white">Data overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Local, patch-versioned TypeScript definitions.
            </p>
          </div>
          <span className="w-fit rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
            {totalRecords} definitions
          </span>
        </div>
        <div className="divide-y divide-white/8">
          {dataGroups.map((group) => (
            <div
              key={group.name}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:px-7"
            >
              <p className="font-bold text-slate-200">{group.name}</p>
              <p className="text-sm text-slate-500">
                {group.records} {group.records === 1 ? "item" : "items"} defined
              </p>
              <span className="w-fit rounded-full bg-amber-300/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-200">
                {group.status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center">
        <p className="text-sm font-bold text-slate-400">
          This dataset is intentionally partial.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          More levels and objects will be added after verification in later phases.
          JSON import, editing, and persistence are not enabled.
        </p>
      </div>
    </div>
  );
}
