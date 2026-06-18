import { getUserProfile } from "@/actions/auth";
import { getPaintItems } from "@/actions/paint-items";
import { AppHeader } from "@/components/shared/app-header";
import { redirect } from "next/navigation";
import PaintItemsPageClient from "./page-client";

/**
 * Admin paint items management page (Server Component).
 */
export default async function PaintItemsPage() {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/login");

  const items = await getPaintItems(false); // Include inactive items

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader
        userName={profile.name}
        userRole={profile.role}
        title="Manage Paint Items"
      />
      <main className="container mx-auto px-4 py-6">
        <PaintItemsPageClient initialItems={items} />
      </main>
    </div>
  );
}
