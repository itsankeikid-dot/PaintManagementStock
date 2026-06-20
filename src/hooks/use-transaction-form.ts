import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getLogEntries } from "@/actions/transactions";
import { getStockLevels } from "@/actions/stock";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import type { PaintItem, Stock, Log, User } from "@/types/database";

type ActionResult = { success: boolean; error?: string };

interface UseTransactionFormOptions {
  /** Qty the form resets to after a successful transaction (1 for warehouse, etc.). */
  initialQty?: number;
  /** Active paint items to search for selectedPaintItem lookup. */
  paintItems: PaintItem[];
}

/**
 * Shared state + flow for the warehouse/sideroom transaction forms:
 * paint selection, qty, notes, confirm dialog, loading, and the recent
 * stock/activity feed. Also exposes computed selectedPaintItem/currentStock.
 * UI (units, tabs, extra fields) stays in the page; this owns the
 * duplicated fetch + execute-with-toast scaffolding.
 */
export function useTransactionForm({ initialQty = 1, paintItems }: UseTransactionFormOptions) {
  const [selectedPaint, setSelectedPaint] = useState("");
  const [qty, setQty] = useState(initialQty);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stockLevels, setStockLevels] = useState<(Stock & { paint_items: PaintItem })[]>([]);
  const [recentLogs, setRecentLogs] = useState<(Log & { paint_items: PaintItem; users: User })[]>([]);

  const fetchActivity = useCallback(async () => {
    const [logs, stocks] = await Promise.all([
      getLogEntries({ limit: 50 }),
      getStockLevels(),
    ]);
    setRecentLogs(logs);
    setStockLevels(stocks);
  }, []);

  // Initial data load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivity();
  }, [fetchActivity]);

  // Supabase Realtime subscription
  useRealtimeSubscription({
    channelName: "operator-realtime",
    tables: [
      { event: "*", table: "stock" },
      { event: "INSERT", table: "log" },
    ],
    onChange: fetchActivity,
  });

  // Computed derived values
  const selectedPaintItem = paintItems.find((p) => p.id === selectedPaint);
  const currentStock = stockLevels.find((s) => s.paint_item_id === selectedPaint);

  const reset = useCallback(() => {
    setSelectedPaint("");
    setQty(initialQty);
    setNotes("");
  }, [initialQty]);

  /**
   * Shared form-submit guard for both operator pages. Validates that a paint
   * is selected and qty is positive, then:
   * - if `needsConfirm`, checks `available` stock and opens the confirm dialog;
   * - otherwise runs `proceed` immediately.
   */
  const validateAndProceed = useCallback(
    (opts: {
      needsConfirm: boolean;
      proceed: () => void;
      available?: number;
      compareQty?: number;
      insufficientMessage?: string;
      /** When true, qty = 0 is accepted (e.g. RESIDUAL_RETURN meaning all consumed). */
      allowZero?: boolean;
    }) => {
      if (!selectedPaint) {
        toast.error("Pilih item cat terlebih dahulu");
        return;
      }
      if (opts.allowZero ? qty < 0 : qty <= 0) {
        toast.error("Masukkan jumlah yang valid");
        return;
      }
      const checkQty = opts.compareQty ?? qty;
      if (opts.needsConfirm) {
        if (opts.available !== undefined && checkQty > opts.available) {
          toast.error(opts.insufficientMessage ?? "Stok tidak cukup!");
          return;
        }
        setShowConfirm(true);
        return;
      }
      opts.proceed();
    },
    [selectedPaint, qty]
  );

  /**
   * Runs `actionFn`, handles loading/toast/refresh. On success: shows
   * `successMessage`, resets common fields, runs `onSuccess` (extra resets),
   * and refreshes the activity feed.
   */
  const execute = useCallback(
    async (
      actionFn: () => Promise<ActionResult>,
      opts: { successMessage: string; errorMessage?: string; onSuccess?: () => void }
    ) => {
      setShowConfirm(false);
      setIsLoading(true);
      try {
        const result = await actionFn();
        if (result.success) {
          toast.success(opts.successMessage, { duration: 5000 });
          reset();
          opts.onSuccess?.();
          await fetchActivity();
        } else {
          toast.error(result.error || opts.errorMessage || "Transaksi gagal");
        }
      } catch {
        toast.error("Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    },
    [reset, fetchActivity]
  );

  return {
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
    fetchActivity,
    reset,
    execute,
    validateAndProceed,
    selectedPaintItem,
    currentStock,
  };
}
