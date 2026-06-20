import { AppHeader } from "@/components/shared/app-header";
import type { UserRole } from "@/types/database";

interface PageLayoutProps {
  userName: string;
  userRole: UserRole;
  title: string;
  children: React.ReactNode;
}

/**
 * Shared server-component layout: full-height background,
 * app header, and a padded main container.
 */
export function PageLayout({ userName, userRole, title, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader userName={userName} userRole={userRole} title={title} />
      <main className="mx-auto px-4 py-6 text-base">
        {children}
      </main>
    </div>
  );
}
