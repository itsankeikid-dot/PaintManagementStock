interface StatCardProps {
  /** Icon element rendered inside the icon container. */
  icon: React.ReactNode;
  /** Short label below the value. */
  label: string;
  /** Numeric value to display. */
  value: number;
  /** Tailwind classes for the outer card container (bg, border, etc.). */
  containerClass?: string;
  /** Tailwind classes for the icon container background. */
  iconBgClass?: string;
  /** Tailwind classes for the value text color. */
  valueClass?: string;
  /** Tailwind classes for the label text color. */
  labelClass?: string;
}

/**
 * Summary stat card: icon in a rounded box, a big number, and a label.
 * Used in admin pages (users, paint-items) for overview metrics.
 */
export function StatCard({
  icon,
  label,
  value,
  containerClass = "bg-white border-[#E2E8F0]",
  iconBgClass = "bg-slate-100",
  valueClass = "text-[#1e344a]",
  labelClass = "text-[#64748B]",
}: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm ${containerClass}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
        <p className={`text-xs font-medium ${labelClass}`}>{label}</p>
      </div>
    </div>
  );
}
