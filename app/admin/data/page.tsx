import type { Metadata } from "next";

import { AdminDataDashboard } from "@/src/components/admin/AdminDataDashboard";
import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getAdminDataSummary } from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Data",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminDataPage({ searchParams }: PageProps) {
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
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Data dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Database-only edit coverage and verification status.
        </p>
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
