import { redirect } from "next/navigation";
import { getUserProfile } from "@/actions/auth";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/role-config";
import type { UserRole } from "@/types/database";
import LoginPageClient from "./page-client";

/**
 * Login page (Server Component).
 * If the user already has a valid session, redirect them to their role's
 * landing page. This replaces the login-redirect logic that previously lived
 * in proxy.ts (removed for OpenNext Cloudflare compatibility).
 */
export default async function LoginPage() {
  const profile = await getUserProfile();

  if (profile) {
    redirect(ROLE_DASHBOARD_ROUTES[profile.role as UserRole] || "/dashboard");
  }

  return <LoginPageClient />;
}
