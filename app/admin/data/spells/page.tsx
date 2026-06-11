import type { Metadata } from "next";

import { AdminGate } from "@/src/components/admin/AdminGate";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { AdminNotice } from "@/src/components/admin/AdminNotice";
import { SpellEditor } from "@/src/components/admin/SpellEditor";
import { Card } from "@/src/components/ui/Card";
import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  getAdminPatches,
  getAdminSpells,
} from "@/src/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "Admin Spells",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminSpellsPage({ searchParams }: PageProps) {
  const [auth, params] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (!auth.authenticated) {
    return <AdminGate state={auth} error={params.error} />;
  }

  const [spells, patches] = await Promise.all([
    getAdminSpells(),
    getAdminPatches(),
  ]);
  const unavailableMessage =
    !spells.available
      ? spells.message
      : !patches.available
        ? patches.message
        : undefined;

  return (
    <AdminLayout>
      <AdminNotice error={params.error} message={params.message} />
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Spell editor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Manage spell stats, percentages, and known repeat-damage rules.
        </p>
      </div>
      {spells.available && patches.available ? (
        <SpellEditor spells={spells.data} patches={patches.data} />
      ) : (
        <Card className="p-6 text-sm text-amber-100">
          {unavailableMessage}
        </Card>
      )}
    </AdminLayout>
  );
}
