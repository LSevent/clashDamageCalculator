type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
        <span className="text-xs font-black tracking-tight text-emerald-300">DMG</span>
        <span className="absolute inset-x-2 bottom-1 h-px bg-amber-300/70" />
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-extrabold tracking-tight text-white">Clash Damage</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Calculator
          </p>
        </div>
      )}
    </div>
  );
}

