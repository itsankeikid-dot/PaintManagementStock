"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPaintItemUsageSummary,
  getDailyUsage,
} from "@/actions/dashboard";
import type {
  PaintItemUsageSummary,
  DailyUsage,
} from "@/types/database";

type DateRange = { from: string; to: string } | null;

/**
 * Manages per-paint-item usage analytics:
 * - Fetches aggregated usage summary for the active date range
 * - Tracks the selected paint item for the daily-usage chart filter
 * - Re-fetches filtered daily usage when a paint item is selected
 *
 * Designed to work alongside `useDailyUsage` — pass `getActiveDateRange`
 * from that hook so both stay in sync with the same date range.
 */
export function usePaintItemUsage(
  refreshTick?: number,
  getActiveDateRange?: () => DateRange,
) {
  const [usageSummary, setUsageSummary] = useState<PaintItemUsageSummary[]>([]);
  const [selectedPaintItemId, setSelectedPaintItemId] = useState("");
  const [filteredDailyUsage, setFilteredDailyUsage] = useState<DailyUsage[]>([]);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isFetchingFiltered, setIsFetchingFiltered] = useState(false);

  // Fetch summary whenever the date range or refreshTick changes
  const fetchSummary = useCallback(async () => {
    const range = getActiveDateRange?.();
    if (!range) return;
    setIsFetchingSummary(true);
    try {
      const summary = await getPaintItemUsageSummary(range.from, range.to);
      setUsageSummary(summary);
    } finally {
      setIsFetchingSummary(false);
    }
  }, [getActiveDateRange]);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSummary, refreshTick]);

  // Fetch filtered daily usage when selectedPaintItemId or range changes
  useEffect(() => {
    if (!selectedPaintItemId) {
      setFilteredDailyUsage([]);
      return;
    }
    const range = getActiveDateRange?.();
    if (!range) return;

    setIsFetchingFiltered(true);
    getDailyUsage(range.from, range.to, selectedPaintItemId)
      .then(setFilteredDailyUsage)
      .finally(() => setIsFetchingFiltered(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaintItemId, getActiveDateRange, refreshTick]);

  return {
    usageSummary,
    selectedPaintItemId,
    setSelectedPaintItemId,
    filteredDailyUsage,
    isFetchingSummary,
    isFetchingFiltered,
    refreshSummary: fetchSummary,
  };
}
