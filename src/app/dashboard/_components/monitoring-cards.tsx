"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Warehouse,
  FlaskConical,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Info,
} from "lucide-react";
import type { RealtimeStatus } from "@/hooks/use-dashboard-data";

interface DashboardStats {
  totalItems: number;
  totalWarehouseStock: number;
  totalSideroomStock: number;
  todayTransactions: number;
}

interface MonitoringCardsProps {
  stats: DashboardStats;
  realtimeStatus: RealtimeStatus;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function InfoTooltip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        aria-label={`Info ${label}`}
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs text-slate-600 shadow-lg shadow-slate-200/50 z-50 animate-in fade-in-0 zoom-in-95"
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {text}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
            <div className="w-2 h-2 rotate-45 border-l border-t border-[#E2E8F0] bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export function MonitoringCards({
  stats,
  realtimeStatus,
  lastUpdated,
  isRefreshing,
  onRefresh,
}: MonitoringCardsProps) {
  const cards = [
    { label: "Paint Types", value: String(stats.totalItems), icon: Palette, tooltip: "Jumlah jenis cat yang terdaftar di sistem (aktif dan nonaktif)." },
    { label: "Warehouse Stock", value: `${stats.totalWarehouseStock.toFixed(1)} kg`, icon: Warehouse, tooltip: "Total stok cat di gudang utama. Stok masuk dicatat oleh operator warehouse." },
    { label: "Sideroom Stock", value: `${stats.totalSideroomStock.toFixed(1)} kg`, icon: FlaskConical, tooltip: "Total stok cat di ruang cat (sideroom). Stok diambil dari gudang oleh operator sideroom." },
    { label: "Today Activity", value: String(stats.todayTransactions), icon: Activity, tooltip: "Jumlah transaksi yang tercatat hari ini (stock in, stock out, pemakaian, pembuangan)." },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Monitoring Zone
          </h2>
          <p className="text-sm text-slate-500">
            Snapshot of stock, daily usage, and transaction activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ${
              realtimeStatus === "connected"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : realtimeStatus === "connecting"
                  ? "bg-amber-50 text-amber-700 ring-amber-200"
                  : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {realtimeStatus === "connected" ? (
              <><Wifi className="size-3" /><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>Live</>
            ) : realtimeStatus === "connecting" ? (
              <><RefreshCw className="size-3 animate-spin" />Connecting...</>
            ) : (
              <>
                <WifiOff className="size-3" />
                Disconnected
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="ml-1 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 cursor-pointer disabled:opacity-50"
                >
                  Reconnect
                </button>
              </>
            )}
          </span>

          {lastUpdated && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-white shadow-sm"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="relative overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-medium text-slate-900">{card.label}</p>
                      <InfoTooltip text={card.tooltip} label={card.label} />
                    </div>
                    <p className="mt-1 text-4xl font-semibold tracking-tight text-blue-600">
                      {card.value}
                    </p>
                  </div>
                  <div className="rounded-full p-2 bg-slate-100 text-slate-500">
                    <Icon className="size-5 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
