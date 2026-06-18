import { redirect } from "next/navigation";
import { getUserProfile } from "@/actions/auth";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/constants";

/**
 * Root page - redirects authenticated users to their role-specific dashboard,
 * or to the login page if not authenticated.
 */
export default async function Home() {
  const profile = await getUserProfile();

  if (profile) {
    const route = ROLE_DASHBOARD_ROUTES[profile.role] || "/dashboard";
    redirect(route);
  }

  redirect("/login");
}
