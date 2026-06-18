"use client";

import { useState, useEffect, useCallback } from "react";
import { getDailyUsage } from "@/actions/dashboard";
import { dateRangeWIB } from "@/lib/date-utils";
import type { DailyUsage } from "@/types/database";

export type DateRangePreset = "7d" | "14d" | "30d" | "custom";

const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
  "7d": 6,
  "14d": 13,
  "30d": 29,
};

/**
 * Manages the daily-usage chart's date range (preset or custom) and refetches
 * usage data whenever the range changes. Exposes `getActiveDateRange` so the
 * export actions can reuse the exact same resolved range.
 */
export function useDailyUsage() {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [dateRange, setDateRange] = useState<DateRangePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const getActiveDateRange = useCallback((): { from: string; to: string } | null => {
    if (dateRange === "custom") {
      if (!customFrom || !customTo) return null;
      return { from: customFrom, to: customTo };
    }
    return dateRangeWIB(PRESET_DAYS[dateRange]);
  }, [dateRange, customFrom, customTo]);

  useEffect(() => {
    const range = getActiveDateRange();
    if (!range) return;
    const fetchUsage = async () => {
      const usage = await getDailyUsage(range.from, range.to);
      setDailyUsage(usage);
    };
    fetchUsage();
  }, [getActiveDateRange]);

  return {
    dailyUsage,
    dateRange,
    setDateRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    getActiveDateRange,
  };
}
