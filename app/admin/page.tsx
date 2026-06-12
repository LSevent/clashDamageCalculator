import type { Metadata } from "next";
import Link from "next/link";

import { AdminDataDashboard } from "@/src/components/admin/AdminDataDashboard";
import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { Card } from "@/src/components/ui/Card";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getAdminDataSummary } from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [auth, params] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return (
      <AdminGate
        state={auth}
        error={params.error}
        message={params.message}
      />
    );
  }

  const summary = await getAdminDataSummary();

  return (
    <AdminLayout>
      <AdminNotice error={params.error} message={params.message} />
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Manual corrections
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Review and correct database-backed game data
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Use these editors for small verified changes, curated bulk stat
            imports, and review-only checks of official public news.
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-black text-white">Quick links</p>
          <div className="mt-4 grid gap-2">
            <Link className="text-sm font-bold text-emerald-300" href="/data-manager">
              Open public Data Manager
            </Link>
            <Link className="text-sm font-bold text-emerald-300" href="/calculator">
              Open public Calculator
            </Link>
            <Link className="text-sm font-bold text-emerald-300" href="/admin/updates">
              Check official updates
            </Link>
          </div>
        </Card>
      </div>
      <AdminDataDashboard
        summary={summary.available ? summary.data : undefined}
        unavailableMessage={
          summary.available ? undefined : summary.message
        }
      />
    </AdminLayout>
  );
}
