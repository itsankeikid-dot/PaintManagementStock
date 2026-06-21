"use client";

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
  Cell,
} from "recharts";
import { Download, BarChart3 } from "lucide-react";
import type { PaintItemUsageSummary } from "@/types/database";

/* ── Custom Tooltip for horizontal bar chart ── */
interface BarTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; fill: string; name: string }[];
  label?: string;
}

function SummaryBarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl shadow-slate-200/50 min-w-[200px] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#F1F5F9]">
        <p className="text-xs font-semibold text-[#1e344a]">{label}</p>
      </div>
      <div className="px-4 py-2.5 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: entry.fill }}
                aria-hidden="true"
              />
              <span className="text-xs text-[#64748B]">{entry.name}</span>
            </div>
            <span className="text-sm tabular-nums font-semibold text-[#1e344a]">
              {entry.value.toFixed(1)} <span className="text-[10px] font-normal text-[#94A3B8]">kg</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Custom Legend ── */
function SummaryLegend(props: {
  payload?: { dataKey: string; color: string; value: string }[];
}) {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Waste ratio badge ── */
function WasteBadge({ ratio }: { ratio: number }) {
  let colorClass = "bg-emerald-50 text-emerald-700";
  if (ratio > 20) colorClass = "bg-red-50 text-red-700";
  else if (ratio > 10) colorClass = "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${colorClass}`}>
      {ratio.toFixed(1)}%
    </span>
  );
}

interface PaintItemUsageSummaryProps {
  usageSummary: PaintItemUsageSummary[];
  isExporting: boolean;
  onExport: () => void;
  isLoading?: boolean;
}

const CONSUMED_COLOR = "#3b82f6";
const WASTED_COLOR = "#dc2626";

/** Maximum items shown in the horizontal bar chart (rest only in table) */
const MAX_CHART_ITEMS = 10;

export function PaintItemUsageSummary({
  usageSummary,
  isExporting,
  onExport,
  isLoading,
}: PaintItemUsageSummaryProps) {
  const isEmpty = usageSummary.length === 0;

  // Data for the horizontal bar chart (top consumers only)
  const chartData = usageSummary.slice(0, MAX_CHART_ITEMS).map((s) => ({
    name: s.paint_name.length > 18 ? s.paint_name.slice(0, 16) + "..." : s.paint_name,
    consumed: s.total_consumed,
    wasted: s.total_wasted,
    color_hex: s.color_hex,
  }));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-slate-400" aria-hidden="true" />
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Analisis Penggunaan per Item Cat
          </h3>
        </div>
        <button
          onClick={onExport}
          disabled={isEmpty || isExporting}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className={`size-3.5 ${isExporting ? "animate-pulse" : ""}`} aria-hidden="true" />
          {isExporting ? "Exporting..." : "Export"}
        </button>
      </div>

      {isLoading ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm">
              Memuat data...
            </div>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm">
              Tidak ada data penggunaan untuk rentang waktu ini.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Horizontal bar chart: consumption ranking */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Peringkat Konsumsi Cat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#475569", fontSize: 12 }}
                    width={140}
                  />
                  <Tooltip content={<SummaryBarTooltip />} cursor={{ fill: "rgba(14, 122, 213, 0.04)" }} />
                  <Legend content={<SummaryLegend />} />
                  <Bar dataKey="consumed" name="Terpakai" fill={CONSUMED_COLOR} radius={[0, 3, 3, 0]} barSize={14}>
                    {chartData.map((entry, index) => (
                      <Cell key={`consumed-${index}`} fill={entry.color_hex || CONSUMED_COLOR} />
                    ))}
                  </Bar>
                  <Bar dataKey="wasted" name="Dibuang" fill={WASTED_COLOR} radius={[0, 3, 3, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
              {usageSummary.length > MAX_CHART_ITEMS && (
                <p className="text-center text-xs text-slate-400 mt-2">
                  Menampilkan {MAX_CHART_ITEMS} dari {usageSummary.length} item. Lihat tabel untuk data lengkap.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Summary table with all metrics */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                    <th className="px-4 py-3 text-left font-semibold text-[#475569]">Item Cat</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#475569]">Dikeluarkan</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#475569]">Terpakai</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#475569]">Dibuang</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#475569]">Rasio Buang</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#475569]">Rata-rata/hari</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#475569]">Transaksi</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#475569]">Terakhir Dipakai</th>
                  </tr>
                </thead>
                <tbody>
                  {usageSummary.map((item) => (
                    <tr
                      key={item.paint_item_id}
                      className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-md border border-white shadow-sm shrink-0"
                            style={{ backgroundColor: item.color_hex }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1e344a] truncate">{item.paint_name}</p>
                            <p className="text-xs text-[#94A3B8]">{item.color_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#475569]">
                        {item.total_issued.toFixed(1)} <span className="text-[10px] text-[#94A3B8]">kg</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#1e344a]">
                        {item.total_consumed.toFixed(1)} <span className="text-[10px] font-normal text-[#94A3B8]">kg</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#475569]">
                        {item.total_wasted.toFixed(1)} <span className="text-[10px] text-[#94A3B8]">kg</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <WasteBadge ratio={item.waste_ratio} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#475569]">
                        {item.consumption_rate.toFixed(2)} <span className="text-[10px] text-[#94A3B8]">kg/hari</span>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-[#475569]">
                        {item.transaction_count}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[#64748B]">
                        {item.last_used
                          ? new Date(item.last_used).toISOString().split("T")[0]
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
