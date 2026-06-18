"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardStats, getLowStockItems } from "@/actions/dashboard";
import { getStockLevels } from "@/actions/stock";
import { getLogEntries } from "@/actions/transactions";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { Stock, PaintItem, Log, User } from "@/types/database";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

interface DashboardStats {
  totalItems: number;
  totalWarehouseStock: number;
  totalSideroomStock: number;
  todayTransactions: number;
}

type StockWithItem = Stock & { paint_items: PaintItem };
type LogWithRelations = Log & { paint_items: PaintItem; users: User };

/**
 * Loads dashboard stats, stock levels, low-stock items, and recent logs.
 * Subscribes to Supabase Realtime so stock/log changes refetch automatically,
 * debounced to avoid hammering the server when several DB events fire at once.
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

  // Debounce ref — avoid hammering server when multiple DB events fire at once
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Debounced version — waits 300ms after last event before re-fetching
  const debouncedFetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      fetchData();
    }, 300);
  }, [fetchData]);

  // Initial data load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-realtime")
      // Listen to stock table changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock" },
        () => { debouncedFetch(); }
      )
      // Listen to log table changes (new transactions)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log" },
        () => { debouncedFetch(); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setRealtimeStatus("disconnected");
        else setRealtimeStatus("connecting");
      });

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedFetch]);

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
    refresh,
  };
}
