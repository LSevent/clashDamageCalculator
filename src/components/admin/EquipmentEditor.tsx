import { saveEquipmentAction } from "@/src/lib/admin/admin-actions";
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
import {
  EquipmentLevelEditor,
  EquipmentLevelSummary,
} from "./EquipmentLevelEditor";
import { SourceUrlField } from "./SourceUrlField";
import { VerificationBadge } from "./VerificationBadge";

type EquipmentEditorProps = {
  equipment: readonly AdminEquipmentRow[];
  patches: readonly AdminPatchRow[];
};

function sourceUrls(value: unknown) {
  return Array.isArray(value)
    ? value.filter((url): url is string => typeof url === "string").join("\n")
    : "";
}

function EquipmentDefinitionForm({
  item,
  patches,
}: {
  item?: AdminEquipmentRow;
  patches: readonly AdminPatchRow[];
}) {
  return (
    <div>
      <EquipmentFormWithPatches item={item} patches={patches} />
    </div>
  );
}

function EquipmentFormWithPatches({
  item,
  patches,
}: {
  item?: AdminEquipmentRow;
  patches: readonly AdminPatchRow[];
}) {
  return (
    <form action={saveEquipmentAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/equipment" />
      {item ? <input name="recordId" type="hidden" value={item.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabelClass}>
          Equipment ID
          <input
            className={adminInputClass}
            name="id"
            defaultValue={item?.id ?? ""}
            readOnly={Boolean(item)}
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
            defaultValue={item?.dataId ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Name
          <input
            className={adminInputClass}
            name="name"
            defaultValue={item?.name ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Hero
          <input
            className={adminInputClass}
            name="hero"
            defaultValue={item?.hero ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Rarity
          <select
            className={adminInputClass}
            name="rarity"
            defaultValue={item?.rarity ?? "common"}
          >
            <option value="common">Common</option>
            <option value="epic">Epic</option>
          </select>
        </label>
        <label className={adminLabelClass}>
          Category
          <select
            className={adminInputClass}
            name="category"
            defaultValue={item?.category ?? ""}
          >
            <option value="">Not set</option>
            <option value="active">Active</option>
            <option value="passive">Passive</option>
          </select>
        </label>
        <label className={adminLabelClass}>
          Patch
          <select
            className={adminInputClass}
            name="patchId"
            defaultValue={item?.patchId ?? ""}
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
          Default level
          <input
            className={adminInputClass}
            name="defaultLevel"
            type="number"
            min="0"
            defaultValue={item?.defaultLevel ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Verification status
          <select
            className={adminInputClass}
            name="verificationStatus"
            defaultValue={item?.verificationStatus ?? "needs-review"}
          >
            {adminVerificationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SourceUrlField
        multiple
        defaultValue={sourceUrls(item?.sourceUrls)}
      />
      <label className={adminLabelClass}>
        Notes
        <textarea
          className={`${adminInputClass} min-h-24 resize-y`}
          name="notes"
          defaultValue={item?.notes ?? ""}
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
        <input
          className="size-4 accent-emerald-400"
          name="calculatorEnabled"
          type="checkbox"
          defaultChecked={item?.calculatorEnabled ?? false}
        />
        Calculator enabled
      </label>
      <button className={adminPrimaryButtonClass} type="submit">
        Save equipment
      </button>
    </form>
  );
}

export function EquipmentEditor({
  equipment,
  patches,
}: EquipmentEditorProps) {
  return (
    <div className="grid gap-6">
      <details className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-black text-white">
          Create equipment
        </summary>
        <div className="mt-6">
          <EquipmentDefinitionForm patches={patches} />
        </div>
      </details>

      {equipment.map((item) => (
        <section
          key={item.id}
          className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">{item.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {item.hero} · {item.rarity} · {item.levels.length} levels
              </p>
            </div>
            <VerificationBadge status={item.verificationStatus} />
          </div>

          <details className="mt-5 rounded-xl border border-white/8 p-4">
            <summary className="cursor-pointer font-bold text-slate-200">
              Edit equipment definition
            </summary>
            <div className="mt-5">
              <EquipmentDefinitionForm item={item} patches={patches} />
            </div>
          </details>

          <details className="mt-3 rounded-xl border border-emerald-300/10 p-4">
            <summary className="cursor-pointer font-bold text-emerald-300">
              Add equipment level
            </summary>
            <div className="mt-5">
              <EquipmentLevelEditor
                equipmentId={item.id}
                patches={patches}
              />
            </div>
          </details>

          <div className="mt-5 grid gap-3">
            {item.levels.map((level) => (
              <details
                key={level.id}
                className="rounded-xl border border-white/8 bg-black/10 p-4"
              >
                <summary className="cursor-pointer list-none">
                  <EquipmentLevelSummary level={level} />
                </summary>
                <div className="mt-5 border-t border-white/8 pt-5">
                  <EquipmentLevelEditor
                    equipmentId={item.id}
                    level={level}
                    patches={patches}
                  />
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
