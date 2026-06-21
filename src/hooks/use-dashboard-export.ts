"use client";

import { useState } from "react";
import { getLogsForExport } from "@/actions/transactions";
import { getPaintItemUsageSummary } from "@/actions/dashboard";
import { LOG_TYPE_LABELS } from "@/lib/constants";
import { formatDateTimeReadableWIB } from "@/lib/date-utils";
import { formatQty } from "@/lib/format-utils";
import { downloadCSV } from "@/lib/csv-utils";

type DateRange = { from: string; to: string };

const CSV_HEADERS = [
  "Waktu", "Nama Cat", "Kode Warna", "Tipe", "Qty", "User", "Catatan", "Kondisi",
];

const formatRangeLabel = (from: string, to: string) => {
  const fmt = (ymd: string) => {
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  };
  return `${fmt(from)} - ${fmt(to)}`;
};

const buildTypeSummary = (logs: { type: string; qty: number }[], colCount: number) => {
  const byType: Record<string, number> = {};
  let total = 0;
  for (const l of logs) {
    byType[l.type] = (byType[l.type] ?? 0) + l.qty;
    total += l.qty;
  }
  const pad = (label: string, qty: string) => {
    const row = Array(colCount).fill("");
    row[0] = label;
    row[4] = qty;
    return row;
  };
  const rows: string[][] = [];
  for (const [type, qty] of Object.entries(byType)) {
    rows.push(pad(`Subtotal ${LOG_TYPE_LABELS[type] ?? type}`, String(qty)));
  }
  rows.push(pad("TOTAL", String(total)));
  return rows;
};

const toCsvRow = (l: Awaited<ReturnType<typeof getLogsForExport>>[number]) => [
  formatDateTimeReadableWIB(l.created_at),
  l.paint_items?.name ?? "",
  l.paint_items?.color_code ?? "",
  LOG_TYPE_LABELS[l.type] ?? l.type,
  formatQty(l.qty),
  l.users?.name ?? "",
  l.notes ?? "",
  l.condition ?? "",
];

/**
 * CSV export actions for the dashboard. `getActiveDateRange` comes from
 * useDailyUsage so exports always match the chart's current range.
 */
export function useDashboardExport(getActiveDateRange: () => DateRange | null) {
  const [isExportingUsage, setIsExportingUsage] = useState(false);
  const [isExportingTx, setIsExportingTx] = useState(false);
  const [isExportingPaintItem, setIsExportingPaintItem] = useState(false);

  const handleExportDailyUsage = async () => {
    const range = getActiveDateRange();
    if (!range) return;
    setIsExportingUsage(true);
    try {
      const logs = await getLogsForExport(range.from, range.to);
      const filtered = logs.filter((l) => ["STOCK_OUT", "DISPOSE", "PAINT_CONSUMED"].includes(l.type));
      downloadCSV(
        `penggunaan-cat-${range.from}_${range.to}.csv`,
        CSV_HEADERS,
        filtered.map(toCsvRow),
        {
          title: "Laporan Penggunaan Cat",
          info: [
            `Periode: ${formatRangeLabel(range.from, range.to)}`,
            `Total transaksi: ${filtered.length}`,
            `Tipe: Dikeluarkan (Stock Out), Terpakai Proses (Consumed), Dibuang (Dispose)`,
          ],
          summary: buildTypeSummary(filtered, 8),
          numericColumns: [4],
        }
      );
    } finally {
      setIsExportingUsage(false);
    }
  };

  const handleExportTransactions = async () => {
    const range = getActiveDateRange();
    if (!range) return;
    setIsExportingTx(true);
    try {
      const logs = await getLogsForExport(range.from, range.to);
      downloadCSV(
        `transaksi-${range.from}_${range.to}.csv`,
        CSV_HEADERS,
        logs.map(toCsvRow),
        {
          title: "Laporan Semua Transaksi",
          info: [
            `Periode: ${formatRangeLabel(range.from, range.to)}`,
            `Total transaksi: ${logs.length}`,
          ],
          summary: buildTypeSummary(logs, 8),
          numericColumns: [4],
        }
      );
    } finally {
      setIsExportingTx(false);
    }
  };

  const handleExportPaintItemUsage = async () => {
    const range = getActiveDateRange();
    if (!range) return;
    setIsExportingPaintItem(true);
    try {
      const summary = await getPaintItemUsageSummary(range.from, range.to);
      const headers = [
        "Nama Cat", "Kode Warna", "Dikeluarkan (kg)", "Terpakai (kg)",
        "Dibuang (kg)", "Rasio Buang (%)", "Rata-rata/hari (kg)", "Transaksi", "Terakhir Dipakai",
      ];
      const rows = summary.map((s) => [
        s.paint_name,
        s.color_code,
        s.total_issued.toFixed(2),
        s.total_consumed.toFixed(2),
        s.total_wasted.toFixed(2),
        s.waste_ratio.toFixed(1),
        s.consumption_rate.toFixed(2),
        String(s.transaction_count),
        s.last_used ? s.last_used.split("T")[0] : "-",
      ]);

      // Summary rows
      const totalIssued = summary.reduce((s, r) => s + r.total_issued, 0);
      const totalConsumed = summary.reduce((s, r) => s + r.total_consumed, 0);
      const totalWasted = summary.reduce((s, r) => s + r.total_wasted, 0);
      const totalTx = summary.reduce((s, r) => s + r.transaction_count, 0);
      const summaryRows = [
        ["TOTAL", "", totalIssued.toFixed(2), totalConsumed.toFixed(2), totalWasted.toFixed(2), "", "", String(totalTx), ""],
      ];

      downloadCSV(
        `analisis-per-item-${range.from}_${range.to}.csv`,
        headers,
        rows,
        {
          title: "Laporan Analisis Penggunaan per Item Cat",
          info: [
            `Periode: ${formatRangeLabel(range.from, range.to)}`,
            `Total item: ${summary.length}`,
          ],
          summary: summaryRows,
          numericColumns: [2, 3, 4, 5, 6, 7],
        }
      );
    } finally {
      setIsExportingPaintItem(false);
    }
  };

  return {
    isExportingUsage,
    isExportingTx,
    isExportingPaintItem,
    handleExportDailyUsage,
    handleExportTransactions,
    handleExportPaintItemUsage,
  };
}
