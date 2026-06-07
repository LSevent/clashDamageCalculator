import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/8 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </section>
  );
}

