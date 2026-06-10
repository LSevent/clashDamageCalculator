import { Card } from "@/src/components/ui/Card";

const limitations = [
  "Calculator results depend on the accuracy of the active database or fallback data. Some newly changed Clash of Clans stats may be marked partial or needs-review until manually verified.",
  "Seed and fallback data is intentionally limited to values that can be represented without guessing.",
  "The app does not automatically extract data from Clash of Clans.",
  "JSON import is optional and only reads data that a user provides.",
];

export function DataLimitations() {
  return (
    <Card className="border-amber-300/15 bg-amber-300/[0.035] p-6 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">
        Known limitations
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">
        Data notes
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
