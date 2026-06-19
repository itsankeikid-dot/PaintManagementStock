"use client";

import { useState } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/types/database";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  LogOut,
  Paintbrush,
  LayoutDashboard,
  Warehouse,
  DoorOpen,
  Menu,
  X,
  ChevronRight,
  Palette,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AppHeaderProps {
  /** Page title displayed next to the factory icon */
  title: string;
  /** User's display name (not needed in minimal mode) */
  userName?: string;
  /** User's role (not needed in minimal mode) */
  userRole?: UserRole;
  /** Minimal mode: shows only branding, no nav/logout (used on login page) */
  minimal?: boolean;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="size-4" />,
  "/warehouse": <Warehouse className="size-4" />,
  "/sideroom": <DoorOpen className="size-4" />,
  "/admin/paint-items": <Palette className="size-4" />,
  "/admin/users": <Users className="size-4" />,
};

/**
 * Shared application header component.
 * Clean, modern header with branding, role-based navigation, user info, and logout.
 * Includes a mobile hamburger menu via Sheet.
 */
export function AppHeader({
  title,
  userName,
  userRole,
  minimal = false,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.success) {
        toast.error("Logout failed");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  // Build role-specific navigation links
  const navLinks: { href: string; label: string }[] = [];
  if (!minimal && userRole) {
    if (userRole === "admin") {
      navLinks.push(
        { href: "/dashboard", label: "Dashboard" },
        { href: "/warehouse", label: "Warehouse" },
        { href: "/sideroom", label: "Sideroom" },
        { href: "/admin/paint-items", label: "Paint Items" },
        { href: "/admin/users", label: "Users" }
      );
    } else if (userRole === "office") {
      navLinks.push({ href: "/dashboard", label: "Dashboard" });
    } else if (userRole === "warehouse") {
      navLinks.push({ href: "/warehouse", label: "Warehouse" });
    } else if (userRole === "sideroom") {
      navLinks.push({ href: "/sideroom", label: "Sideroom" });
    }
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // User initials for avatar
  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 lg:px-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-primary to-blue-600 shadow-sm">
            <Paintbrush className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {minimal && (
              <p className="text-xs text-muted-foreground">
                Warehouse Management
              </p>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        {!minimal && navLinks.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}>
                  <div className="relative px-1">
                    <Button
                      variant="ghost"
                      size="default"
                      className={
                        active
                          ? "gap-2 bg-primary/10 font-semibold text-primary hover:bg-primary/15"
                          : "gap-2 text-muted-foreground hover:text-foreground"
                      }
                    >
                      {NAV_ICONS[link.href]}
                      {link.label}
                    </Button>
                    {active && (
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: User info + Logout (desktop) / Hamburger (mobile) */}
        {!minimal && (
          <div className="flex items-center gap-2">
            {/* Desktop: user info + logout */}
            {userName && userRole && (
              <div className="hidden items-center gap-3 md:flex">
                <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-secondary/50 py-1 pl-1 pr-3">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight text-foreground">
                      {userName}
                    </p>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      {ROLE_LABELS[userRole]}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
              </Button>
            </div>

            {/* Mobile: hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                  />
                }
              >
                {mobileOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </SheetTrigger>
              <SheetContent side="right" showCloseButton={false} className="w-72 p-0">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-blue-600">
                        <Paintbrush className="size-4 text-white" />
                      </div>
                      <span className="text-base font-bold tracking-tight">
                        Paint Stock
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* User info in mobile menu */}
                {userName && userRole && (
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABELS[userRole]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile nav links */}
                <div className="flex flex-col gap-1 p-2">
                  {navLinks.map((link) => {
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <div
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {NAV_ICONS[link.href]}
                            {link.label}
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile logout */}
                <div className="mt-auto border-t border-border p-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
}
