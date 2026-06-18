import { getUserProfile } from "@/actions/auth";
import { getPaintItems } from "@/actions/paint-items";
import { AppHeader } from "@/components/shared/app-header";
import { redirect } from "next/navigation";
import WarehousePageClient from "./page-client";

/**
 * Warehouse page (Server Component).
 * Fetches data and renders the warehouse operator interface.
 */
export default async function WarehousePage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "warehouse" && profile.role !== "admin") {
    redirect("/login");
  }

  const paintItems = await getPaintItems(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader
        userName={profile.name}
        userRole={profile.role}
        title="Warehouse"
      />
      <main className="container mx-auto px-4 py-6 max-w-xl text-base">
        <WarehousePageClient paintItems={paintItems} />
      </main>
    </div>
  );
}
