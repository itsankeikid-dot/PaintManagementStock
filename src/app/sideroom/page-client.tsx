"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createStockOut,
  createResidualReturn,
  createDispose,
} from "@/actions/transactions";
import type { PaintItem } from "@/types/database";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { useTransactionForm } from "@/hooks/use-transaction-form";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { StockOutForm } from "./_components/stock-out-form";
import { ReceiveForm } from "./_components/receive-form";
import { DisposeForm } from "./_components/dispose-form";
import { SideroomConfirmDialog } from "./_components/sideroom-confirm-dialog";
import { StockOutConfirmDialog } from "./_components/stock-out-confirm-dialog";

interface SideroomPageClientProps {
  paintItems: PaintItem[];
}

type ActiveTab = "stockout" | "receive" | "dispose";

const TAB_CONFIG: Record<ActiveTab, {
  label: string;
  activeClass: string;
  inactiveHover: string;
  icon: React.ReactNode;
}> = {
  stockout: {
    label: "Stock Out",
    activeClass: "bg-[#0e7ad5] text-white shadow-lg shadow-blue-200 focus-visible:ring-blue-500",
    inactiveHover: "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 focus-visible:ring-blue-400",
    icon: <ArrowUp className="size-5" aria-hidden="true" />,
  },
  receive: {
    label: "Catat Sisa Cat",
    activeClass: "bg-amber-500 text-white shadow-lg shadow-amber-200 focus-visible:ring-amber-400",
    inactiveHover: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 focus-visible:ring-amber-400",
    icon: <ArrowDown className="size-5" aria-hidden="true" />,
  },
  dispose: {
    label: "Buang",
    activeClass: "bg-red-600 text-white shadow-lg shadow-red-200 focus-visible:ring-red-500",
    inactiveHover: "hover:bg-red-50 hover:border-red-200 hover:text-red-700 focus-visible:ring-red-400",
    icon: <Trash2 className="size-5" aria-hidden="true" />,
  },
};

/**
 * Sideroom operator page.
 * Tabs:
 *  - Stock Out (STOCK_OUT): take paint from warehouse → it enters the sideroom
 *    balance immediately. Entered in cans, stored in kg.
 *  - Terima Sisa (RESIDUAL_RETURN): reconcile returned residual; the un-returned
 *    portion is auto-logged as PAINT_CONSUMED and removed from sideroom stock.
 *  - Dispose (DISPOSE): reduce sideroom stock (expired/mixed paint).
 */
export default function SideroomPageClient({ paintItems }: SideroomPageClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stockout");
  const [condition, setCondition] = useState("murni");
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
    selectedPaintItem,
    currentStock,
  } = useTransactionForm({ initialQty: 1, paintItems });

  const isStockOut = activeTab === "stockout";
  const isDispose = activeTab === "dispose";

  // Stock Out qty is in cans → convert to kg for stock comparisons/preview.
  const weightPerCan = selectedPaintItem?.weight_per_can ?? 0;
  const qtyKg = isStockOut ? qty * weightPerCan : qty;

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

    // Terima Sisa: qty=0 means all paint consumed, no residual returned
    if (activeTab === "receive") {
      validateAndProceed({
        needsConfirm: false,
        allowZero: true,
        proceed: executeTransaction,
      });
      return;
    }

    // Dispose: validate against sideroom stock, show confirmation
    validateAndProceed({
      needsConfirm: true,
      available: currentStock?.stock_sideroom,
      insufficientMessage: `Stok tidak cukup! Tersedia: ${currentStock?.stock_sideroom?.toFixed(2) ?? 0} kg`,
      proceed: executeTransaction,
    });
  };

  const executeTransaction = () => {
    const actionFn = () => {
      if (activeTab === "stockout") {
        return createStockOut({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      } else if (activeTab === "receive") {
        return createResidualReturn({ paint_item_id: selectedPaint, qty, notes: notes || undefined });
      }
      return createDispose({ paint_item_id: selectedPaint, qty, notes: notes || undefined, condition });
    };

    const kgLabel = `${qty.toFixed(2)} kg`;
    const messages: Record<ActiveTab, string> = {
      stockout: `Stock Out: ${qty} kaleng (${qtyKg.toFixed(2)} kg) ${selectedPaintItem?.name} masuk ke sideroom`,
      receive:  qty === 0
        ? `Semua cat ${selectedPaintItem?.name} habis terpakai (tidak ada sisa)`
        : `${kgLabel} ${selectedPaintItem?.name} diterima di sideroom`,
      dispose:  `${kgLabel} ${selectedPaintItem?.name} berhasil dibuang`,
    };

    execute(actionFn, {
      successMessage: messages[activeTab],
      errorMessage: "Operasi gagal",
      onSuccess: () => { if (activeTab === "dispose") setCondition("murni"); },
    });
  };

  /** Common form props passed to each tab component */
  const tabFormProps = {
    paintItems,
    selectedPaint,
    setSelectedPaint,
    qty,
    setQty,
    notes,
    setNotes,
    isLoading,
    stockLevels,
    selectedPaintItem,
    currentStock,
    onSubmit: handleFormSubmit,
  };

  return (
    <div className="space-y-5">

      {/* Tab Selector (3 tabs) */}
      <div className="grid grid-cols-3 gap-2">
        {(["stockout", "receive", "dispose"] as ActiveTab[]).map((tab) => {
          const tc = TAB_CONFIG[tab];
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
        {activeTab === "stockout" && <StockOutForm {...tabFormProps} />}
        {activeTab === "receive" && <ReceiveForm {...tabFormProps} />}
        {activeTab === "dispose" && <DisposeForm {...tabFormProps} condition={condition} setCondition={setCondition} />}
      </div>

      {/* Recent Activity */}
      <div className="md:col-span-1">
        <ActivityFeed logs={recentLogs} pageSize={5} filterTypes={["STOCK_OUT", "SIDEROOM_RECEIVE", "RESIDUAL_RETURN", "DISPOSE", "PAINT_CONSUMED"]} />
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
        open={showConfirm && isDispose}
        onOpenChange={setShowConfirm}
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
