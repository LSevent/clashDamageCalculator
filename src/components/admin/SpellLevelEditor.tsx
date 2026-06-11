import {
  deleteSpellLevelAction,
  saveSpellLevelAction,
} from "@/src/lib/admin/admin-actions";
import type {
  AdminPatchRow,
  AdminSpellRow,
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

type SpellLevel = AdminSpellRow["levels"][number];

type SpellLevelEditorProps = {
  spellId: string;
  level?: SpellLevel;
  patches: readonly AdminPatchRow[];
};

export function SpellLevelEditor({
  spellId,
  level,
  patches,
}: SpellLevelEditorProps) {
  return (
    <form action={saveSpellLevelAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/spells" />
      <input name="spellId" type="hidden" value={spellId} />
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
          Flat damage
          <input
            className={adminInputClass}
            name="damage"
            type="number"
            min="0"
            defaultValue={level?.damage ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Damage percent
          <input
            className={adminInputClass}
            name="damagePercent"
            type="number"
            min="0"
            max="1"
            step="0.001"
            defaultValue={level?.damagePercent ?? ""}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className={adminLabelClass}>
          Repeat damage rule
          <select
            className={adminInputClass}
            name="repeatDamageRule"
            defaultValue={level?.repeatDamageRule ?? ""}
          >
            <option value="">None</option>
            <option value="diminishing-odd-denominator">
              Diminishing odd denominator
            </option>
          </select>
        </label>
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
      </div>

      <SourceUrlField defaultValue={level?.sourceUrl} />

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
          Save spell level
        </button>
        {level ? (
          <DeleteLevelForm
            action={deleteSpellLevelAction}
            recordId={level.id}
            returnTo="/admin/data/spells"
            label={`${spellId} level ${level.level}`}
          />
        ) : null}
      </div>
    </form>
  );
}

export function SpellLevelSummary({ level }: { level: SpellLevel }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-slate-100">Level {level.level}</p>
        <p className="mt-1 text-xs text-slate-500">
          {level.damagePercent !== null
            ? `${level.damagePercent * 100}% damage`
            : `Damage ${level.damage ?? "missing"}`}{" "}
          · {level.patchId ?? "No patch"}
        </p>
      </div>
      <VerificationBadge status={level.verificationStatus} />
    </div>
  );
}
