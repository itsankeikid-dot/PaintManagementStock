import { ShieldCheck, Warehouse, FlaskConical } from "lucide-react";
import type { UserRole } from "@/types/database";

export const ROLE_STYLES: Record<UserRole, { bg: string; border: string; text: string }> = {
  admin:     { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-800" },
  warehouse: { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-800"   },
  sideroom:  { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800"  },
};

export const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin:     <ShieldCheck  className="size-3.5" aria-hidden="true" />,
  warehouse: <Warehouse    className="size-3.5" aria-hidden="true" />,
  sideroom:  <FlaskConical className="size-3.5" aria-hidden="true" />,
};
