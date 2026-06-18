import { getUserProfile } from "@/actions/auth";
import { getUsers } from "@/actions/users";
import { AppHeader } from "@/components/shared/app-header";
import { redirect } from "next/navigation";
import UsersPageClient from "./page-client";

/**
 * Admin user management page (Server Component).
 */
export default async function UsersPage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/login");

  const profiles = await getUsers();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader
        userName={profile.name}
        userRole={profile.role}
        title="Manage Users"
      />
      <main className="container mx-auto px-4 py-6">
        <UsersPageClient initialProfiles={profiles} />
      </main>
    </div>
  );
}
