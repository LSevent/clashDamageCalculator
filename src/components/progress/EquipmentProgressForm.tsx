import type { EquipmentDefinition } from "@/src/types/game/game-data";

type EquipmentProgressFormProps = {
  equipmentItems: readonly EquipmentDefinition[];
  values: Record<string, number>;
  errors?: Record<string, string>;
  onChange: (equipmentId: string, level: number) => void;
};

export function EquipmentProgressForm({
  equipmentItems,
  values,
  errors,
  onChange,
}: EquipmentProgressFormProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Equipment levels</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Only levels currently available in the static game data are shown.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {equipmentItems.map((item) => (
          <label
            key={item.id}
            className="grid gap-2 text-sm font-bold text-slate-300"
          >
            {item.name}
            <select
              value={values[item.id] ?? ""}
              disabled={item.levels.length === 0}
              onChange={(event) => onChange(item.id, Number(event.target.value))}
              className="min-h-12 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:text-slate-600"
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
            {errors?.[item.id] && (
              <span className="text-xs font-medium leading-5 text-rose-300">
                {errors[item.id]}
              </span>
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

