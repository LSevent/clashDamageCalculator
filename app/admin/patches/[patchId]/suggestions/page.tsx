import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { StatChangeDashboard } from "@/src/components/admin/StatChangeDashboard";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getStatChangeDashboardData } from "@/src/lib/admin/stat-change-data";

export const metadata: Metadata = {
  title: "Patch Stat Change Suggestions",
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ patchId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function PatchSuggestionsPage({
  params,
  searchParams,
}: PageProps) {
  const [auth, route, query] = await Promise.all([
    getAdminAuthState(),
    params,
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={query.error} />;
  }

  const dashboard = await getStatChangeDashboardData(route.patchId);

  return (
    <AdminLayout>
      <AdminNotice error={query.error} message={query.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">
          Suggested stat change review
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Generate conservative suggestions, review and edit them, approve
          exact changes, then apply them separately.
        </p>
      </div>
      <StatChangeDashboard
        data={dashboard.available ? dashboard.data : undefined}
        unavailableMessage={
          dashboard.available ? undefined : dashboard.message
        }
        showGenerator
      />
    </AdminLayout>
  );
}
