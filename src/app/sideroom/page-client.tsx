"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
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
import { ArrowDown, Trash2, FlaskConical, PaintBucket, AlertTriangle } from "lucide-react";
import { formatStockSideroom } from "@/lib/format-utils";
import { SideroomConfirmDialog } from "./_components/sideroom-confirm-dialog";
import { ConditionSelect } from "@/components/shared/condition-select";

interface SideroomPageClientProps {
  paintItems: PaintItem[];
}

const QUICK_QUANTITIES = [0.5, 1, 2, 5];

type ActiveTab = "receive" | "use" | "dispose";

/**
 * Sideroom operator page.
 * Tabs: Terima Sisa (SIDEROOM_IN), Pakai (SIDEROOM_USE), Dispose (DISPOSE).
 * Use and Dispose both reduce sideroom stock — difference is intent.
 */
export default function SideroomPageClient({ paintItems }: SideroomPageClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("receive");
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
    if (value >= 0.01) setQty(Math.round(value * 100) / 100);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Pre-validate SIDEROOM_IN against pending residual
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
      if (activeTab === "receive") {
        return createSideroomIn({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      } else if (activeTab === "use") {
        return createSideroomUse({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      }
      return createDispose({ paint_item_id: selectedPaint, qty, notes: notes || undefined, condition });
    };

    const qtyLabel = `${qty.toFixed(2)} kg`;
    const messages: Record<ActiveTab, string> = {
      receive: `${qtyLabel} ${selectedPaintItem?.name} diterima di sideroom`,
      use:     `${qtyLabel} ${selectedPaintItem?.name} berhasil dicatat sebagai terpakai`,
      dispose: `${qtyLabel} ${selectedPaintItem?.name} berhasil di-dispose`,
    };

    execute(actionFn, {
      successMessage: messages[activeTab],
      errorMessage: "Operasi gagal",
      onSuccess: () => { if (activeTab === "dispose") setCondition("murni"); },
    });
  };

  const isReceive = activeTab === "receive";
  const isUse     = activeTab === "use";
  const isDispose = activeTab === "dispose";

  // Tab config
  const tabConfig: Record<ActiveTab, {
    label: string;
    activeClass: string;
    inactiveHover: string;
    borderClass: string;
    iconBg: string;
    iconColor: string;
    submitBg: string;
    submitShadow: string;
    submitRing: string;
    icon: React.ReactNode;
    formTitle: string;
    notesPlaceholder: string;
    submitLabel: string;
  }> = {
    receive: {
      label: "Terima Sisa",
      activeClass: "bg-amber-500 text-white shadow-lg shadow-amber-200 focus-visible:ring-amber-400",
      inactiveHover: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 focus-visible:ring-amber-400",
      borderClass: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      submitBg: "bg-amber-500 hover:bg-amber-600",
      submitShadow: "shadow-amber-200",
      submitRing: "focus-visible:ring-amber-400",
      icon: <ArrowDown className="size-5" aria-hidden="true" />,
      formTitle: "Terima Sisa Cat dari Painting",
      notesPlaceholder: "Kondisi cat, persentase sisa...",
      submitLabel: "Catat Sisa Cat",
    },
    use: {
      label: "Pakai",
      activeClass: "bg-purple-600 text-white shadow-lg shadow-purple-200 focus-visible:ring-purple-500",
      inactiveHover: "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 focus-visible:ring-purple-400",
      borderClass: "border-purple-200",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      submitBg: "bg-purple-600 hover:bg-purple-700",
      submitShadow: "shadow-purple-200",
      submitRing: "focus-visible:ring-purple-500",
      icon: <PaintBucket className="size-5" aria-hidden="true" />,
      formTitle: "Catat Pemakaian Cat Sideroom",
      notesPlaceholder: "Nomor job, nama pekerjaan...",
      submitLabel: "Catat Pemakaian",
    },
    dispose: {
      label: "Dispose",
      activeClass: "bg-red-600 text-white shadow-lg shadow-red-200 focus-visible:ring-red-500",
      inactiveHover: "hover:bg-red-50 hover:border-red-200 hover:text-red-700 focus-visible:ring-red-400",
      borderClass: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      submitBg: "bg-red-600 hover:bg-red-700",
      submitShadow: "shadow-red-200",
      submitRing: "focus-visible:ring-red-500",
      icon: <Trash2 className="size-5" aria-hidden="true" />,
      formTitle: "Dispose Cat Kadaluarsa / Tercampur",
      notesPlaceholder: "Alasan: kadaluarsa, tercampur thinner...",
      submitLabel: "Dispose Cat",
    },
  };

  const cfg = tabConfig[activeTab];

  return (
    <div className="space-y-5">

      {/* ── Tab Selector (3 tabs) ── */}
      <div className="grid grid-cols-3 gap-2">
        {(["receive", "use", "dispose"] as ActiveTab[]).map((tab) => {
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
              {/* Icon color: white when active, colored when inactive */}
              <span className={isActive ? "text-white" : ""}>
                {tc.icon}
              </span>
              {tc.label}
            </button>
          );
        })}
      </div>

      {/* ── Form Card ── */}
      <div className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-colors duration-200 ${cfg.borderClass}`}>
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F1F5F9]">
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

        <form onSubmit={handleFormSubmit} className="space-y-5">

          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
                  Gudang: {formatStockSideroom(currentStock.stock_warehouse)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                  Sideroom: {formatStockSideroom(currentStock.stock_sideroom)}
                </span>
                {/* Pending residual badge — only in receive tab */}
                {activeTab === "receive" && selectedPaint && (
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
          {activeTab === "receive" && selectedPaint && !residualLoading && pendingResidual !== null && pendingResidual <= 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="size-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-red-800">Tidak ada sisa cat yang belum dicatat</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Semua cat yang keluar dari gudang sudah diterima di sideroom. Pastikan warehouse sudah mencatat Stock Out terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          <QtyStepper
            label={isReceive ? "Berat Sisa (kg)" : isUse ? "Berat Dipakai (kg)" : "Berat Dispose (kg)"}
            value={qty}
            onChange={handleQtyChange}
            onQuickSelect={setQty}
            step={0.5}
            min={0.01}
            decimals={2}
            disabled={isLoading}
            quickValues={QUICK_QUANTITIES}
            quickSuffix=" kg"
            inlineUnit="kg"
            unitLabel="kg"
            activeChipClass={cfg.submitBg}
          />

          {/* Condition Select — only for Dispose */}
          {activeTab === "dispose" && (
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

      {/* ── Recent Activity ── */}
      <ActivityFeed logs={recentLogs} pageSize={5} />

      {/* ── Confirmation Dialog (Use & Dispose) ── */}
      <SideroomConfirmDialog
        open={showConfirm}
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
