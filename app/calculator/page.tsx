import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeading } from "@/components/page-heading";
import { Panel } from "@/components/panel";
import {
  calculateTotalDamage,
  createEarthquakeDamageSource,
  createEquipmentDamageSource,
  findMinimumEarthquakes,
  getTargetBuildingFromData,
} from "@/src/lib/game";
import type { EquipmentDamageSource } from "@/src/types/game/calculator";

export const metadata: Metadata = {
  title: "Calculator",
};

const slots = [
  { label: "Attacking unit", value: "Choose a troop or hero" },
  { label: "Unit level", value: "Select level" },
  { label: "Target building", value: "Choose a defense" },
  { label: "Building level", value: "Select level" },
];

function isEquipmentSource(
  source: EquipmentDamageSource | undefined,
): source is EquipmentDamageSource {
  return source !== undefined;
}

export default function CalculatorPage() {
  const previewTarget = getTargetBuildingFromData("scattershot", 18, {
    buildingLevel: 7,
    hp: 5800,
  });
  const previewEquipmentSources = previewTarget
    ? [
        createEquipmentDamageSource("giant-arrow", 18, previewTarget.buildingId),
        createEquipmentDamageSource(
          "rocket-backpack",
          24,
          previewTarget.buildingId,
        ),
      ].filter(isEquipmentSource)
    : [];
  const previewEarthquake = createEarthquakeDamageSource(
    "earthquake-spell",
    5,
    1,
  );
  const previewResult =
    previewTarget && previewEarthquake
      ? calculateTotalDamage({
          target: previewTarget,
          equipmentSources: previewEquipmentSources,
          spellSources: [previewEarthquake],
        })
      : undefined;
  const previewMinimumEarthquake =
    previewTarget && previewEarthquake
      ? findMinimumEarthquakes({
          target: previewTarget,
          equipmentSources: previewEquipmentSources,
          earthquakeSource: previewEarthquake,
        })
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Damage workspace"
        title="Calculator"
        description="The future home for damage comparisons, hit counts, and attack modifiers. This phase establishes the interface only."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-5 sm:p-7">
          <div className="flex flex-col gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Attack configuration</h2>
              <p className="mt-1 text-sm text-slate-500">Set up both sides of the matchup.</p>
            </div>
            <ComingSoon phase="Phase 4" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {slots.map((slot) => (
              <div key={slot.label}>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {slot.label}
                </p>
                <div className="flex min-h-14 items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 text-sm text-slate-400">
                  <span>{slot.value}</span>
                  <span className="text-slate-600">v</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex min-h-14 items-center justify-center rounded-xl border border-dashed border-emerald-300/15 bg-emerald-300/5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/60">
            Calculation controls coming next
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-white/8 p-5 sm:p-7">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Result
            </p>
            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-5xl font-black tracking-tight text-slate-700">---</p>
                <p className="mt-2 text-sm text-slate-500">Damage per hit</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-right">
                <p className="text-xs font-bold text-slate-600">No matchup</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/8">
            <div className="p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Hits to destroy
              </p>
              <p className="mt-3 text-2xl font-black text-slate-700">--</p>
            </div>
            <div className="p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Time to destroy
              </p>
              <p className="mt-3 text-2xl font-black text-slate-700">--</p>
            </div>
          </div>
        </Panel>
      </div>

      {previewTarget && previewResult && previewMinimumEarthquake && (
        <Panel className="mt-5 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                Developer preview
              </p>
              <h2 className="mt-2 text-lg font-black text-white">
                Hardcoded damage engine example
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                TH18 Scattershot, 5800 HP, Giant Arrow Lv18, Rocket Backpack
                Lv24, and Earthquake Spell Lv5. This is a read-only preview, not
                the final calculator form.
              </p>
            </div>
            <span
              className={`w-fit rounded-xl px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] ${
                previewResult.destroyed
                  ? "bg-emerald-300/10 text-emerald-300"
                  : "bg-amber-300/10 text-amber-200"
              }`}
            >
              {previewResult.destroyed ? "Destroyed" : "Survives"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Total damage
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {previewResult.totalDamage}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Remaining HP
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {previewResult.remainingHp}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Overkill
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {previewResult.overkillDamage}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Min Earthquakes
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {previewMinimumEarthquake.possible
                  ? previewMinimumEarthquake.earthquakeCount
                  : "No"}
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
