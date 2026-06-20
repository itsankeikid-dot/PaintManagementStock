import { getPaintItems } from "@/actions/paint-items";
import { requireRole } from "@/lib/auth-guard";
import { PageLayout } from "@/components/shared/page-layout";
import WarehousePageClient from "./page-client";

/**
 * Warehouse page (Server Component).
 * Fetches data and renders the warehouse operator interface.
 */
export default async function WarehousePage() {
  const profile = await requireRole("warehouse", "admin");

  const paintItems = await getPaintItems(true);

  return (
    <PageLayout userName={profile.name} userRole={profile.role} title="Warehouse">
      <WarehousePageClient paintItems={paintItems} />
    </PageLayout>
  );
}
