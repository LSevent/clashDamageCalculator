import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { UpdateCheckerDashboard } from "@/src/components/admin/UpdateCheckerDashboard";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getUpdateCheckerDashboardData } from "@/src/lib/admin/update-checker";

export const metadata: Metadata = {
  title: "Official Update Checker",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminUpdatesPage({ searchParams }: PageProps) {
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

  const dashboard = await getUpdateCheckerDashboardData();

  return (
    <AdminLayout>
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">
          Official Update Checker
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Check official Clash of Clans public news sources for new posts.
          Detected posts are saved for admin review only and do not change
          calculator data.
        </p>
      </div>
      <UpdateCheckerDashboard
        data={dashboard.available ? dashboard.data : undefined}
        unavailableMessage={
          dashboard.available ? undefined : dashboard.message
        }
      />
    </AdminLayout>
  );
}
