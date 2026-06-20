"use client";

import { useState, useEffect, useCallback } from "react";
import { getDashboardStats, getLowStockItems } from "@/actions/dashboard";
import { getStockLevels } from "@/actions/stock";
import { getLogEntries } from "@/actions/transactions";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import type { DashboardStats, RealtimeStatus, Stock, PaintItem, Log, User } from "@/types/database";

type StockWithItem = Stock & { paint_items: PaintItem };
type LogWithRelations = Log & { paint_items: PaintItem; users: User };

/**
 * Loads dashboard stats, stock levels, low-stock items, and recent logs.
 * Subscribes to Supabase Realtime so stock/log changes refetch automatically.
 */
export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalWarehouseStock: 0,
    totalSideroomStock: 0,
    todayTransactions: 0,
  });
  const [stockData, setStockData] = useState<StockWithItem[]>([]);
  const [lowStock, setLowStock] = useState<StockWithItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [statsResult, stockResult, lowStockResult, logsResult] =
        await Promise.all([
          getDashboardStats(),
          getStockLevels(),
          getLowStockItems(DEFAULT_LOW_STOCK_THRESHOLD),
          getLogEntries({ limit: 100 }),
        ]);

      setStats(statsResult);
      setStockData(stockResult);
      setLowStock(lowStockResult);
      setRecentLogs(logsResult);
      setLastUpdated(new Date());
      setRefreshTick((t) => t + 1);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Supabase Realtime subscription
  useRealtimeSubscription({
    channelName: "dashboard-realtime",
    tables: [
      { event: "*", table: "stock" },
      { event: "INSERT", table: "log" },
    ],
    onChange: fetchData,
    onStatusChange: setRealtimeStatus,
  });

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  return {
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
  };
}
