import { getPaintItems } from "@/actions/paint-items";
import { requireRole } from "@/lib/auth-guard";
import { PageLayout } from "@/components/shared/page-layout";
import PaintItemsPageClient from "./page-client";

/**
 * Admin paint items management page (Server Component).
 */
export default async function PaintItemsPage() {
  const profile = await requireRole("admin");

  const items = await getPaintItems(false); // Include inactive items

  return (
    <PageLayout userName={profile.name} userRole={profile.role} title="Manage Paint Items">
      <PaintItemsPageClient initialItems={items} />
    </PageLayout>
  );
}
