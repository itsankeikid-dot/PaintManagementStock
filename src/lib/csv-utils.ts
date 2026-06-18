/**
 * Client-side CSV generation and download utility.
 * - BOM prefix (\uFEFF) ensures Excel opens UTF-8 correctly.
 * - "sep=," directive tells Excel to use comma as delimiter
 *   (needed for locales like Indonesia where default is semicolon).
 * - Optional info header, summary rows, and empty-value placeholder.
 */

interface CSVOptions {
  /** Title line at top of file, e.g. "Laporan Penggunaan Cat" */
  title?: string;
  /** Extra info lines below title, e.g. ["Periode: 01/06/2026 – 16/06/2026", "Filter: Aktif"] */
  info?: string[];
  /** Summary rows appended after data, e.g. [["Total", "", "", "150"]] */
  summary?: string[][];
  /** Numeric column indices — values won't be quoted so Excel treats as number */
  numericColumns?: number[];
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: string[][],
  options?: CSVOptions
) {
  const BOM = "\uFEFF";

  const escape = (val: string, colIdx?: number) => {
    // Empty → dash for readability
    if (!val && val !== "0") return "-";
    // Numeric columns: keep raw so Excel treats as number
    if (colIdx !== undefined && options?.numericColumns?.includes(colIdx)) {
      return val;
    }
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines: string[] = [];

  // sep directive
  lines.push("sep=,");

  // Info header block
  if (options?.title) {
    lines.push(escape(options.title));
    lines.push(""); // blank line
  }
  if (options?.info?.length) {
    for (const line of options.info) {
      lines.push(escape(line));
    }
    lines.push(""); // blank line after info
  }

  // Column headers
  lines.push(headers.map((h) => escape(h)).join(","));

  // Data rows
  for (const row of rows) {
    lines.push(row.map((val, i) => escape(val, i)).join(","));
  }

  // Summary rows
  if (options?.summary?.length) {
    lines.push(""); // blank line before summary
    for (const row of options.summary) {
      lines.push(row.map((val, i) => escape(val, i)).join(","));
    }
  }

  // Export timestamp
  const now = new Date();
  const exportTime = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  lines.push("");
  lines.push(`Diekspor pada ${exportTime}`);

  const csvContent = BOM + lines.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
