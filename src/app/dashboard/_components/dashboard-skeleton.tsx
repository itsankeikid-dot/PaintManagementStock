import { CardsSkeleton, ChartSkeleton, TableSkeleton } from "@/components/shared/table-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-3">
        <div>
          <div className="h-7 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-72 rounded bg-slate-100 animate-pulse mt-2" />
        </div>
        <CardsSkeleton count={4} />
      </section>
      <section className="space-y-3">
        <div className="h-7 w-32 rounded bg-slate-200 animate-pulse" />
        <ChartSkeleton />
      </section>
      <section className="space-y-3">
        <div className="h-7 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="grid gap-5 xl:grid-cols-2">
          <TableSkeleton columns={5} rows={5} />
          <TableSkeleton columns={3} rows={5} />
        </div>
      </section>
    </div>
  );
}
