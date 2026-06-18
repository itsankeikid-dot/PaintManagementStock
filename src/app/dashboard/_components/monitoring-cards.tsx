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

export function MonitoringCards({
  stats,
  realtimeStatus,
  lastUpdated,
  isRefreshing,
  onRefresh,
}: MonitoringCardsProps) {
  const cards = [
    { label: "Paint Types", value: String(stats.totalItems), icon: Palette },
    { label: "Warehouse Stock", value: `${stats.totalWarehouseStock.toFixed(1)} kg`, icon: Warehouse },
    { label: "Sideroom Stock", value: `${stats.totalSideroomStock.toFixed(1)} kg`, icon: FlaskConical },
    { label: "Today Activity", value: String(stats.todayTransactions), icon: Activity },
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
              <><WifiOff className="size-3" />Disconnected</>
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
                  <div>
                    <p className="text-base font-medium text-slate-900">{card.label}</p>
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
