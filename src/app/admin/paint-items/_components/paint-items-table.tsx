import { Pagination } from "@/components/shared/pagination";
import { Palette, Search, Pencil, Trash2, Plus } from "lucide-react";
import type { PaintItem } from "@/types/database";

interface PaintItemsTableProps {
  allItemsCount: number;
  filteredCount: number;
  paginated: PaintItem[];
  searchTerm: string;
  statusFilter: "all" | "active" | "inactive";
  togglingId: string | null;
  onAddClick: () => void;
  onToggle: (id: string, currentActive: boolean) => void;
  onEdit: (item: PaintItem) => void;
  onDelete: (item: PaintItem) => void;
  // pagination
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  rangeLabel?: string;
}

export function PaintItemsTable({
  allItemsCount,
  filteredCount,
  paginated,
  searchTerm,
  statusFilter,
  togglingId,
  onAddClick,
  onToggle,
  onEdit,
  onDelete,
  page,
  totalPages,
  setPage,
  rangeLabel,
}: PaintItemsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {["Item Cat", "Kode Warna", "Ukuran", "Kategori", "Status", "Aksi"].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F8FAFC]">
          {allItemsCount === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Palette className="size-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e344a]">Belum ada item cat</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Tambahkan item cat pertama untuk memulai</p>
                  </div>
                  <button
                    onClick={onAddClick}
                    className="mt-2 inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-white text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Tambah Item Cat
                  </button>
                </div>
              </td>
            </tr>
          ) : filteredCount === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="size-6 text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">
                    Tidak ada item yang cocok
                    {searchTerm && <> dengan &ldquo;{searchTerm}&rdquo;</>}
                    {statusFilter !== "all" && <> (filter: {statusFilter === "active" ? "aktif" : "nonaktif"})</>}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paginated.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-[#FAFBFC] transition-colors duration-100 ${!item.is_active ? "opacity-60" : ""}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: item.color_hex }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-[#1e344a] text-sm whitespace-nowrap">
                      {item.name}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <span className="font-mono text-sm text-[#475569]">{item.color_code}</span>
                </td>

                <td className="px-5 py-3.5">
                  <span className="text-sm text-[#475569] whitespace-nowrap">{item.can_size}</span>
                </td>

                <td className="px-5 py-3.5">
                  <span className="text-sm text-[#475569]">{item.category}</span>
                </td>

                <td className="px-5 py-3.5">
                  {item.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" aria-hidden="true" />
                      Nonaktif
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggle(item.id, item.is_active)}
                      disabled={togglingId === item.id}
                      aria-label={item.is_active ? `Nonaktifkan ${item.name}` : `Aktifkan ${item.name}`}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 whitespace-nowrap ${
                        item.is_active
                          ? "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-red-50 hover:border-red-200 hover:text-red-600 focus-visible:ring-red-400"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-400"
                      }`}
                    >
                      {togglingId === item.id ? "..." : item.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:border-blue-200 hover:text-[#0e7ad5] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      aria-label={`Hapus ${item.name}`}
                      className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        rangeLabel={rangeLabel}
      />
    </div>
  );
}
