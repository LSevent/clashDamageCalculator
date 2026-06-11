import type {
  AdminBuildingRow,
  AdminPatchRow,
} from "@/src/lib/admin/admin-data";
import { saveBuildingAction } from "@/src/lib/admin/admin-actions";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "./admin-styles";
import {
  BuildingLevelEditor,
  BuildingLevelSummary,
} from "./BuildingLevelEditor";

type BuildingEditorProps = {
  buildings: readonly AdminBuildingRow[];
  patches: readonly AdminPatchRow[];
};

function BuildingForm({ building }: { building?: AdminBuildingRow }) {
  return (
    <form action={saveBuildingAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/buildings" />
      {building ? (
        <input name="recordId" type="hidden" value={building.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabelClass}>
          Building ID
          <input
            className={adminInputClass}
            name="id"
            defaultValue={building?.id ?? ""}
            readOnly={Boolean(building)}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Data ID
          <input
            className={adminInputClass}
            name="dataId"
            type="number"
            min="0"
            defaultValue={building?.dataId ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Name
          <input
            className={adminInputClass}
            name="name"
            defaultValue={building?.name ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Village
          <select
            className={adminInputClass}
            name="village"
            defaultValue={building?.village ?? "home"}
          >
            <option value="home">Home</option>
            <option value="builder">Builder</option>
          </select>
        </label>
        <label className={adminLabelClass}>
          Category
          <select
            className={adminInputClass}
            name="category"
            defaultValue={building?.category ?? "defense"}
          >
            {["defense", "resource", "army", "trap", "hero", "other"].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </select>
        </label>
        <label className={adminLabelClass}>
          Target type
          <select
            className={adminInputClass}
            name="targetType"
            defaultValue={building?.targetType ?? "ground-and-air"}
          >
            {["ground", "air", "ground-and-air", "none"].map((target) => (
              <option key={target} value={target}>
                {target.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
        <input
          className="size-4 accent-emerald-400"
          name="canBeSupercharged"
          type="checkbox"
          defaultChecked={building?.canBeSupercharged ?? false}
        />
        Can be supercharged
      </label>

      <button className={adminPrimaryButtonClass} type="submit">
        Save building
      </button>
    </form>
  );
}

export function BuildingEditor({
  buildings,
  patches,
}: BuildingEditorProps) {
  return (
    <div className="grid gap-6">
      <details className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-black text-white">
          Create building
        </summary>
        <div className="mt-6">
          <BuildingForm />
        </div>
      </details>

      {buildings.map((building) => {
        const missingSources = building.levels.filter(
          (level) => !level.sourceUrl?.trim(),
        ).length;
        const reviewCount = building.levels.filter(
          (level) => level.verificationStatus !== "verified",
        ).length;

        return (
          <section
            key={building.id}
            className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  {building.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {building.village} · {building.category} ·{" "}
                  {building.targetType}
                </p>
              </div>
              <div className="text-xs leading-6 text-slate-500 lg:text-right">
                <p>{building.levels.length} level rows</p>
                <p>{missingSources} missing sources</p>
                <p>{reviewCount} partial / review rows</p>
              </div>
            </div>

            <details className="mt-5 rounded-xl border border-white/8 p-4">
              <summary className="cursor-pointer font-bold text-slate-200">
                Edit building definition
              </summary>
              <div className="mt-5">
                <BuildingForm building={building} />
              </div>
            </details>

            <details className="mt-3 rounded-xl border border-emerald-300/10 p-4">
              <summary className="cursor-pointer font-bold text-emerald-300">
                Add building level
              </summary>
              <div className="mt-5">
                <BuildingLevelEditor
                  buildingId={building.id}
                  patches={patches}
                />
              </div>
            </details>

            <div className="mt-5 grid gap-3">
              {building.levels.map((level) => (
                <details
                  key={level.id}
                  className="rounded-xl border border-white/8 bg-black/10 p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <BuildingLevelSummary level={level} />
                  </summary>
                  <div className="mt-5 border-t border-white/8 pt-5">
                    <BuildingLevelEditor
                      buildingId={building.id}
                      level={level}
                      patches={patches}
                    />
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
