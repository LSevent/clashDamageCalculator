import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAdminAction } from "@/src/lib/admin/admin-actions";

import { adminSecondaryButtonClass } from "./admin-styles";

const adminNavigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/data", label: "Data dashboard" },
  { href: "/admin/data/patches", label: "Patches" },
  { href: "/admin/data/buildings", label: "Buildings" },
  { href: "/admin/data/equipment", label: "Equipment" },
  { href: "/admin/data/spells", label: "Spells" },
  { href: "/admin/data/import-export", label: "Import / Export" },
  { href: "/admin/updates", label: "Update Checker" },
];

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
            Protected admin
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Game data editor
          </h1>
        </div>
        <form action={logoutAdminAction}>
          <button className={adminSecondaryButtonClass} type="submit">
            Log out
          </button>
        </form>
      </div>

      <nav
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        aria-label="Admin navigation"
      >
        {adminNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-emerald-300/20 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">{children}</div>
    </div>
  );
}
