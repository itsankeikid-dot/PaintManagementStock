import { ShieldCheck, Warehouse, FlaskConical, Briefcase } from "lucide-react";
import type { UserRole } from "@/types/database";

export const ROLE_STYLES: Record<UserRole, { bg: string; border: string; text: string }> = {
  admin:     { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-800" },
  warehouse: { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-800"   },
  sideroom:  { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800"  },
  office:    { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-800"   },
};

export const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin:     <ShieldCheck  className="size-4" aria-hidden="true" />,
  warehouse: <Warehouse    className="size-4" aria-hidden="true" />,
  sideroom:  <FlaskConical className="size-4" aria-hidden="true" />,
  office:    <Briefcase    className="size-4" aria-hidden="true" />,
};
