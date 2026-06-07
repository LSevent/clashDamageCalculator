import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { Panel } from "@/components/panel";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Project notes"
        title="About this calculator"
        description="A fan-made utility focused on making damage planning and progression comparisons easier to understand."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Panel className="p-6 sm:p-8">
          <h2 className="text-xl font-black text-white">What we are building</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              The goal is a fast, approachable calculator for exploring unit damage,
              defensive targets, upgrades, and common attack-planning questions.
            </p>
            <p>
              This first phase provides the navigation, responsive layout, and modular
              page structure. Calculation logic, imports, and persistence will be added
              only when their dedicated phases begin.
            </p>
          </div>
        </Panel>

        <Panel className="border-amber-300/12 bg-amber-300/[0.035] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">
            Fan content disclaimer
          </p>
          <p className="mt-5 text-xl font-black leading-8 text-white">
            This is an unofficial Clash of Clans calculator and is not endorsed by
            Supercell.
          </p>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Clash of Clans, Supercell, and associated names and marks belong to their
            respective owners.
          </p>
        </Panel>
      </div>
    </div>
  );
}
