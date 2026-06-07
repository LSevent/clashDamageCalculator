import type {
  BuildingDefinition,
  BuildingLevel,
} from "@/src/types/game/game-data";

type TargetBuildingSelectorProps = {
  buildings: readonly BuildingDefinition[];
  selectedTownHallLevel: number;
  selectedBuildingId: string;
  selectedBuildingLevel: number | undefined;
  selectedSuperchargeLevel: number | undefined;
  availableLevels: readonly BuildingLevel[];
  onTownHallChange: (townHallLevel: number) => void;
  onBuildingChange: (buildingId: string) => void;
  onBuildingLevelChange: (buildingLevel: number) => void;
  onSuperchargeLevelChange: (superchargeLevel: number | undefined) => void;
};

const townHallLevels = Array.from({ length: 18 }, (_, index) => 18 - index);

export function TargetBuildingSelector({
  buildings,
  selectedTownHallLevel,
  selectedBuildingId,
  selectedBuildingLevel,
  selectedSuperchargeLevel,
  availableLevels,
  onTownHallChange,
  onBuildingChange,
  onBuildingLevelChange,
  onSuperchargeLevelChange,
}: TargetBuildingSelectorProps) {
  const selectedBuilding = buildings.find(
    (building) => building.id === selectedBuildingId,
  );
  const superchargeLevels = availableLevels
    .filter((level) => level.isSupercharged && level.superchargeLevel)
    .map((level) => level.superchargeLevel)
    .filter((level): level is number => level !== undefined);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Target building</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick the enemy building and matching Town Hall data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Enemy Town Hall"
          value={selectedTownHallLevel}
          onChange={(value) => onTownHallChange(Number(value))}
        >
          {townHallLevels.map((townHallLevel) => (
            <option key={townHallLevel} value={townHallLevel}>
              TH{townHallLevel}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Target building"
          value={selectedBuildingId}
          onChange={onBuildingChange}
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Building level"
          value={selectedBuildingLevel ?? ""}
          disabled={availableLevels.length === 0}
          onChange={(value) => onBuildingLevelChange(Number(value))}
        >
          {availableLevels.length === 0 && (
            <option value="">No HP data for selected TH</option>
          )}
          {availableLevels.map((level) => (
            <option key={level.level} value={level.level}>
              Level {level.level}
            </option>
          ))}
        </SelectField>

        {superchargeLevels.length > 0 && (
          <SelectField
            label="Supercharge level"
            value={selectedSuperchargeLevel ?? ""}
            onChange={(value) =>
              onSuperchargeLevelChange(value ? Number(value) : undefined)
            }
          >
            <option value="">None</option>
            {superchargeLevels.map((level) => (
              <option key={level} value={level}>
                Supercharge {level}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Selected target
        </p>
        <p className="mt-2 font-black text-white">
          {selectedBuilding?.name ?? "Unknown building"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          TH{selectedTownHallLevel}
          {selectedBuildingLevel ? `, Level ${selectedBuildingLevel}` : ""}
          {availableLevels.length === 0
            ? ". HP data is not available yet."
            : `, HP ${availableLevels.find((level) => level.level === selectedBuildingLevel)?.hp ?? "unknown"}.`}
        </p>
        {selectedBuilding?.canBeSupercharged && superchargeLevels.length === 0 && (
          <p className="mt-2 text-xs leading-5 text-amber-200">
            Supercharge support exists for this building, but no supercharge HP
            data is loaded yet.
          </p>
        )}
      </div>
    </section>
  );
}

type SelectFieldProps = {
  label: string;
  value: string | number;
  disabled?: boolean;
  children: React.ReactNode;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  value,
  disabled = false,
  children,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-300">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:text-slate-600"
      >
        {children}
      </select>
    </label>
  );
}

