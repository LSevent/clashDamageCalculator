import { loginAdminAction } from "@/src/lib/admin/admin-actions";
import type { AdminAuthState } from "@/src/types/admin";

import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "./admin-styles";

type AdminGateProps = {
  state: AdminAuthState;
  error?: string;
  message?: string;
};

export function AdminGate({ state, error, message }: AdminGateProps) {
  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
      <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
          Protected workspace
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
          Admin data editor
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          This area is for small, trusted corrections to database-backed game
          data. Static fallback files are never edited here.
        </p>

        {message ? (
          <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-5 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {!state.configured ? (
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            Admin editor is not configured. Set{" "}
            <code className="font-bold">ADMIN_ACCESS_KEY</code> to enable it.
          </div>
        ) : (
          <form action={loginAdminAction} className="mt-7 grid gap-5">
            <label className={adminLabelClass}>
              Admin access key
              <input
                className={adminInputClass}
                name="accessKey"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className={adminPrimaryButtonClass} type="submit">
              Unlock admin editor
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
