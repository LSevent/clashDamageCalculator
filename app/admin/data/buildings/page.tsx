import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { BuildingEditor } from "@/src/components/admin/BuildingEditor";
import { Card } from "@/src/components/ui/Card";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  getAdminBuildings,
  getAdminPatches,
} from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Buildings",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminBuildingsPage({ searchParams }: PageProps) {
  const [auth, params] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={params.error} />;
  }

  const [buildings, patches] = await Promise.all([
    getAdminBuildings(),
    getAdminPatches(),
  ]);
  const unavailableMessage =
    !buildings.available
      ? buildings.message
      : !patches.available
        ? patches.message
        : undefined;

  return (
    <AdminLayout>
      <AdminNotice error={params.error} message={params.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Building editor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Manage building definitions and individual HP rows. Missing HP is
          allowed but remains unavailable to the calculator.
        </p>
      </div>
      {buildings.available && patches.available ? (
        <BuildingEditor buildings={buildings.data} patches={patches.data} />
      ) : (
        <Card className="p-6 text-sm text-amber-100">
          {unavailableMessage}
        </Card>
      )}
    </AdminLayout>
  );
}
