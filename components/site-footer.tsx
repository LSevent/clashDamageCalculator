import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <BrandMark />
        <p className="max-w-lg text-xs leading-5 text-slate-500 md:text-right">
          An unofficial fan-made planning tool. Clash of Clans and related marks are
          property of Supercell.
        </p>
        <Link
          href="/about"
          className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:text-emerald-300"
        >
          About this project
        </Link>
      </div>
    </footer>
  );
}

