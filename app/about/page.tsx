import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { Panel } from "@/components/panel";

export const metadata: Metadata = {
  title: "About",
};

const privacyNotes = [
  "No Supercell ID login is required.",
  "Manual progress is stored locally in your browser.",
  "JSON import is optional and only processes data you voluntarily paste.",
  "The raw pasted JSON is not stored after imported progress is saved.",
];

const appBoundaries = [
  "It does not scrape, inspect, or extract data from Clash of Clans.",
  "It does not request an email, password, recovery code, or 2FA code.",
  "It does not automatically update game stats after a patch.",
  "It does not guarantee that partial or needs-review data is complete.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Project notes"
        title="About this calculator"
        description="A static-data planning utility for checking whether selected equipment and Earthquake damage can destroy a loaded building target."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <Panel className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
            What it does
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Focused damage planning
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            The app combines locally stored building, equipment, and spell data
            to show direct damage, spell damage, remaining HP, overkill, source
            breakdowns, and minimum Earthquake requirements. Manual setup is
            always available, with optional JSON import for faster progress
            entry.
          </p>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-300">
            Privacy
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Local by default
          </h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
            {privacyNotes.map((note) => (
              <li key={note} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300"
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
            What it does not do
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            No account access or extraction
          </h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
            {appBoundaries.map((boundary) => (
              <li key={boundary} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-500"
                />
                <span>{boundary}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="border-amber-300/12 bg-amber-300/[0.035] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">
            Accuracy and fan content
          </p>
          <p className="mt-5 text-xl font-black leading-8 text-white">
            This is an unofficial Clash of Clans calculator and is not endorsed
            by Supercell.
          </p>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            Static data may be incomplete or require manual verification after
            new patches. Calculator results depend on the values currently
            stored in the app. Clash of Clans, Supercell, and associated names
            and marks belong to their respective owners.
          </p>
        </Panel>
      </div>
    </div>
  );
}
