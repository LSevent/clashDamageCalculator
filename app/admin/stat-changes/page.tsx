import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { StatChangeDashboard } from "@/src/components/admin/StatChangeDashboard";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getStatChangeDashboardData } from "@/src/lib/admin/stat-change-data";

export const metadata: Metadata = {
  title: "Admin Stat Changes",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function StatChangesPage({ searchParams }: PageProps) {
  const [auth, query] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={query.error} />;
  }

  const dashboard = await getStatChangeDashboardData();

  return (
    <AdminLayout>
      <AdminNotice error={query.error} message={query.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">
          Stat change suggestions
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Review pending, approved, rejected, needs-info, and applied
          suggestions across all patch drafts.
        </p>
      </div>
      <StatChangeDashboard
        data={dashboard.available ? dashboard.data : undefined}
        unavailableMessage={
          dashboard.available ? undefined : dashboard.message
        }
      />
    </AdminLayout>
  );
}
