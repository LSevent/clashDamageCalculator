import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { EquipmentEditor } from "@/src/components/admin/EquipmentEditor";
import { Card } from "@/src/components/ui/Card";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  getAdminEquipment,
  getAdminPatches,
} from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Equipment",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminEquipmentPage({ searchParams }: PageProps) {
  const [auth, params] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={params.error} />;
  }

  const [equipment, patches] = await Promise.all([
    getAdminEquipment(),
    getAdminPatches(),
  ]);
  const unavailableMessage =
    !equipment.available
      ? equipment.message
      : !patches.available
        ? patches.message
        : undefined;

  return (
    <AdminLayout>
      <AdminNotice error={params.error} message={params.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Equipment editor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Correct equipment stats and JSON special rules. Invalid JSON is
          rejected before database writes.
        </p>
      </div>
      {equipment.available && patches.available ? (
        <EquipmentEditor equipment={equipment.data} patches={patches.data} />
      ) : (
        <Card className="p-6 text-sm text-amber-100">
          {unavailableMessage}
        </Card>
      )}
    </AdminLayout>
  );
}
