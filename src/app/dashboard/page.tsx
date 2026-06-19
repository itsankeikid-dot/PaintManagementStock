import { getUserProfile } from "@/actions/auth";
import { AppHeader } from "@/components/shared/app-header";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/constants";
import DashboardPageClient from "./page-client";

/**
 * Admin dashboard page (Server Component).
 * Renders the real-time monitoring dashboard with charts.
 */
export default async function DashboardPage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin" && profile.role !== "office") {
    redirect(ROLE_DASHBOARD_ROUTES[profile.role] || "/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        userName={profile.name}
        userRole={profile.role}
        title="Dashboard"
      />
      <main className="container mx-auto px-4 py-6">
        <DashboardPageClient role={profile.role} />
      </main>
    </div>
  );
}
