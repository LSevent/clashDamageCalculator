import { Card } from "@/src/components/ui/Card";

const limitations = [
  "Static data is partial and will be expanded as values are verified.",
  "Some stats may need manual review after each Clash of Clans patch.",
  "The app does not automatically extract data from Clash of Clans.",
  "JSON import is optional and only reads data that a user provides.",
  "Damage results depend on the accuracy of the local stat data.",
];

export function DataLimitations() {
  return (
    <Card className="border-amber-300/15 bg-amber-300/[0.035] p-6 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">
        Known limitations
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">
        What this dashboard does not guarantee
      </h2>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400 sm:grid-cols-2">
        {limitations.map((limitation) => (
          <li key={limitation} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-300"
            />
            <span>{limitation}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
