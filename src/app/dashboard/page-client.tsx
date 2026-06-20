"use client";

import { Download } from "lucide-react";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDailyUsage } from "@/hooks/use-daily-usage";
import { useDashboardExport } from "@/hooks/use-dashboard-export";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { MonitoringCards } from "./_components/monitoring-cards";
import { AdminQuickAccess } from "./_components/admin-quick-access";
import { DailyUsageChart } from "./_components/daily-usage-chart";
import { LowStockTable } from "./_components/low-stock-table";
import { StockTable } from "./_components/stock-table";
import type { UserRole } from "@/types/database";

/**
 * Admin dashboard client component.
 * Shows stock overview, daily usage bar chart, low stock alerts, and transaction feed.
 * Uses Supabase Realtime to auto-update stock and logs without manual refresh.
 */
export default function DashboardPageClient({ role }: { role: UserRole }) {
  const {
    stats,
    stockData,
    lowStock,
    recentLogs,
    isLoading,
    isRefreshing,
    lastUpdated,
    realtimeStatus,
    refreshTick,
    refresh,
  } = useDashboardData();

  const {
    dailyUsage,
    dateRange,
    setDateRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    getActiveDateRange,
  } = useDailyUsage(refreshTick);

  const {
    isExportingUsage,
    isExportingTx,
    handleExportDailyUsage,
    handleExportTransactions,
  } = useDashboardExport(getActiveDateRange);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <MonitoringCards
        stats={stats}
        realtimeStatus={realtimeStatus}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />

      {role === "admin" && <AdminQuickAccess />}

      <DailyUsageChart
        dailyUsage={dailyUsage}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        isExporting={isExportingUsage}
        onExport={handleExportDailyUsage}
      />

      <LowStockTable lowStock={lowStock} />

      <section className="space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
          Detail Stok & Transaksi
        </h3>
        <div className="grid gap-5 xl:grid-cols-2">
          <StockTable stockData={stockData} />

          <ActivityFeed
            logs={recentLogs}
            pageSize={10}
            title="Riwayat Transaksi"
            searchable
            showTypeFilter
            filterTypes={["STOCK_IN", "STOCK_OUT", "RESIDUAL_RETURN", "DISPOSE", "PAINT_CONSUMED", "SIDEROOM_RECEIVE"]}
            headerAction={
              <button
                onClick={handleExportTransactions}
                disabled={recentLogs.length === 0 || isExportingTx}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className={`size-3.5 ${isExportingTx ? "animate-pulse" : ""}`} aria-hidden="true" />
                {isExportingTx ? "Exporting..." : "Export"}
              </button>
            }
          />
        </div>
      </section>
    </div>
  );
}
