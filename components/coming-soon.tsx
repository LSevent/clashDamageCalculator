type ComingSoonProps = {
  phase: string;
};

export function ComingSoon({ phase }: ComingSoonProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-200">
      <span className="size-1.5 rounded-full bg-amber-300" />
      Planned for {phase}
    </span>
  );
}

