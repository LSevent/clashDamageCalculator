import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "neutral" | "info";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const badgeStyles: Record<BadgeTone, string> = {
  success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-300",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  neutral: "border-white/10 bg-white/5 text-slate-300",
  info: "border-sky-300/20 bg-sky-300/10 text-sky-200",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${badgeStyles[tone]}`}
    >
      {children}
    </span>
  );
}

