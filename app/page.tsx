import Link from "next/link";

import { Panel } from "@/components/panel";

const features = [
  {
    number: "01",
    title: "Damage calculator",
    description:
      "Compare verified equipment and Earthquake damage against loaded building HP data.",
    href: "/calculator",
    label: "Open calculator",
  },
  {
    number: "02",
    title: "Saved progress",
    description:
      "Store your Town Hall, equipment, and spell levels locally for faster setup.",
    href: "/progress",
    label: "Set progress",
  },
  {
    number: "03",
    title: "Optional JSON import",
    description:
      "Preview user-provided village JSON before saving normalized progress in your browser.",
    href: "/progress",
    label: "Review import options",
  },
  {
    number: "04",
    title: "Patch tracking",
    description:
      "See source coverage, verification status, patch notes, and known data limitations.",
    href: "/data-manager",
    label: "View Data Manager",
  },
];

const previewRows = [
  ["Target", "TH18 Scattershot Lv7"],
  ["Loaded HP", "5,800"],
  ["Equipment", "Giant Arrow + Rocket Backpack"],
  ["Spell", "Earthquake Lv5"],
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
              Static-data MVP
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Check a damage plan with{" "}
              <span className="text-emerald-400">clear numbers.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              Choose a loaded defense, hero equipment, and Earthquake count to
              see damage, remaining HP, and the minimum Earthquakes needed.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/calculator"
                className="rounded-xl bg-emerald-400 px-5 py-3.5 text-center text-sm font-extrabold text-emerald-950 shadow-[0_12px_40px_rgba(16,185,129,0.2)] transition hover:bg-emerald-300"
              >
                Open Calculator
              </Link>
              <Link
                href="/progress"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Set Progress
              </Link>
              <Link
                href="/data-manager"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                View Data Manager
              </Link>
            </div>
          </div>

          <Panel className="relative overflow-hidden p-5 sm:p-7">
            <div className="absolute right-0 top-0 h-32 w-32 bg-amber-300/8 blur-3xl" />
            <div className="flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  Example setup
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Calculator at a glance
                </p>
              </div>
              <span className="rounded-lg border border-emerald-300/15 bg-emerald-300/8 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Live MVP
              </span>
            </div>

            <dl className="mt-5 divide-y divide-white/8 rounded-2xl border border-white/8 bg-black/20 px-4">
              {previewRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {label}
                  </dt>
                  <dd className="text-sm font-black text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-2xl border border-amber-300/12 bg-amber-300/[0.05] p-4 text-sm leading-6 text-amber-100">
              Results use local static data. Check the Data Manager for source
              and verification status.
            </div>
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-400">
              MVP features
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Planning tools that work together
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            The calculator works without saved progress. Manual setup and JSON
            import are optional conveniences stored only in this browser.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.number} href={feature.href} className="group">
              <Panel className="h-full p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-emerald-300/20 group-hover:bg-white/[0.055]">
                <span className="text-xs font-black tracking-[0.18em] text-emerald-400">
                  {feature.number}
                </span>
                <h3 className="mt-8 text-xl font-black text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
                <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-300 transition group-hover:text-emerald-300">
                  {feature.label} <span aria-hidden="true">&rarr;</span>
                </p>
              </Panel>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-xs leading-5 text-slate-600">
          Unofficial fan-made calculator. Not endorsed by Supercell.
        </p>
      </section>
    </>
  );
}
