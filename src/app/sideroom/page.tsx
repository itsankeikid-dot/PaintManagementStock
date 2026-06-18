import { getUserProfile } from "@/actions/auth";
import { getPaintItems } from "@/actions/paint-items";
import { AppHeader } from "@/components/shared/app-header";
import { redirect } from "next/navigation";
import SideroomPageClient from "./page-client";

/**
 * Sideroom page (Server Component).
 * Fetches data and renders the sideroom operator interface.
 */
export default async function SideroomPage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "sideroom" && profile.role !== "admin") {
    redirect("/login");
  }

  const paintItems = await getPaintItems(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader
        userName={profile.name}
        userRole={profile.role}
        title="Sideroom"
      />
      <main className="container mx-auto px-4 py-6 max-w-xl text-base">
        <SideroomPageClient paintItems={paintItems} />
      </main>
    </div>
  );
}
