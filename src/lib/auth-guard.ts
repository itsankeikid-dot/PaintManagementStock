import { getUserProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";

/**
 * Server-side auth guard: ensures the current user is authenticated
 * and has one of the allowed roles. Redirects to /login otherwise.
 * Returns the validated profile for use in the calling page.
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const profile = await getUserProfile();

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/login");
  }

  return profile;
}
