import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import type { DailyUsage } from "@/types/database";
import type { DateRangePreset } from "@/hooks/use-daily-usage";

/* ── Bar configuration ── */
const BAR_CONFIG = [
  { key: "issued",   name: "Dikeluarkan", fill: "#111827", label: "Dikeluarkan dari gudang" },
  { key: "consumed", name: "Dipakai",     fill: "#d1493f", label: "Dipakai / Terpakai" },
  { key: "wasted",   name: "Dibuang",     fill: "#2f855a", label: "Dibuang / Dispose" },
] as const;

/* ── Custom Tooltip ── */
interface TooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; fill: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || !label) return null;

  // Parse date and format as DD/MM/YYYY
  const d = new Date(label + "T00:00:00");
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  // Day name in Indonesian
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = dayNames[d.getDay()];

  // Find the largest value for visual emphasis
  const maxVal = Math.max(...payload.map((p) => p.value));
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

  // Filter out zero entries for cleaner display
  const visibleEntries = payload.filter((p) => p.value > 0);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl shadow-slate-200/50 min-w-[220px] overflow-hidden">
      {/* Header with date */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#F1F5F9]">
        <p className="text-xs font-semibold text-[#1e344a]">{dayName}</p>
        <p className="text-[11px] text-[#64748B]">{dateStr}</p>
      </div>

      {/* Entries */}
      <div className="px-4 py-2.5 space-y-2">
        {visibleEntries.length === 0 ? (
          <p className="text-xs text-[#94A3B8] py-1">Tidak ada aktivitas</p>
        ) : (
          visibleEntries.map((entry) => {
            const config = BAR_CONFIG.find((b) => b.key === entry.dataKey);
            const isMax = entry.value === maxVal;
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.fill }}
                    aria-hidden="true"
                  />
                  <span className={`text-xs ${isMax ? "font-semibold text-[#1e344a]" : "text-[#64748B]"}`}>
                    {config?.name || entry.dataKey}
                  </span>
                </div>
                <span className={`text-sm tabular-nums shrink-0 ${isMax ? "font-bold text-[#1e344a]" : "font-medium text-[#475569]"}`}>
                  {entry.value.toFixed(1)} <span className="text-[10px] font-normal text-[#94A3B8]">kg</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Total footer */}
      {visibleEntries.length > 1 && (
        <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#FAFBFC]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#64748B]">Total</span>
            <span className="text-xs font-bold text-[#1e344a] tabular-nums">
              {total.toFixed(1)} <span className="text-[10px] font-normal text-[#94A3B8]">kg</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface DailyUsageChartProps {
  dailyUsage: DailyUsage[];
  dateRange: DateRangePreset;
  onDateRangeChange: (range: DateRangePreset) => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
  isExporting: boolean;
  onExport: () => void;
}

const PRESETS: readonly [DateRangePreset, string][] = [
  ["7d", "7 Hari"],
  ["14d", "14 Hari"],
  ["30d", "30 Hari"],
  ["custom", "Custom"],
];

export function DailyUsageChart({
  dailyUsage,
  dateRange,
  onDateRangeChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  isExporting,
  onExport,
}: DailyUsageChartProps) {
  const isEmpty = dailyUsage.every((d) => d.issued === 0 && d.consumed === 0 && d.wasted === 0);

  return (
    <section className="space-y-3">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
        Daily Usage
      </h3>
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Daily Paint Usage
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1">
                {PRESETS.map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => onDateRangeChange(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      dateRange === val
                        ? "bg-[#0e7ad5] text-white shadow-sm"
                        : "text-[#64748B] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateRange === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => onCustomFromChange(e.target.value)}
                    className="h-8 rounded-lg border border-[#E2E8F0] px-2 text-xs text-[#475569]"
                  />
                  <span className="text-xs text-[#94A3B8]">–</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => onCustomToChange(e.target.value)}
                    className="h-8 rounded-lg border border-[#E2E8F0] px-2 text-xs text-[#475569]"
                  />
                </div>
              )}
              <button
                onClick={onExport}
                disabled={dailyUsage.length === 0 || isExporting}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className={`size-3.5 ${isExporting ? "animate-pulse" : ""}`} aria-hidden="true" />
                {isExporting ? "Exporting..." : "Export Detail"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isEmpty ? (
            <div className="flex items-center justify-center h-[320px] text-slate-400 text-sm">
              Tidak ada data penggunaan untuk rentang waktu ini.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyUsage} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(val) => {
                    const d = new Date(val + "T00:00:00");
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(14, 122, 213, 0.04)" }}
                />
                <Legend />
                {BAR_CONFIG.map((bar) => (
                  <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.fill} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
