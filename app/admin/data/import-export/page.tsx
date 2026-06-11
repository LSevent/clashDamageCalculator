import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { BulkImportExportDashboard } from "@/src/components/admin/BulkImportExportDashboard";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getAdminDataSummary } from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Bulk Import Export",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminImportExportPage({
  searchParams,
}: PageProps) {
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
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">
          Bulk import and export
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Export database stat tables, download templates, and preview curated
          CSV changes before applying them. Static fallback files are never
          modified.
        </p>
      </div>
      <BulkImportExportDashboard databaseAvailable={summary.available} />
    </AdminLayout>
  );
}
