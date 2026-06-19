"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStockOut,
  createSideroomIn,
  createDispose,
  createSideroomUse,
  getPendingResidualKg,
} from "@/actions/transactions";
import type { PaintItem } from "@/types/database";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Spinner } from "@/components/shared/spinner";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { useTransactionForm } from "@/hooks/use-transaction-form";
import { ArrowUp, ArrowDown, Trash2, FlaskConical, PaintBucket, AlertTriangle, Scale } from "lucide-react";
import { formatStockSideroom } from "@/lib/format-utils";
import { SideroomConfirmDialog } from "./_components/sideroom-confirm-dialog";
import { StockOutConfirmDialog } from "./_components/stock-out-confirm-dialog";
import { ConditionSelect } from "@/components/shared/condition-select";

interface SideroomPageClientProps {
  paintItems: PaintItem[];
}

// Stock Out is entered in CANS; the other tabs are entered in KG.
const QUICK_CANS = [1, 2, 5, 10, 20];
const QUICK_KG = [0.5, 1, 2, 5];

type ActiveTab = "stockout" | "receive" | "use" | "dispose";

/**
 * Sideroom operator page.
 * Tabs:
 *  - Stock Out (STOCK_OUT): take paint from warehouse → it enters the sideroom
 *    balance immediately. Entered in cans, stored in kg.
 *  - Terima Sisa (SIDEROOM_IN): reconcile returned residual; the un-returned
 *    portion is auto-logged as PAINT_CONSUMED and removed from sideroom stock.
 *  - Pakai (SIDEROOM_USE) / Dispose (DISPOSE): both reduce sideroom stock.
 */
export default function SideroomPageClient({ paintItems }: SideroomPageClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stockout");
  const [condition, setCondition] = useState("murni");
  const [pendingResidual, setPendingResidual] = useState<number | null>(null);
  const [residualLoading, setResidualLoading] = useState(false);
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

  const isStockOut = activeTab === "stockout";
  const isReceive  = activeTab === "receive";
  const isUse      = activeTab === "use";
  const isDispose  = activeTab === "dispose";

  // Stock Out qty is in cans → convert to kg for stock comparisons/preview.
  const weightPerCan = selectedPaintItem?.weight_per_can ?? 0;
  const qtyKg = isStockOut ? qty * weightPerCan : qty;

  // Fetch pending residual when a paint is selected in the "receive" tab
  useEffect(() => {
    if (activeTab !== "receive" || !selectedPaint) {
      setPendingResidual(null);
      return;
    }
    let cancelled = false;
    setResidualLoading(true);
    getPendingResidualKg(selectedPaint).then((val) => {
      if (!cancelled) {
        setPendingResidual(val);
        setResidualLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [activeTab, selectedPaint, recentLogs]); // re-fetch after transactions refresh recentLogs

  const handleQtyChange = (value: number) => {
    if (isStockOut) {
      if (value >= 1) setQty(value);
    } else if (value >= 0.01) {
      setQty(Math.round(value * 100) / 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Stock Out: validate against warehouse stock (compare in kg), then confirm.
    if (activeTab === "stockout") {
      if (weightPerCan <= 0) {
        toast.error("Berat per kaleng belum diatur untuk item ini");
        return;
      }
      validateAndProceed({
        needsConfirm: true,
        compareQty: qtyKg,
        available: currentStock?.stock_warehouse,
        insufficientMessage: `Stok gudang tidak cukup! Tersedia: ${currentStock?.stock_warehouse?.toFixed(2) ?? 0} kg`,
        proceed: executeTransaction,
      });
      return;
    }

    // Terima Sisa: pre-validate against pending residual
    if (activeTab === "receive") {
      if (pendingResidual !== null && pendingResidual <= 0) {
        toast.error("Tidak ada sisa cat dari gudang yang belum dicatat");
        return;
      }
      if (pendingResidual !== null && qty > pendingResidual) {
        toast.error(`Berat sisa melebihi cat keluar gudang. Maksimal: ${pendingResidual.toFixed(2)} kg`);
        return;
      }
    }

    // Both "use" and "dispose" reduce sideroom stock — show confirmation
    validateAndProceed({
      needsConfirm: activeTab === "use" || activeTab === "dispose",
      available: currentStock?.stock_sideroom,
      insufficientMessage: `Stok tidak cukup! Tersedia: ${formatStockSideroom(currentStock?.stock_sideroom ?? 0)}`,
      proceed: executeTransaction,
    });
  };

  const executeTransaction = () => {
    const actionFn = () => {
      if (activeTab === "stockout") {
        return createStockOut({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      } else if (activeTab === "receive") {
        return createSideroomIn({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      } else if (activeTab === "use") {
        return createSideroomUse({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      }
      return createDispose({ paint_item_id: selectedPaint, qty, notes: notes || undefined, condition });
    };

    const kgLabel = `${qty.toFixed(2)} kg`;
    const messages: Record<ActiveTab, string> = {
      stockout: `Stock Out: ${qty} kaleng (${qtyKg.toFixed(2)} kg) ${selectedPaintItem?.name} masuk ke sideroom`,
      receive:  `${kgLabel} ${selectedPaintItem?.name} diterima di sideroom`,
      use:      `${kgLabel} ${selectedPaintItem?.name} berhasil dicatat sebagai terpakai`,
      dispose:  `${kgLabel} ${selectedPaintItem?.name} berhasil dibuang`,
    };

    execute(actionFn, {
      successMessage: messages[activeTab],
      errorMessage: "Operasi gagal",
      onSuccess: () => { if (activeTab === "dispose") setCondition("murni"); },
    });
  };

  // Tab config
  const tabConfig: Record<ActiveTab, {
    label: string;
    activeClass: string;
    inactiveHover: string;
    iconBg: string;
    iconColor: string;
    submitBg: string;
    submitShadow: string;
    submitRing: string;
    accentBar: string;
    icon: React.ReactNode;
    formTitle: string;
    notesPlaceholder: string;
    submitLabel: string;
  }> = {
    stockout: {
      label: "Stock Out",
      activeClass: "bg-[#0e7ad5] text-white shadow-lg shadow-blue-200 focus-visible:ring-blue-500",
      inactiveHover: "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 focus-visible:ring-blue-400",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      submitBg: "bg-[#0e7ad5] hover:bg-[#0065b8]",
      submitShadow: "shadow-blue-200",
      submitRing: "focus-visible:ring-blue-500",
      accentBar: "bg-gradient-to-r from-blue-400 to-blue-500",
      icon: <ArrowUp className="size-5" aria-hidden="true" />,
      formTitle: "Ambil Cat dari Gudang (Stock Out)",
      notesPlaceholder: "Nama pekerjaan, work order...",
      submitLabel: "Catat Stock Out",
    },
    receive: {
      label: "Terima Sisa",
      activeClass: "bg-amber-500 text-white shadow-lg shadow-amber-200 focus-visible:ring-amber-400",
      inactiveHover: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 focus-visible:ring-amber-400",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      submitBg: "bg-amber-500 hover:bg-amber-600",
      submitShadow: "shadow-amber-200",
      submitRing: "focus-visible:ring-amber-400",
      accentBar: "bg-gradient-to-r from-amber-400 to-amber-500",
      icon: <ArrowDown className="size-5" aria-hidden="true" />,
      formTitle: "Terima Sisa Cat dari Painting",
      notesPlaceholder: "Kondisi cat, persentase sisa...",
      submitLabel: "Catat Sisa Cat",
    },
    use: {
      label: "Pakai",
      activeClass: "bg-purple-600 text-white shadow-lg shadow-purple-200 focus-visible:ring-purple-500",
      inactiveHover: "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 focus-visible:ring-purple-400",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      submitBg: "bg-purple-600 hover:bg-purple-700",
      submitShadow: "shadow-purple-200",
      submitRing: "focus-visible:ring-purple-500",
      accentBar: "bg-gradient-to-r from-purple-400 to-purple-500",
      icon: <PaintBucket className="size-5" aria-hidden="true" />,
      formTitle: "Catat Pemakaian Cat Sideroom",
      notesPlaceholder: "Nomor job, nama pekerjaan...",
      submitLabel: "Catat Pemakaian",
    },
    dispose: {
      label: "Buang",
      activeClass: "bg-red-600 text-white shadow-lg shadow-red-200 focus-visible:ring-red-500",
      inactiveHover: "hover:bg-red-50 hover:border-red-200 hover:text-red-700 focus-visible:ring-red-400",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      submitBg: "bg-red-600 hover:bg-red-700",
      submitShadow: "shadow-red-200",
      submitRing: "focus-visible:ring-red-500",
      accentBar: "bg-gradient-to-r from-red-400 to-red-500",
      icon: <Trash2 className="size-5" aria-hidden="true" />,
      formTitle: "Buang Cat Kadaluarsa / Tercampur",
      notesPlaceholder: "Alasan: kadaluarsa, tercampur thinner...",
      submitLabel: "Buang Cat",
    },
  };

  const cfg = tabConfig[activeTab];

  return (
    <div className="space-y-5">

      {/* Tab Selector (4 tabs, 2x2 grid) */}
      <div className="grid grid-cols-2 gap-2">
        {(["stockout", "receive", "use", "dispose"] as ActiveTab[]).map((tab) => {
          const tc = tabConfig[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedPaint(""); setQty(1); setNotes(""); setCondition("murni"); }}
              className={`
                flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-base
                transition-all duration-150 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${isActive
                  ? tc.activeClass
                  : `bg-white text-[#475569] border border-[#E2E8F0] ${tc.inactiveHover}`
                }
              `}
              aria-pressed={isActive}
            >
              <span className={isActive ? "text-white" : ""}>
                {tc.icon}
              </span>
              {tc.label}
            </button>
          );
        })}
      </div>

      {/* Form + Activity grid (side-by-side on tablet landscape) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-5 items-start">

      {/* Form Card */}
      <div className="md:col-span-1 bg-white rounded-2xl border-2 border-[#E2E8F0] shadow-sm overflow-hidden transition-colors duration-200">
        {/* Accent bar */}
        <div className={`h-1.5 ${cfg.accentBar}`} />
        <div className="p-5">
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
            <FlaskConical className={`size-5 ${cfg.iconColor}`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1e344a]">{cfg.formTitle}</h2>
            {isDispose && (
              <p className="text-xs text-red-600 font-medium mt-0.5">
                Tindakan ini tidak dapat dibatalkan
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5" autoComplete="off">

          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                {isStockOut && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
                    Stok di Gudang: {formatStockSideroom(currentStock.stock_warehouse)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                  Stok di Sideroom: {formatStockSideroom(currentStock.stock_sideroom)}
                </span>
                {isStockOut && weightPerCan > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium">
                    <Scale className="size-3.5 text-slate-400" aria-hidden="true" />
                    {weightPerCan} kg / kaleng
                  </span>
                )}
                {/* Pending residual badge - only in receive tab */}
                {isReceive && selectedPaint && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
                    residualLoading
                      ? "bg-slate-50 border border-slate-200 text-slate-500"
                      : (pendingResidual !== null && pendingResidual > 0)
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      residualLoading
                        ? "bg-slate-300"
                        : (pendingResidual !== null && pendingResidual > 0) ? "bg-green-400" : "bg-red-400"
                    }`} aria-hidden="true" />
                    {residualLoading
                      ? "Memuat..."
                      : `Sisa belum dicatat: ${pendingResidual?.toFixed(2) ?? 0} kg`
                    }
                  </span>
                )}
              </div>
            )}
          </PaintSelect>

          {/* Warning when no pending residual to receive */}
          {isReceive && selectedPaint && !residualLoading && pendingResidual !== null && pendingResidual <= 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="size-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-red-800">Tidak ada sisa cat yang belum dicatat</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Semua cat yang keluar dari gudang sudah diterima di sideroom. Catat Stock Out terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <QtyStepper
              label={isStockOut ? "Jumlah (kaleng)" : isReceive ? "Berat Sisa (kg)" : isUse ? "Berat Dipakai (kg)" : "Berat Dibuang (kg)"}
              value={qty}
              onChange={handleQtyChange}
              onQuickSelect={setQty}
              step={isStockOut ? 1 : 0.5}
              min={isStockOut ? 1 : 0.01}
              decimals={isStockOut ? 0 : 2}
              disabled={isLoading}
              quickValues={isStockOut ? QUICK_CANS : QUICK_KG}
              quickSuffix={isStockOut ? "" : " kg"}
              inlineUnit={isStockOut ? undefined : "kg"}
              unitLabel={isStockOut ? "kaleng" : "kg"}
              activeChipClass={cfg.submitBg}
            />
            {isStockOut && selectedPaintItem && (
              <p className="text-xs text-[#64748B] pl-1">
                Setara <strong className="text-[#1e344a]">{qtyKg.toFixed(2)} kg</strong> ({qty} kaleng × {weightPerCan} kg)
              </p>
            )}
          </div>

          {/* Condition Select - only for Dispose */}
          {isDispose && (
            <ConditionSelect
              value={condition}
              onChange={setCondition}
              disabled={isLoading}
            />
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-[#334155]">
              Catatan <span className="font-normal text-[#94A3B8]">(opsional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={cfg.notesPlaceholder}
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full h-14 rounded-xl font-bold text-lg text-white
              flex items-center justify-center gap-2
              transition-all duration-150 cursor-pointer active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-md ${cfg.submitBg} ${cfg.submitShadow} ${cfg.submitRing}
            `}
          >
            {isLoading ? <><Spinner className="size-5" /> Memproses...</> : <>{cfg.icon} {cfg.submitLabel}</>}
          </button>
        </form>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="md:col-span-1">
        <ActivityFeed logs={recentLogs} pageSize={5} />
      </div>

      </div>

      {/* Confirmation Dialogs */}
      <StockOutConfirmDialog
        open={showConfirm && isStockOut}
        onOpenChange={setShowConfirm}
        paintItem={selectedPaintItem}
        currentStock={currentStock}
        qty={qty}
        qtyKg={qtyKg}
        notes={notes}
        isLoading={isLoading}
        onConfirm={executeTransaction}
      />
      <SideroomConfirmDialog
        open={showConfirm && (isUse || isDispose)}
        onOpenChange={setShowConfirm}
        isDispose={isDispose}
        paintItem={selectedPaintItem}
        currentStock={currentStock}
        qty={qty}
        notes={notes}
        isLoading={isLoading}
        onConfirm={executeTransaction}
      />
    </div>
  );
}
