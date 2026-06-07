import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeading } from "@/components/page-heading";
import { Panel } from "@/components/panel";

export const metadata: Metadata = {
  title: "Progress Setup",
};

const categories = [
  { title: "Town Hall", description: "Your current village level", progress: "0%" },
  { title: "Army", description: "Troops, spells, and siege machines", progress: "0%" },
  { title: "Heroes", description: "Hero levels and equipment", progress: "0%" },
  { title: "Defenses", description: "Key defensive building levels", progress: "0%" },
];

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow="Village profile"
          title="Progress Setup"
          description="Set the levels that matter to your account so future calculator defaults can match your current progression."
        />
        <ComingSoon phase="Phase 2" />
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {categories.map((category, index) => (
          <Panel key={category.title} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-emerald-300/10 bg-emerald-300/5 text-xs font-black text-emerald-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-black text-white">{category.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-600">{category.progress}</span>
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-0 rounded-full bg-emerald-400" />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-5 flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-black text-white">Profile storage is not enabled</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            No account data, browser storage, or database is connected in this phase.
          </p>
        </div>
        <span className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Setup unavailable
        </span>
      </Panel>
    </div>
  );
}

