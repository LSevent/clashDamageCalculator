import Link from "next/link";

import { Panel } from "@/components/panel";

const features = [
  {
    number: "01",
    title: "Build an attack",
    description: "Choose troops, levels, and targets in a focused calculator workspace.",
    href: "/calculator",
    label: "Open calculator",
  },
  {
    number: "02",
    title: "Track progression",
    description: "Prepare your current upgrade levels so future comparisons stay relevant.",
    href: "/progress",
    label: "Set up progress",
  },
  {
    number: "03",
    title: "Manage game data",
    description: "A dedicated area for reviewing the data that will power calculations.",
    href: "/data-manager",
    label: "View data manager",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute left-1/2 top-16 size-[34rem] -translate-x-1/2 rounded-full bg-emerald-400/8 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              Unofficial strategy tool
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Plan every hit with{" "}
              <span className="text-emerald-400">better numbers.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              A clean workspace for exploring Clash of Clans damage, upgrades, and
              attack decisions. Built for quick answers without spreadsheet sprawl.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculator"
                className="rounded-xl bg-emerald-400 px-5 py-3.5 text-center text-sm font-extrabold text-emerald-950 shadow-[0_12px_40px_rgba(16,185,129,0.2)] transition hover:bg-emerald-300"
              >
                Open calculator
              </Link>
              <Link
                href="/progress"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Set up progression
              </Link>
            </div>
          </div>

          <Panel className="relative overflow-hidden p-5 sm:p-7">
            <div className="absolute right-0 top-0 h-32 w-32 bg-amber-300/8 blur-3xl" />
            <div className="flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  Battle preview
                </p>
                <p className="mt-2 text-lg font-black text-white">Damage workspace</p>
              </div>
              <span className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Preview
              </span>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Attacker
                </p>
                <p className="mt-8 text-2xl font-black text-white">Select unit</p>
                <p className="mt-1 text-xs text-slate-500">Level and boosts</p>
              </div>
              <span className="text-xs font-black text-slate-600">VS</span>
              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Target
                </p>
                <p className="mt-8 text-2xl font-black text-white">Select defense</p>
                <p className="mt-1 text-xs text-slate-500">Level and modifiers</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Estimated outcome
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-600">---</p>
                </div>
                <div className="h-10 w-28 rounded-lg bg-white/5" />
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-400">
              Built for planning
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              One tool, three focused workflows
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Phase 1 establishes the workspace. Calculation and data features will arrive
            in later phases.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.number} href={feature.href} className="group">
              <Panel className="h-full p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-emerald-300/20 group-hover:bg-white/[0.055]">
                <span className="text-xs font-black tracking-[0.18em] text-emerald-400">
                  {feature.number}
                </span>
                <h3 className="mt-8 text-xl font-black text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
                <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300 transition group-hover:text-emerald-300">
                  {feature.label} <span aria-hidden="true">→</span>
                </p>
              </Panel>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

