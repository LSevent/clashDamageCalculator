import {
  deleteEquipmentLevelAction,
  saveEquipmentLevelAction,
} from "@/src/lib/admin/admin-actions";
import type {
  AdminEquipmentRow,
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

type EquipmentLevel = AdminEquipmentRow["levels"][number];

type EquipmentLevelEditorProps = {
  equipmentId: string;
  level?: EquipmentLevel;
  patches: readonly AdminPatchRow[];
};

function jsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function EquipmentLevelEditor({
  equipmentId,
  level,
  patches,
}: EquipmentLevelEditorProps) {
  return (
    <form action={saveEquipmentLevelAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/equipment" />
      <input name="equipmentId" type="hidden" value={equipmentId} />
      {level ? (
        <input name="recordId" type="hidden" value={level.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabelClass}>
          Level
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
          Damage
          <input
            className={adminInputClass}
            name="damage"
            type="number"
            min="0"
            defaultValue={level?.damage ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Damage per second
          <input
            className={adminInputClass}
            name="damagePerSecond"
            type="number"
            min="0"
            defaultValue={level?.damagePerSecond ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Regeneration
          <input
            className={adminInputClass}
            name="regeneration"
            type="number"
            min="0"
            defaultValue={level?.regeneration ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Healing
          <input
            className={adminInputClass}
            name="healing"
            type="number"
            min="0"
            defaultValue={level?.healing ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          HP increase
          <input
            className={adminInputClass}
            name="hpIncrease"
            type="number"
            min="0"
            defaultValue={level?.hpIncrease ?? ""}
          />
        </label>
      </div>

      <label className={adminLabelClass}>
        Ability description
        <textarea
          className={`${adminInputClass} min-h-20 resize-y`}
          name="abilityDescription"
          defaultValue={level?.abilityDescription ?? ""}
        />
      </label>

      <label className={adminLabelClass}>
        Special rules JSON
        <textarea
          className={`${adminInputClass} min-h-40 resize-y font-mono text-xs`}
          name="specialRules"
          defaultValue={jsonValue(level?.specialRules)}
          placeholder='{"descriptions":[],"targetMultipliers":[]}'
        />
        <span className="mt-2 block normal-case tracking-normal text-slate-600">
          Invalid JSON is rejected. Keep Giant Arrow target multipliers intact.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          Source type
          <select
            className={adminInputClass}
            name="sourceType"
            defaultValue={level?.sourceType ?? ""}
          >
            <option value="">Not set</option>
            <option value="official">Official</option>
            <option value="manual-seed">Manual seed</option>
            <option value="third-party">Third party</option>
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

      <div className="flex flex-wrap gap-3">
        <button className={adminPrimaryButtonClass} type="submit">
          Save equipment level
        </button>
        {level ? (
          <DeleteLevelForm
            action={deleteEquipmentLevelAction}
            recordId={level.id}
            returnTo="/admin/data/equipment"
            label={`${equipmentId} level ${level.level}`}
          />
        ) : null}
      </div>
    </form>
  );
}

export function EquipmentLevelSummary({
  level,
}: {
  level: EquipmentLevel;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-slate-100">Level {level.level}</p>
        <p className="mt-1 text-xs text-slate-500">
          Damage {level.damage ?? "missing"} · {level.patchId ?? "No patch"}
        </p>
      </div>
      <VerificationBadge status={level.verificationStatus} />
    </div>
  );
}
