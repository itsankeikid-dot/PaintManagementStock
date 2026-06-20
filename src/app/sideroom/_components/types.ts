import type { PaintItem, Stock } from "@/types/database";

/** Common props shared by all sideroom tab form components. */
export interface SideroomTabFormProps {
  paintItems: PaintItem[];
  selectedPaint: string;
  setSelectedPaint: (v: string) => void;
  qty: number;
  setQty: (v: number) => void;
  notes: string;
  setNotes: (v: string) => void;
  isLoading: boolean;
  stockLevels: Stock[];
  selectedPaintItem?: PaintItem;
  currentStock?: Stock & { paint_items: PaintItem };
  onSubmit: (e: React.FormEvent) => void;
}
