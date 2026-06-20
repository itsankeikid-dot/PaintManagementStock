import { getUserProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/role-config";
import { PageLayout } from "@/components/shared/page-layout";
import type { UserRole } from "@/types/database";
import DashboardPageClient from "./page-client";

/**
 * Admin dashboard page (Server Component).
 * Renders the real-time monitoring dashboard with charts.
 */
export default async function DashboardPage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  const role = profile.role as UserRole;
  if (role !== "admin" && role !== "office") {
    redirect(ROLE_DASHBOARD_ROUTES[role] || "/login");
  }

  return (
    <PageLayout userName={profile.name} userRole={role} title="Dashboard">
      <DashboardPageClient role={role} />
    </PageLayout>
  );
}
