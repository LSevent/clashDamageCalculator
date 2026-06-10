import type { SpellDefinition } from "@/src/types/game/game-data";

export type SpellSelection = {
  enabled: boolean;
  level: number | undefined;
  count: number;
};

type SpellSelectorProps = {
  spell: SpellDefinition | undefined;
  selection: SpellSelection;
  onToggle: (enabled: boolean) => void;
  onLevelChange: (level: number) => void;
  onCountChange: (count: number) => void;
};

const earthquakeCounts = Array.from({ length: 12 }, (_, index) => index);

export function SpellSelector({
  spell,
  selection,
  onToggle,
  onLevelChange,
  onCountChange,
}: SpellSelectorProps) {
  if (!spell) {
    return null;
  }

  const selectedLevel = spell.levels.find(
    (level) => level.level === selection.level,
  );
  const disabled = spell.levels.length === 0;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Spells</h2>
        <p className="mt-1 text-sm text-slate-500">
          Earthquake adds percent-based damage with diminishing repeats.
        </p>
      </div>

      <article className="rounded-xl border border-white/8 bg-black/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selection.enabled && !disabled}
              disabled={disabled}
              onChange={(event) => onToggle(event.target.checked)}
              className="mt-1 size-4 accent-emerald-400"
            />
            <span>
              <span className="block font-black text-white">{spell.name}</span>
              <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-slate-600">
                {spell.spellType} / {spell.housingSpace} housing
              </span>
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-400">
              Level
              <select
                value={selection.level ?? ""}
                disabled={disabled || !selection.enabled}
                onChange={(event) => onLevelChange(Number(event.target.value))}
                className="min-h-11 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-300/50"
              >
                {spell.levels.map((level) => (
                  <option key={level.level} value={level.level}>
                    Level {level.level}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-400">
              Count
              <select
                value={selection.count}
                disabled={!selection.enabled}
                onChange={(event) => onCountChange(Number(event.target.value))}
                className="min-h-11 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-300/50"
              >
                {earthquakeCounts.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.03] p-3 text-sm leading-6 text-slate-400">
          <p>
            Earthquake deals percentage damage based on the building&apos;s
            maximum HP:{" "}
            <span className="font-black text-white">
              {selectedLevel?.damagePercent !== undefined
                ? `${(selectedLevel.damagePercent * 100).toFixed(0)}%`
                : "Data unavailable"}
            </span>
          </p>
          <p>Repeated Earthquakes have a diminishing effect.</p>
          <p>Earthquake cannot finish a building by itself.</p>
        </div>
      </article>
    </section>
  );
}
