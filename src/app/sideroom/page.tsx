import { getPaintItems } from "@/actions/paint-items";
import { requireRole } from "@/lib/auth-guard";
import { PageLayout } from "@/components/shared/page-layout";
import SideroomPageClient from "./page-client";

/**
 * Sideroom page (Server Component).
 * Fetches data and renders the sideroom operator interface.
 */
export default async function SideroomPage() {
  const profile = await requireRole("sideroom", "admin");

  const paintItems = await getPaintItems(true);

  return (
    <PageLayout userName={profile.name} userRole={profile.role} title="Sideroom">
      <SideroomPageClient paintItems={paintItems} />
    </PageLayout>
  );
}
