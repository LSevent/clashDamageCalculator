import type { SpellDefinition } from "@/src/types/game/game-data";

type SpellProgressFormProps = {
  spellItems: readonly SpellDefinition[];
  values: Record<string, number>;
  errors?: Record<string, string>;
  onChange: (spellId: string, level: number) => void;
};

export function SpellProgressForm({
  spellItems,
  values,
  errors,
  onChange,
}: SpellProgressFormProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Spell levels</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          More spell levels can be added as the verified dataset expands.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {spellItems.map((spell) => (
          <label
            key={spell.id}
            className="grid gap-2 text-sm font-bold text-slate-300"
          >
            {spell.name}
            <select
              value={values[spell.id] ?? ""}
              disabled={spell.levels.length === 0}
              onChange={(event) => onChange(spell.id, Number(event.target.value))}
              className="min-h-12 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              {spell.levels.length === 0 && (
                <option value="">Data unavailable</option>
              )}
              {spell.levels.map((level) => (
                <option key={level.level} value={level.level}>
                  Level {level.level}
                </option>
              ))}
            </select>
            {errors?.[spell.id] && (
              <span className="text-xs font-medium leading-5 text-rose-300">
                {errors[spell.id]}
              </span>
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

