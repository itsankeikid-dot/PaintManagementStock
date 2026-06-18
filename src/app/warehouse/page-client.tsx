"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStockIn, createStockOut } from "@/actions/transactions";
import type { PaintItem } from "@/types/database";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Spinner } from "@/components/shared/spinner";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { useTransactionForm } from "@/hooks/use-transaction-form";
import { ArrowDown, ArrowUp, PackageCheck } from "lucide-react";
import { StockOutConfirmDialog } from "./_components/stock-out-confirm-dialog";

interface WarehouseFormProps {
  paintItems: PaintItem[];
}

const QUICK_QUANTITIES = [1, 2, 5, 10, 20];

/**
 * Warehouse operator page.
 * Contains Stock-In and Stock-Out forms, quantity stepper, confirmation dialogs,
 * current stock display, and recent activity feed.
 */
export default function WarehousePage({ paintItems }: WarehouseFormProps) {
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const {
    selectedPaint,
    setSelectedPaint,
    qty,
    setQty,
    notes,
    setNotes,
    isLoading,
    showConfirm,
    setShowConfirm,
    stockLevels,
    recentLogs,
    execute,
    validateAndProceed,
  } = useTransactionForm({ initialQty: 1 });

  const selectedPaintItem = paintItems.find((p) => p.id === selectedPaint);
  const currentStock = stockLevels.find((s) => s.paint_item_id === selectedPaint);

  // qty is entered in cans; stock is tracked in kg.
  const weightPerCan = selectedPaintItem?.weight_per_can ?? 0;
  const qtyKg = qty * weightPerCan;

  const handleQtyChange = (value: number) => {
    if (value >= 1) setQty(value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndProceed({
      needsConfirm: activeTab === "out",
      // Compare in kg: requested cans -> kg vs available warehouse kg.
      compareQty: qtyKg,
      available: currentStock?.stock_warehouse,
      insufficientMessage: `Stok tidak cukup! Tersedia: ${currentStock?.stock_warehouse ?? 0} kg`,
      proceed: executeTransaction,
    });
  };

  const executeTransaction = () => {
    execute(
      () =>
        activeTab === "in"
          ? createStockIn({ paint_item_id: selectedPaint, qty, notes: notes || undefined })
          : createStockOut({ paint_item_id: selectedPaint, qty, notes: notes || undefined }),
      {
        successMessage: `${activeTab === "in" ? "Stock In" : "Stock Out"}: ${qty} kaleng (${qtyKg.toFixed(2)} kg) ${selectedPaintItem?.name} berhasil dicatat`,
      }
    );
  };

  const isIn = activeTab === "in";

  return (
    <div className="space-y-5">

      {/* ── Tab Selector ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab("in")}
          className={`flex items-center justify-center gap-2.5 h-16 rounded-2xl font-bold text-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isIn
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 focus-visible:ring-emerald-500"
              : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 focus-visible:ring-emerald-400"
          }`}
          aria-pressed={isIn}
        >
          <ArrowDown className={`size-5 ${isIn ? "text-white" : "text-emerald-500"}`} aria-hidden="true" />
          Stock In
        </button>

        <button
          onClick={() => setActiveTab("out")}
          className={`flex items-center justify-center gap-2.5 h-16 rounded-2xl font-bold text-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            !isIn
              ? "bg-[#0e7ad5] text-white shadow-lg shadow-blue-200 focus-visible:ring-blue-500"
              : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 focus-visible:ring-blue-400"
          }`}
          aria-pressed={!isIn}
        >
          <ArrowUp className={`size-5 ${!isIn ? "text-white" : "text-blue-500"}`} aria-hidden="true" />
          Stock Out
        </button>
      </div>

      {/* ── Transaction Form ── */}
      <div className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-colors duration-200 ${isIn ? "border-emerald-200" : "border-blue-200"}`}>
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F1F5F9]">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isIn ? "bg-emerald-100" : "bg-blue-100"}`}>
            <PackageCheck className={`size-5 ${isIn ? "text-emerald-600" : "text-blue-600"}`} aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#1e344a]">
            {isIn ? "Terima Cat (Stock In)" : "Kirim Cat (Stock Out)"}
          </h2>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  Gudang: {currentStock.stock_warehouse.toFixed(2)} kg
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                  Sideroom: {currentStock.stock_sideroom.toFixed(2)} kg
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium">
                  {weightPerCan} kg/kaleng
                </span>
              </div>
            )}
          </PaintSelect>

          <div className="space-y-1.5">
            <QtyStepper
              label="Jumlah (kaleng)"
              value={qty}
              onChange={handleQtyChange}
              onQuickSelect={setQty}
              step={1}
              min={1}
              decimals={0}
              disabled={isLoading}
              quickValues={QUICK_QUANTITIES}
              unitLabel="kaleng"
              activeChipClass={isIn ? "bg-emerald-600 focus-visible:ring-emerald-500" : "bg-[#0e7ad5] focus-visible:ring-blue-500"}
            />
            {selectedPaintItem && (
              <p className="text-xs text-[#64748B] pl-1">
                Setara <strong className="text-[#1e344a]">{qtyKg.toFixed(2)} kg</strong> ({qty} kaleng × {weightPerCan} kg)
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-[#334155]">
              Catatan <span className="font-normal text-[#94A3B8]">(opsional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isIn ? "Nama supplier, nomor PO..." : "Nama pekerjaan, work order..."}
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-14 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              isIn
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 focus-visible:ring-emerald-500"
                : "bg-[#0e7ad5] hover:bg-[#0065b8] shadow-md shadow-blue-200 focus-visible:ring-blue-500"
            }`}
          >
            {isLoading ? (
              <><Spinner className="size-5" /> Memproses...</>
            ) : isIn ? (
              <><ArrowDown className="size-5" aria-hidden="true" /> Catat Stock In</>
            ) : (
              <><ArrowUp className="size-5" aria-hidden="true" /> Catat Stock Out</>
            )}
          </button>
        </form>
      </div>

      {/* ── Recent Activity ── */}
      <ActivityFeed logs={recentLogs} pageSize={5} />

      {/* ── Confirmation Dialog for Stock Out ── */}
      <StockOutConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        paintItem={selectedPaintItem}
        currentStock={currentStock}
        qty={qty}
        qtyKg={qtyKg}
        notes={notes}
        isLoading={isLoading}
        onConfirm={executeTransaction}
      />
    </div>
  );
}
