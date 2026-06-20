import { getUsers } from "@/actions/users";
import { requireRole } from "@/lib/auth-guard";
import { PageLayout } from "@/components/shared/page-layout";
import UsersPageClient from "./page-client";

/**
 * Admin user management page (Server Component).
 */
export default async function UsersPage() {
  const profile = await requireRole("admin");

  const profiles = await getUsers();

  return (
    <PageLayout userName={profile.name} userRole={profile.role} title="Manage Users">
      <UsersPageClient initialProfiles={profiles} />
    </PageLayout>
  );
}
