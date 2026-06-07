import type { EquipmentDefinition } from "@/src/types/game/game-data";

export type EquipmentSelection = {
  enabled: boolean;
  level: number | undefined;
};

type EquipmentSelectorProps = {
  equipmentItems: readonly EquipmentDefinition[];
  selections: Record<string, EquipmentSelection>;
  onToggle: (equipmentId: string, enabled: boolean) => void;
  onLevelChange: (equipmentId: string, level: number) => void;
};

export function EquipmentSelector({
  equipmentItems,
  selections,
  onToggle,
  onLevelChange,
}: EquipmentSelectorProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Equipment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enable the equipment damage sources to include in the calculation.
        </p>
      </div>

      <div className="space-y-3">
        {equipmentItems.map((item) => {
          const selection = selections[item.id] ?? {
            enabled: false,
            level: item.levels[0]?.level,
          };
          const selectedLevel = item.levels.find(
            (level) => level.level === selection.level,
          );
          const disabled = item.levels.length === 0;

          return (
            <article
              key={item.id}
              className="rounded-xl border border-white/8 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selection.enabled && !disabled}
                    disabled={disabled}
                    onChange={(event) => onToggle(item.id, event.target.checked)}
                    className="mt-1 size-4 accent-emerald-400"
                  />
                  <span>
                    <span className="block font-black text-white">{item.name}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-slate-600">
                      {item.hero.replaceAll("-", " ")} / {item.rarity}
                    </span>
                  </span>
                </label>

                <label className="grid gap-2 text-sm text-slate-400">
                  Level
                  <select
                    value={selection.level ?? ""}
                    disabled={disabled || !selection.enabled}
                    onChange={(event) =>
                      onLevelChange(item.id, Number(event.target.value))
                    }
                    className="min-h-11 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-300/50"
                  >
                    {item.levels.length === 0 && (
                      <option value="">Data unavailable</option>
                    )}
                    {item.levels.map((level) => (
                      <option key={level.level} value={level.level}>
                        Level {level.level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-400">
                Damage:{" "}
                <span className="font-black text-white">
                  {selectedLevel?.damage ?? "Data unavailable"}
                </span>
              </div>

              {selectedLevel?.specialRules && selectedLevel.specialRules.length > 0 && (
                <div className="mt-3 space-y-1 text-xs leading-5 text-amber-200">
                  {selectedLevel.specialRules.map((rule) => (
                    <p key={rule}>{rule}</p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

