import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaintItemForm } from "@/hooks/use-paint-items";

interface PaintItemFormFieldsProps {
  form: PaintItemForm;
  setForm: (form: PaintItemForm) => void;
}

export function PaintItemFormFields({ form, setForm }: PaintItemFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#334155]">Nama Cat</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="contoh: Red Oxide"
          required
          className="h-11 rounded-xl border-[#CBD5E1]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#334155]">Kode Warna</Label>
          <Input
            value={form.color_code}
            onChange={(e) => setForm({ ...form, color_code: e.target.value })}
            placeholder="contoh: R-001"
            required
            className="h-11 rounded-xl border-[#CBD5E1]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#334155]">Warna (Hex)</Label>
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl border-2 border-[#E2E8F0] shrink-0 overflow-hidden">
              <input
                type="color"
                value={form.color_hex}
                onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                className="w-full h-full cursor-pointer border-0 p-0 scale-150"
              />
            </div>
            <Input
              value={form.color_hex}
              onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
              className="h-11 rounded-xl border-[#CBD5E1] font-mono text-sm"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#334155]">Ukuran Kaleng</Label>
          <Input
            value={form.can_size}
            onChange={(e) => setForm({ ...form, can_size: e.target.value })}
            placeholder="contoh: 1 Galon"
            required
            className="h-11 rounded-xl border-[#CBD5E1]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#334155]">Berat per Kaleng (kg)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.weight_per_can || ""}
            onChange={(e) => setForm({ ...form, weight_per_can: parseFloat(e.target.value) || 0 })}
            placeholder="contoh: 18"
            required
            className="h-11 rounded-xl border-[#CBD5E1]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#334155]">Kategori</Label>
        <Input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="contoh: Standard"
          required
          className="h-11 rounded-xl border-[#CBD5E1]"
        />
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
        <div
          className="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0"
          style={{ backgroundColor: form.color_hex }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[#1e344a] text-sm truncate">
            {form.name || "Nama Cat"}
          </p>
          <p className="text-xs text-[#64748B]">
            {form.color_code || "Kode"} · {form.can_size}
            {form.weight_per_can > 0 ? ` · ${form.weight_per_can} kg/kaleng` : ""} · {form.category}
          </p>
        </div>
      </div>
    </>
  );
}
