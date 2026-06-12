import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { PatchEditor } from "@/src/components/admin/PatchEditor";
import { Card } from "@/src/components/ui/Card";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import { getAdminPatches } from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Patches",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    patch?: string;
  }>;
};

export default async function AdminPatchesPage({ searchParams }: PageProps) {
  const [auth, params] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={params.error} />;
  }

  const patches = await getAdminPatches();

  return (
    <AdminLayout>
      <AdminNotice error={params.error} message={params.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Patch editor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create patch records, update sources and notes, and choose the single
          current patch.
        </p>
      </div>
      {patches.available ? (
        <PatchEditor
          patches={patches.data}
          selectedPatchId={params.patch}
        />
      ) : (
        <Card className="p-6 text-sm text-amber-100">{patches.message}</Card>
      )}
    </AdminLayout>
  );
}
