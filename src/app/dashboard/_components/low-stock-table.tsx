"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatStockSideroom } from "@/lib/format-utils";
import type { Stock, PaintItem } from "@/types/database";

type StockWithItem = Stock & { paint_items: PaintItem };

interface LowStockTableProps {
  lowStock: StockWithItem[];
}

export function LowStockTable({ lowStock }: LowStockTableProps) {
  const [showAll, setShowAll] = useState(false);

  if (lowStock.length === 0) return null;

  const visible = showAll ? lowStock : lowStock.slice(0, 5);

  return (
    <section className="space-y-3">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
        Stok Rendah
      </h3>
      <Card className="overflow-hidden border-rose-200 bg-white shadow-sm">
        <CardHeader className="border-b border-rose-100 pb-4 bg-rose-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-rose-900">
                  {lowStock.length} item di bawah batas minimum
                </CardTitle>
                <p className="text-xs text-rose-600 mt-0.5">
                  Threshold: &le; {DEFAULT_LOW_STOCK_THRESHOLD} kg total
                </p>
              </div>
            </div>
            {lowStock.length > 5 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 transition-all duration-150 cursor-pointer"
              >
                {showAll ? "Tampilkan lebih sedikit" : `Tampilkan semua (${lowStock.length})`}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-rose-50/40 border-b border-rose-100">
                {["Item Cat", "Warehouse", "Sideroom", "Total"].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-2.5 text-xs font-semibold text-rose-700 uppercase tracking-wide whitespace-nowrap ${h !== "Item Cat" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {visible.map((item) => {
                const total = item.stock_warehouse + item.stock_sideroom;
                return (
                  <tr key={item.id} className="hover:bg-rose-50/40 transition-colors duration-100">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg border-2 border-white shadow-sm shrink-0"
                          style={{ backgroundColor: item.paint_items?.color_hex }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 text-sm truncate block">
                            {item.paint_items?.name}
                          </span>
                          <span className="text-xs text-slate-500">{item.paint_items?.color_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${item.stock_warehouse === 0 ? "text-rose-600" : "text-slate-700"}`}>
                        {formatStockSideroom(item.stock_warehouse)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${item.stock_sideroom === 0 ? "text-rose-600" : "text-slate-700"}`}>
                        {formatStockSideroom(item.stock_sideroom)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-sm font-bold tabular-nums ${total === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                        {total === 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />}
                        {formatStockSideroom(total)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
