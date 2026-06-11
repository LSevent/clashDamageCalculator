import {
  deleteBuildingLevelAction,
  saveBuildingLevelAction,
} from "@/src/lib/admin/admin-actions";
import type {
  AdminBuildingRow,
  AdminPatchRow,
} from "@/src/lib/admin/admin-data";
import { adminVerificationStatuses } from "@/src/types/admin";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "./admin-styles";
import { DeleteLevelForm } from "./DeleteLevelForm";
import { SourceUrlField } from "./SourceUrlField";
import { VerificationBadge } from "./VerificationBadge";

type BuildingLevel = AdminBuildingRow["levels"][number];

type BuildingLevelEditorProps = {
  buildingId: string;
  level?: BuildingLevel;
  patches: readonly AdminPatchRow[];
};

export function BuildingLevelEditor({
  buildingId,
  level,
  patches,
}: BuildingLevelEditorProps) {
  return (
    <form action={saveBuildingLevelAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/buildings" />
      <input name="buildingId" type="hidden" value={buildingId} />
      {level ? (
        <input name="recordId" type="hidden" value={level.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={adminLabelClass}>
          Building level
          <input
            className={adminInputClass}
            name="level"
            type="number"
            min="1"
            defaultValue={level?.level ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Town Hall
          <input
            className={adminInputClass}
            name="townHallLevel"
            type="number"
            min="1"
            max="18"
            defaultValue={level?.townHallLevel ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          HP
          <input
            className={adminInputClass}
            name="hp"
            type="number"
            min="1"
            defaultValue={level?.hp ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Supercharge level
          <input
            className={adminInputClass}
            name="superchargeLevel"
            type="number"
            min="1"
            defaultValue={level?.superchargeLevel ?? ""}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={adminLabelClass}>
          Patch
          <select
            className={adminInputClass}
            name="patchId"
            defaultValue={level?.patchId ?? ""}
          >
            <option value="">No patch selected</option>
            {patches.map((patch) => (
              <option key={patch.id} value={patch.id}>
                {patch.name}
              </option>
            ))}
          </select>
        </label>
        <label className={adminLabelClass}>
          Verification status
          <select
            className={adminInputClass}
            name="verificationStatus"
            defaultValue={level?.verificationStatus ?? "needs-review"}
          >
            {adminVerificationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <SourceUrlField defaultValue={level?.sourceUrl} />
      </div>

      <label className={adminLabelClass}>
        Notes
        <textarea
          className={`${adminInputClass} min-h-24 resize-y`}
          name="notes"
          defaultValue={level?.notes ?? ""}
        />
      </label>

      <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
        <input
          className="size-4 accent-emerald-400"
          name="isSupercharged"
          type="checkbox"
          defaultChecked={level?.isSupercharged ?? false}
        />
        Supercharged row
      </label>

      <div className="flex flex-wrap gap-3">
        <button className={adminPrimaryButtonClass} type="submit">
          Save building level
        </button>
        {level ? (
          <DeleteLevelForm
            action={deleteBuildingLevelAction}
            recordId={level.id}
            returnTo="/admin/data/buildings"
            label={`${buildingId} level ${level.level}`}
          />
        ) : null}
      </div>
    </form>
  );
}

export function BuildingLevelSummary({ level }: { level: BuildingLevel }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-slate-100">
          Level {level.level} · TH {level.townHallLevel ?? "Unknown"}
          {level.isSupercharged
            ? ` · Supercharge ${level.superchargeLevel ?? "?"}`
            : ""}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          HP {level.hp ?? "missing"} · {level.patchId ?? "No patch"}
        </p>
      </div>
      <VerificationBadge status={level.verificationStatus} />
    </div>
  );
}
