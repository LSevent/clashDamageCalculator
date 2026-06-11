import { saveSpellAction } from "@/src/lib/admin/admin-actions";
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
import { SourceUrlField } from "./SourceUrlField";
import { SpellLevelEditor, SpellLevelSummary } from "./SpellLevelEditor";
import { VerificationBadge } from "./VerificationBadge";

type SpellEditorProps = {
  spells: readonly AdminSpellRow[];
  patches: readonly AdminPatchRow[];
};

function sourceUrls(value: unknown) {
  return Array.isArray(value)
    ? value.filter((url): url is string => typeof url === "string").join("\n")
    : "";
}

function SpellForm({
  spell,
  patches,
}: {
  spell?: AdminSpellRow;
  patches: readonly AdminPatchRow[];
}) {
  return (
    <form action={saveSpellAction} className="grid gap-5">
      <input name="returnTo" type="hidden" value="/admin/data/spells" />
      {spell ? <input name="recordId" type="hidden" value={spell.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={adminLabelClass}>
          Spell ID
          <input
            className={adminInputClass}
            name="id"
            defaultValue={spell?.id ?? ""}
            readOnly={Boolean(spell)}
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
            defaultValue={spell?.dataId ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Name
          <input
            className={adminInputClass}
            name="name"
            defaultValue={spell?.name ?? ""}
            required
          />
        </label>
        <label className={adminLabelClass}>
          Village
          <select
            className={adminInputClass}
            name="village"
            defaultValue={spell?.village ?? "home"}
          >
            <option value="home">Home</option>
            <option value="builder">Builder</option>
          </select>
        </label>
        <label className={adminLabelClass}>
          Spell type
          <select
            className={adminInputClass}
            name="spellType"
            defaultValue={spell?.spellType ?? "elixir"}
          >
            <option value="elixir">Elixir</option>
            <option value="dark">Dark</option>
            <option value="event">Event</option>
          </select>
        </label>
        <label className={adminLabelClass}>
          Housing space
          <input
            className={adminInputClass}
            name="housingSpace"
            type="number"
            min="0"
            defaultValue={spell?.housingSpace ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Patch
          <select
            className={adminInputClass}
            name="patchId"
            defaultValue={spell?.patchId ?? ""}
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
            defaultValue={spell?.defaultLevel ?? ""}
          />
        </label>
        <label className={adminLabelClass}>
          Verification status
          <select
            className={adminInputClass}
            name="verificationStatus"
            defaultValue={spell?.verificationStatus ?? "needs-review"}
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
        defaultValue={sourceUrls(spell?.sourceUrls)}
      />

      <label className={adminLabelClass}>
        Notes
        <textarea
          className={`${adminInputClass} min-h-24 resize-y`}
          name="notes"
          defaultValue={spell?.notes ?? ""}
        />
      </label>

      <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
        <input
          className="size-4 accent-emerald-400"
          name="calculatorEnabled"
          type="checkbox"
          defaultChecked={spell?.calculatorEnabled ?? false}
        />
        Calculator enabled
      </label>

      <button className={adminPrimaryButtonClass} type="submit">
        Save spell
      </button>
    </form>
  );
}

export function SpellEditor({ spells, patches }: SpellEditorProps) {
  return (
    <div className="grid gap-6">
      <details className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6">
        <summary className="cursor-pointer text-lg font-black text-white">
          Create spell
        </summary>
        <div className="mt-6">
          <SpellForm patches={patches} />
        </div>
      </details>

      {spells.map((spell) => (
        <section
          key={spell.id}
          className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">{spell.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {spell.village} · {spell.spellType} · {spell.levels.length}{" "}
                levels
              </p>
            </div>
            <VerificationBadge status={spell.verificationStatus} />
          </div>

          <details className="mt-5 rounded-xl border border-white/8 p-4">
            <summary className="cursor-pointer font-bold text-slate-200">
              Edit spell definition
            </summary>
            <div className="mt-5">
              <SpellForm spell={spell} patches={patches} />
            </div>
          </details>

          <details className="mt-3 rounded-xl border border-emerald-300/10 p-4">
            <summary className="cursor-pointer font-bold text-emerald-300">
              Add spell level
            </summary>
            <div className="mt-5">
              <SpellLevelEditor spellId={spell.id} patches={patches} />
            </div>
          </details>

          <div className="mt-5 grid gap-3">
            {spell.levels.map((level) => (
              <details
                key={level.id}
                className="rounded-xl border border-white/8 bg-black/10 p-4"
              >
                <summary className="cursor-pointer list-none">
                  <SpellLevelSummary level={level} />
                </summary>
                <div className="mt-5 border-t border-white/8 pt-5">
                  <SpellLevelEditor
                    spellId={spell.id}
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
