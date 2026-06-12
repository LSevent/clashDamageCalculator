"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { checkForUpdatesAction } from "@/src/lib/admin/update-check-actions";
import type { UpdateCheckActionState } from "@/src/types/admin-update-check";

import { adminPrimaryButtonClass } from "./admin-styles";

type UpdateCheckButtonProps = {
  disabled?: boolean;
};

const initialState: UpdateCheckActionState = {
  ok: true,
};

export function UpdateCheckButton({
  disabled = false,
}: UpdateCheckButtonProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  function runCheck() {
    startTransition(async () => {
      const nextState = await checkForUpdatesAction();
      setState(nextState);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        className={`${adminPrimaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        type="button"
        disabled={disabled || isPending}
        onClick={runCheck}
      >
        {isPending ? "Checking official sources..." : "Check for Updates"}
      </button>

      {state.message ? (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            state.ok
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-amber-300/20 bg-amber-300/10 text-amber-100"
          }`}
          aria-live="polite"
        >
          <p className="font-bold">{state.message}</p>
          {state.summary ? (
            <>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["Sources checked", state.summary.sourcesChecked],
                  ["New posts", state.summary.newPosts],
                  ["Already known", state.summary.alreadyKnownPosts],
                  ["Failed sources", state.summary.failedSources],
                  ["Cooldown skipped", state.summary.sourcesSkipped],
                  ["Ignored matches", state.summary.ignoredPosts],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-current/10 bg-black/10 p-2.5"
                  >
                    <dt className="text-[0.65rem] font-extrabold uppercase tracking-wider opacity-70">
                      {label}
                    </dt>
                    <dd className="mt-1 text-lg font-black">{value}</dd>
                  </div>
                ))}
              </dl>
              {state.summary.messages.length > 0 ? (
                <ul className="mt-2 grid gap-1 text-xs leading-5 opacity-90">
                  {state.summary.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
