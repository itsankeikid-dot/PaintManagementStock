"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Palette, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Search, X } from "lucide-react";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatQty } from "@/lib/format-utils";
import type { Stock, PaintItem } from "@/types/database";

type StockWithItem = Stock & { paint_items: PaintItem };
type SortField = "name" | "warehouse" | "sideroom" | "total";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />;
  return dir === "asc"
    ? <ArrowUp className="size-3.5 text-blue-600" />
    : <ArrowDown className="size-3.5 text-blue-600" />;
}

interface StockTableProps {
  stockData: StockWithItem[];
}

export function StockTable({ stockData }: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const prevStockRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const prev = prevStockRef.current;
    const next = new Map<string, number>();
    const ids = new Set<string>();

    stockData.forEach((item) => {
      const total = item.stock_warehouse + item.stock_sideroom;
      next.set(item.id, total);
      const prevTotal = prev.get(item.id);
      if (prevTotal !== undefined && prevTotal !== total) {
        ids.add(item.id);
      }
    });

    prevStockRef.current = next;
    if (ids.size > 0) {
      setChangedIds(ids);
      const t = setTimeout(() => setChangedIds(new Set()), 800);
      return () => clearTimeout(t);
    }
  }, [stockData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = stockData
    .filter((s) =>
      s.paint_items?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.paint_items?.color_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * (a.paint_items?.name || "").localeCompare(b.paint_items?.name || "");
        case "warehouse":
          return dir * (a.stock_warehouse - b.stock_warehouse);
        case "sideroom":
          return dir * (a.stock_sideroom - b.stock_sideroom);
        case "total":
          return dir * ((a.stock_warehouse + a.stock_sideroom) - (b.stock_warehouse + b.stock_sideroom));
        default:
          return 0;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-900">Stok Keseluruhan</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
            <Input
              placeholder="Cari cat..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="h-10 pl-9 pr-9 bg-slate-50"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(""); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50">
              <TableHead>
                <button
                  className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("name")}
                >
                  Item Cat <SortIcon active={sortField === "name"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Kode Warna</TableHead>
              <TableHead className="text-right">
                <button
                  className="ml-auto flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("warehouse")}
                >
                  Warehouse (kg) <SortIcon active={sortField === "warehouse"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="ml-auto flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("sideroom")}
                >
                  Sideroom (kg) <SortIcon active={sortField === "sideroom"} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="ml-auto flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("total")}
                >
                  Total <SortIcon active={sortField === "total"} dir={sortDir} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Palette className="size-6 text-slate-300" />
                    <p className="text-sm text-slate-400">
                      {searchTerm ? `Tidak ada item yang cocok dengan "${searchTerm}"` : "Belum ada data stok"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((item) => {
                const total = item.stock_warehouse + item.stock_sideroom;
                const isLow = total <= DEFAULT_LOW_STOCK_THRESHOLD;
                const isChanged = changedIds.has(item.id);
                return (
                  <TableRow key={item.id} className={`${isLow ? "bg-rose-50/80" : ""} ${isChanged ? "animate-flash" : ""} transition-colors duration-100`}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg border-2 border-white shadow-sm shrink-0"
                          style={{ backgroundColor: item.paint_items?.color_hex }}
                        />
                        <span className="font-medium text-slate-900">{item.paint_items?.name}</span>
                        {isLow && <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-slate-600">{item.paint_items?.color_code}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${item.stock_warehouse === 0 ? "text-rose-600" : "text-slate-700"}`}>
                        {formatQty(item.stock_warehouse)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${item.stock_sideroom === 0 ? "text-rose-600" : "text-slate-700"}`}>
                        {formatQty(item.stock_sideroom)}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${isLow ? "text-rose-700" : "text-slate-900"}`}>
                      {formatQty(total)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
            <span className="text-xs text-slate-400">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
              >
                &lsaquo;
              </button>
              <span className="text-xs text-slate-500 px-2">{safePage}/{totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
              >
                &rsaquo;
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
